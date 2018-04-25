/**
 * prospectimo
 * v2.0.0
 *
 * Analyse the temporal orientation of a string.
 *
 * Help me make this better:
 * https://github.com/phugh/prospectimo
 *
 * Based on this paper:
 * Park, G., Schwartz, H.A., Sap, M., Kern, M.L., Weingarten, E., Eichstaedt,
 * J.C., Berger, J., Stillwell, D.J., Kosinski, M., Ungar, L.H. &
 * Seligman, M.E. (2015).
 * Living in the Past, Present, and Future: Measuring Temporal Orientation with
 * Language. Journal of personality.
 *
 * Using the prospection lexicon data from http://www.wwbp.org/lexica.html
 * Used under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0
 * Unported licence
 *
 * (C) 2017 P. Hughes
 * Licence : Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
 * http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * Usage example:
 * const prospectimo = require('prospectimo');
 * const opts = {
 *  'encoding': 'binary',
 *  'max': Number.POSITIVE_INFINITY,
 *  'min': Number.NEGATIVE_INFINITY,
 *  'nGrams': 'true',
 *  'output': 'orientation',
 *  'places': 9,
 *  'sortBy': 'freq',
 *  'wcGrams': 'false',
 * };
 * const str = 'A big long string of text...';
 * const orientation = prospectimo(str, opts);
 * console.log(orientation)
 *
 * See README.md for help.
 *
 * @param {string} str  input string
 * @param {Object} opts options
 * @return {(Object|string)}
 */

'use strict'
;(function() {
  const global = this;
  const previous = global.prospectimo;

  let async = global.async;
  let lexHelpers = global.lexHelpers;
  let lexicon = global.lexicon;
  let simplengrams = global.simplengrams;
  let tokenizer = global.tokenizer;

  if (typeof lexicon === 'undefined') {
    if (typeof require !== 'undefined') {
      async = require('async');
      lexHelpers = require('lex-helpers');
      lexicon = require('./data/lexicon.json');
      simplengrams = require('simplengrams');
      tokenizer = require('happynodetokenizer');
    } else throw new Error('prospectimo required modules not found!');
  }

  const arr2string = lexHelpers.arr2string;
  const calcLex = lexHelpers.calcLex;
  const getMatches = lexHelpers.getMatches;
  const prepareMatches = lexHelpers.prepareMatches;
  const itemCount = lexHelpers.itemCount;



  /**
   * @function doLex
   * @param  {Object} matches   lexical matches object
   * @param  {number} places    decimal places limit
   * @param  {string} encoding  type of lexical encoding
   * @param  {number} wordcount total word count
   * @return {Object} lexical values object
   */
  const doLex = (matches, places, encoding, wordcount) => {
    const values = {};
    const ints = {
      PAST: (-0.649406376419),
      PRESENT: 0.236749577324,
      FUTURE: (-0.570547567181),
    };
    async.each(Object.keys(matches), function(cat, callback) {
      values[cat] = calcLex(matches[cat], ints[cat], places, encoding, 
          wordcount);
      callback();
    }, function(err) {
      if (err) console.error(err);
    });
    return values;
  };

  /**
  * Converts the lexical values object to an orientation string
  * @function getOrientation
  * @param  {Object} obj    lexical values object
  * @return {string} 'Past', 'Present', 'Future', or 'Unknown'
  */
  const getOrientation = (obj) => {
    const a = [obj.PAST, obj.PRESENT, obj.FUTURE];
    const indexOfMaxValue = a.reduce(
      (iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0
    );
    let orientation = `Unknown`;
    if (indexOfMaxValue === 0) {
      orientation = 'Past';
    } else if (indexOfMaxValue === 1) {
      orientation = 'Present';
    } else if (indexOfMaxValue === 2) {
      orientation = 'Future';
    }
    return orientation;
  };

  /**
   * Analyse the temporal orientation of a string
   * @function prospectimo
   * @param {string} str    input string
   * @param {Object} opts   options
   * @return {(Object|string)}
   */
  const prospectimo = (str, opts) => {
    // no string return null
    if (!str) {
      console.error('prospectimo: no input found! Returning null.');
      return null;
    }
    // if str isn't a string, make it into one
    if (typeof str !== 'string') str = str.toString();
    // trim whitespace and convert to lowercase
    str = str.toLowerCase().trim();
    // options defaults
    if (!opts || typeof opts !== 'object') {
      opts = {
        'encoding': 'binary',
        'max': Number.POSITIVE_INFINITY,
        'min': Number.NEGATIVE_INFINITY,
        'nGrams': 'true',
        'output': 'orientation',
        'places': 9,
        'sortBy': 'freq',
        'wcGrams': 'false',
      };
    }
    opts.encoding = opts.encoding || 'binary';
    opts.max = opts.max || Number.POSITIVE_INFINITY;
    opts.min = opts.min || Number.NEGATIVE_INFINITY;
    opts.nGrams = opts.nGrams || 'true';
    opts.output = opts.output || 'orientation';
    opts.places = opts.places || 9;
    opts.sortBy = opts.sortBy || 'freq';
    opts.wcGrams = opts.wcGrams || 'false';
    const encoding = opts.encoding;
    const output = opts.output;
    const places = opts.places;
    const sortBy = opts.sortBy;
    // convert our string to tokens
    let tokens = tokenizer(str);
    // if there are no tokens return null
    if (!tokens) {
      console.warn('prospectimo: no tokens found. Returned null.');
      return null;
    }
    // get wordcount before we add ngrams
    let wordcount = tokens.length;
    // get n-grams
    if (opts.nGrams.toLowerCase() === 'true') {
      const bigrams = arr2string(simplengrams(str, 2));
      const trigrams = arr2string(simplengrams(str, 3));
      tokens = tokens.concat(bigrams, trigrams);
    }
    // recalculate wordcount if wcGrams is true
    if (opts.wcGrams.toLowerCase() === 'true') wordcount = tokens.length;
    // get matches from array
    const matches = getMatches(tokens, lexicon, opts.min, opts.max);
    if (output === 'matches') {
      return doMatches(matches, sortBy, wordcount, places, encoding);
    } else if (output === 'full') {
      const full = {
        matches: doMatches(matches, sortBy, wordcount, places, encoding),
        values: doValues(matches, places, encoding, wordcount),
      };
      return full;
    } else if (output === 'lex') {
      return doValues(matches, places, encoding, wordcount);
    } else {
      if (output !== 'orientation') {
        console.warn('prospectimo: output option ("' + output +
            '") is invalid, defaulting to "orientation".');
      }
      return getOrientation(doValues(matches, places, encoding, wordcount));
    }
  };

  prospectimo.noConflict = function() {
    global.prospectimo = previous;
    return prospectimo;
  };

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = prospectimo;
    }
    exports.prospectimo = prospectimo;
  } else {
    global.prospectimo = prospectimo;
  }
}).call(this);
