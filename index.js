/* jshint node: true, esversion:6, laxbreak: true */
/**
 * prospectimo
 * v0.0.1
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
 *  'return': 'orientation', // 'orientation' return string, 'lex' returns object of lexical values
 *  'more': false            // add more information to returned string if return = 'orientation'
 * }
 * const text = "A big long string of text...";
 * let orientation = prospectimo(text, opts);
 * console.log(orientation)
 *
 * @param {string} str  {input string}
 * @param {object} opts {options}
 * @return {string} {temporal orientation}
 */

'use strict'
;(function () {
  const root = this
  const previous = root.prospectimo

  const hasRequire = typeof require !== 'undefined'

  let tokenizer = root.tokenizer
  let lexicon = root.lexicon

  if (typeof _ === 'undefined') {
    if (hasRequire) {
      tokenizer = require('happynodetokenizer')
      lexicon = require('./data/lexicon.json')
    } else throw new Error('prospectimo required happynodetokenizer and ./data/lexicon.json')
  }

  // get multiple indexes helper
  Array.prototype.indexesOf = function (el) {
    var idxs = []
    for (var i = this.length - 1; i >= 0; i--) {
      if (this[i] === el) {
        idxs.unshift(i)
      }
    }
    return idxs
  }

  const getMatches = (arr) => {
    let matches = {}
    for (let cat in lexicon) {
      if (!lexicon.hasOwnProperty(cat)) continue
      let match = []
      for (let key in lexicon[cat]) {
        if (!lexicon[cat].hasOwnProperty(key)) continue
        let word = key
        if (arr.indexOf(word) > -1) {
          let item
          let weight = lexicon[cat][key]
          let reps = arr.indexesOf(word).length
          if (reps > 1) {
            let words = []
            for (let i = 0; i < reps; i++) {
              words.push(word)
            }
            item = [words, weight]
          } else {
            item = [word, weight]
          }
          match.push(item)
        }
        matches[cat] = match
      }
    }
    return matches
  }

  const calcLex = (obj, wc, int) => {
    let lex
    let counts = []
    let weights = []
    for (let key in obj) {
      if (!obj.hasOwnProperty(key)) continue
      if (Array.isArray(obj[key][0])) {
        counts.push(obj[key][0].length)
      } else {
        counts.push(1)
      }
      weights.push(obj[key][1])
    }
    let sums = []
    counts.forEach(function (a, b) {
      let sum = (a / wc) * weights[b]
      sums.push(sum)
    })
    lex = sums.reduce(function (a, b) { return a + b }, 0)
    lex = Number(lex) + Number(int)
    return lex
  }

  const getValues = (arr) => {
    // get matches from array
    const matches = getMatches(arr)

    // get wordcount
    const wordcount = arr.length

    // calculate lexical useage
    let lex = {}
    lex['PAST'] = calcLex(matches['PAST'], wordcount, (-0.649406376419))
    lex['PRESENT'] = calcLex(matches['PRESENT'], wordcount, 0.236749577324)
    lex['FUTURE'] = calcLex(matches['FUTURE'], wordcount, (-0.570547567181))

    return lex
  }

  const getOrientation = (obj, more) => {
    const a = [obj['PAST'], obj['PRESENT'], obj['FUTURE']]
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
      if (more) {
        str = `No temporal orientation association detected. ${ori} scored highest at ${a[indexOfMaxValue]}.`
      } else {
        str = `No temporal orientation association detected.`
      }
    } else {
      if (more) {
        str = `${ori} ${a[indexOfMaxValue]}`
      } else {
        str = ori
      }
    }
    return str
  }

  const prospectimo = (str, opts) => {
    // make sure there is input before proceeding
    if (str == null) throw new Error('Whoops! No input string found!')

    // default options
    if (opts == null) {
      opts = {
        'return': 'orientation',
        'more': false
      }
    }
    opts.return = opts.return || 'orientation'
    opts.more = opts.more || false

    // convert our string to tokens
    const tokens = tokenizer(str)

    // get lex values
    const lex = getValues(tokens)

    // get orientation
    const orientation = getOrientation(lex, opts.more)

    // predict and return
    if (opts.return === 'lex') {
      return lex
    } else {
      return orientation
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
