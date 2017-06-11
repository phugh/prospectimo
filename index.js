/**
 * prospectimo
 * v0.2.0
 *
 * Analyse the temporal orientation of a string.
 *
 * Help me make this better:
 * https://github.com/phugh/prospectimo
 *
 * Based on this paper:
 * Park, G., Schwartz, H.A., Sap, M., Kern, M.L., Weingarten, E., Eichstaedt, J.C., Berger, J., Stillwell, D.J., Kosinski, M., Ungar, L.H. & Seligman, M.E. (2015). Living in the Past, Present, and Future: Measuring Temporal Orientation with Language. Journal of personality.
 * Using the prospection lexicon data from http://www.wwbp.org/lexica.html
 * Used under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported licence
 *
 * (C) 2017 P. Hughes
 * Licence : Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
 * http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * Usage example:
 * const prospectimo = require('prospectimo');
 * const opts = {
 *  'return': 'lex',         // 'orientation' returns a string, 'lex' (default) returns object of lexical values
 *  'encoding': 'binary',    // 'binary' (default), or 'frequency' - type of word encoding to use.
 *  'bigrams': true,         // compare against bigrams in the lexicon?
 *  'trigrams': true,        // compare against trigrams in the lexicon?
 * }
 * const text = "A big long string of text...";
 * const orientation = prospectimo(text, opts);
 * console.log(orientation)
 *
 * @param {string} str  input string
 * @param {Object} opts options
 * @return {string|number} temporal orientation or lexical value based on opts
 */

'use strict'
;(function () {
  const root = this
  const previous = root.prospectimo

  let tokenizer = root.tokenizer
  let lexicon = root.lexicon
  let natural = root.natural

  if (typeof tokenizer === 'undefined') {
    const hasRequire = typeof require !== 'undefined'
    if (hasRequire) {
      tokenizer = require('happynodetokenizer')
      lexicon = require('./data/lexicon.json')
      natural = require('natural')
    } else throw new Error('prospectimo required happynodetokenizer and ./data/lexicon.json')
  }

  // get multiple indexes helper
  Array.prototype.indexesOf = function (el) {
    const idxs = []
    let i = this.length - 1
    for (i; i >= 0; i--) {
      if (this[i] === el) {
        idxs.unshift(i)
      }
    }
    return idxs
  }

  /**
  * @function getBigrams
  * @param  {string} str input string
  * @return {Array} array of bigram strings
  */
  const getBigrams = str => {
    const NGrams = natural.NGrams
    const bigrams = NGrams.bigrams(str)
    const result = []
    const len = bigrams.length
    let i = 0
    for (i; i < len; i++) {
      result.push(bigrams[i].join(' '))
    }
    return result
  }

  /**
  * @function getTrigrams
  * @param  {string} str input string
  * @return {Array} array of trigram strings
  */
  const getTrigrams = str => {
    const NGrams = natural.NGrams
    const trigrams = NGrams.trigrams(str)
    const result = []
    const len = trigrams.length
    let i = 0
    for (i; i < len; i++) {
      result.push(trigrams[i].join(' '))
    }
    return result
  }

  const getMatches = (arr) => {
    const matches = {}
    let category
    for (category in lexicon) {
      if (!lexicon.hasOwnProperty(category)) continue
      let match = []
      let key
      let data = lexicon[category]
      for (key in data) {
        if (!data.hasOwnProperty(key)) continue
        if (arr.indexOf(key) > -1) {
          let item
          let weight = data[key]
          let reps = arr.indexesOf(key).length
          if (reps > 1) {
            let words = []
            for (let i = 0; i < reps; i++) {
              words.push(key)
            }
            item = [words, weight]
          } else {
            item = [key, weight]
          }
          match.push(item)
        }
        matches[category] = match
      }
    }
    return matches
  }

  const calcLex = (obj, wc, int, enc) => {
    const counts = []
    const weights = []
    let key
    for (key in obj) {
      if (!obj.hasOwnProperty(key)) continue
      if (Array.isArray(obj[key][0])) {
        counts.push(obj[key][0].length)
      } else {
        counts.push(1)
      }
      weights.push(obj[key][1])
    }
    let lex = 0
    let i
    const len = counts.length
    const words = Number(wc)
    for (i = 0; i < len; i++) {
      let weight = Number(weights[i])
      if (enc === 'frequency') {
        let count = Number(counts[i])
        lex += (count / words) * weight
      } else {
        lex += weight
      }
    }
    // add intercept value
    lex += int
    // return final lexical value
    return lex
  }

  const getOrientation = obj => {
    const a = [obj.PAST, obj.PRESENT, obj.FUTURE]
    const indexOfMaxValue = a.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0)

    let ori
    if (indexOfMaxValue === 0) {
      ori = 'past'
    } else if (indexOfMaxValue === 1) {
      ori = 'present'
    } else if (indexOfMaxValue === 2) {
      ori = 'future'
    }

    let str
    if (a[indexOfMaxValue] < 0) {
      str = `No temporal orientation association detected.`
    } else {
      str = ori
    }
    return str
  }

  const prospectimo = (str, opts) => {
    // make sure there is input before proceeding
    if (str == null) return null
    // if str isn't a string, make it into one
    if (typeof str !== 'string') str = str.toString()
    // trim whitespace and convert to lowercase
    str = str.toLowerCase().trim()
    // default options
    if (opts == null) {
      opts = {
        'return': 'lex',
        'encoding': 'binary',
        'bigrams': true,      // match bigrams?
        'trigrams': true      // match trigrams?
      }
    }
    opts.return = opts.return || 'lex'
    opts.encoding = opts.encoding || 'binary'
    // convert our string to tokens
    let tokens = tokenizer(str)
    // if no tokens return null
    if (tokens == null) return { PAST: 0, PRESENT: 0, FUTURE: 0 }
    // get wordcount
    const wordcount = tokens.length
    // handle bigrams if wanted
    if (opts.bigrams) {
      const bigrams = getBigrams(str)
      tokens = tokens.concat(bigrams)
    }
    // handle trigrams if wanted
    if (opts.trigrams) {
      const trigrams = getTrigrams(str)
      tokens = tokens.concat(trigrams)
    }
    // get matches from array
    const matches = getMatches(tokens)
    // calculate lexical useage
    const enc = opts.encoding
    const lex = {}
    lex.PAST = calcLex(matches.PAST, wordcount, (-0.649406376419), enc)
    lex.PRESENT = calcLex(matches.PRESENT, wordcount, 0.236749577324, enc)
    lex.FUTURE = calcLex(matches.FUTURE, wordcount, (-0.570547567181), enc)
    // predict and return
    if (opts.return === 'lex') {
      return lex
    } else {
      return getOrientation(lex)
    }
  }

  prospectimo.noConflict = function () {
    root.prospectimo = previous
    return prospectimo
  }

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = prospectimo
    }
    exports.prospectimo = prospectimo
  } else {
    root.prospectimo = prospectimo
  }
}).call(this)
