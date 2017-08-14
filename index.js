/**
 * prospectimo
 * v0.4.0
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
 *  'threshold': -0.38      //
 * }
 * const str = "A big long string of text...";
 * const orientation = prospectimo(str, opts);
 * console.log(orientation)
 *
 * @param {string} str  input string
 * @param {Object} opts options
 * @return {(Object||string)} temporal orientation or lexical value based on opts
 */

'use strict'
;(function () {
  const root = this
  const previous = root.prospectimo

  let lexicon = root.lexicon
  let simplengrams = root.simplengrams
  let tokenizer = root.tokenizer

  if (typeof lexicon === 'undefined') {
    if (typeof require !== 'undefined') {
      lexicon = require('./data/lexicon.json')
      simplengrams = require('simplengrams')
      tokenizer = require('happynodetokenizer')
    } else throw new Error('prospectimo requires happynodetokenizer and simplengrams, and ./data/lexicon.json')
  }

    /**
   * Get the indexes of duplicate elements in an array
   * @function indexesOf
   * @param  {Array} arr input array
   * @param  {string} el element to test against
   * @return {Array} array of indexes
   */
  const indexesOf = (arr, el) => {
    const idxs = []
    let i = arr.length
    while (i--) {
      if (arr[i] === el) {
        idxs.unshift(i)
      }
    }
    return idxs
  }

  /**
   * Combines multidimensional array elements into strings
   * @function arr2string
   * @param  {Array} arr input array
   * @return {Array} output array
   */
  const arr2string = arr => {
    let i = 0
    const len = arr.length
    const result = []
    for (i; i < len; i++) {
      result.push(arr[i].join(' '))
    }
    return result
  }

  /**
  * Loop through lexicon and match against array
  * @function getMatches
  * @param  {Array} arr token array
  * @param  {number} threshold  min. weight threshold
  * @return {Object} object of matches
  */
  const getMatches = (arr, threshold) => {
    // error prevention
    if (arr == null) return null
    if (threshold == null) threshold = -999
    if (typeof threshold !== 'number') threshold = Number(threshold)
    // loop through categories in lexicon
    const matches = {}
    let category
    for (category in lexicon) {
      if (!lexicon.hasOwnProperty(category)) continue
      let match = []
      let word
      let data = lexicon[category]
      // loop through words in category
      for (word in data) {
        if (!data.hasOwnProperty(word)) continue
        let weight = data[word]
        // if word from input matches word from lexicon ...
        if (arr.indexOf(word) > -1 && weight > threshold) {
          let count = indexesOf(arr, word).length // number of times the word appears in the input text
          match.push([word, count, weight])
        }
      }
      matches[category] = match
    }
    return matches
  }

  /**
  * Calculate the total lexical value of matches
  * @function calcLex
  * @param {Object} obj matches object
  * @param {number} wc wordcount
  * @param {number} int intercept value
  * @param {string} enc encoding
  * @return {number} lexical value
  */
  const calcLex = (obj, wc, int, enc) => {
    if (obj == null) return null
    let lex = 0
    let word
    for (word in obj) {
      if (!obj.hasOwnProperty(word)) continue
      if (enc === 'binary' || enc == null || wc == null) {
        // weight + weight + weight etc
        lex += Number(obj[word][2])
      } else {
        // (frequency / wordcount) * weight
        lex += (Number(obj[word][1]) / Number(wc)) * Number(obj[word][2])
      }
    }
    if (int != null) lex += Number(int)
    return lex
  }

  /**
  * Converts the lexical values object to an orientation string
  * @function getOrientation
  * @param  {Object} obj lexical values object
  * @return {string} 'Past', 'Present', or 'Future'
  */
  const getOrientation = obj => {
    const a = [obj.PAST, obj.PRESENT, obj.FUTURE]
    const indexOfMaxValue = a.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0)

    let orientation = `No temporal orientation detected.`
    if (indexOfMaxValue === 0) {
      orientation = 'Past'
    } else if (indexOfMaxValue === 1) {
      orientation = 'Present'
    } else if (indexOfMaxValue === 2) {
      orientation = 'Future'
    }
    return orientation
  }

  /**
  * Analyse the temporal orientation of a string
  * @function prospectimo
  * @param {string} str  input string
  * @param {Object} opts options
  * @return {(Object||string)} temporal orientation or lexical value based on opts
  */
  const prospectimo = (str, opts) => {
    // error prevention
    if (str == null) return null
    if (typeof str !== 'string') str = str.toString()
    // default options
    if (opts == null) {
      opts = {
        'return': 'lex',
        'encoding': 'binary',
        'threshold': -999
      }
    }
    opts.return = opts.return || 'lex'
    opts.encoding = opts.encoding || 'binary'
    opts.threshold = opts.threshold || -999
    // convert to lowercase and trim whitespace
    str = str.toLowerCase().trim()
    // convert our string to tokens
    let tokens = tokenizer(str)
    // if no tokens return null
    if (tokens == null) return null
    // get wordcount before we add n-grams
    const wordcount = tokens.length
    // get n-grams
    const ngrams = []
    ngrams.push(arr2string(simplengrams(str, 2)))
    ngrams.push(arr2string(simplengrams(str, 3)))
    const nLen = ngrams.length
    let i = 0
    for (i; i < nLen; i++) {
      tokens = tokens.concat(ngrams[i])
    }
    // get matches from array
    const matches = getMatches(tokens, opts.threshold)
    // calculate lexical useage
    const enc = opts.encoding
    const lex = {}
    lex.PAST = calcLex(matches.PAST, wordcount, (-0.649406376419), enc)
    lex.PRESENT = calcLex(matches.PRESENT, wordcount, 0.236749577324, enc)
    lex.FUTURE = calcLex(matches.FUTURE, wordcount, (-0.570547567181), enc)
    // predict and return
    if (opts.return === 'lex') return lex
    return getOrientation(lex)
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
