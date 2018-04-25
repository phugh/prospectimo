/**
 * prospectimo
 * v3.0.0
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
 *  'locale': 'US',
 *  'logs': 3,
 *  'max': Number.POSITIVE_INFINITY,
 *  'min': Number.NEGATIVE_INFINITY,
 *  'nGrams': [2, 3],
 *  'output': 'lex',
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
 * @return {Object}
 */

(function() {
  'use strict';

  // Lexicon data
  const lexicon = require('./data/lexicon.json');

  // External modules
  const async = require('async');
  const trans = require('british_american_translate');
  const simplengrams = require('simplengrams');
  const tokenizer = require('happynodetokenizer');
  const lexHelpers = require('lex-helpers');
  const arr2string = lexHelpers.arr2string;
  const doLex = lexHelpers.doLex;
  const doMatches = lexHelpers.doMatches;
  const getMatches = lexHelpers.getMatches;
  const itemCount = lexHelpers.itemCount;

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
   * @return {Object}
   */
  const prospectimo = (str, opts = {}) => {
    // default options
    opts.encoding = (typeof opts.encoding !== 'undefined') ? opts.encoding : 'binary';
    opts.locale = (typeof opts.locale !== 'undefined') ? opts.locale : 'US';
    opts.logs = (typeof opts.logs !== 'undefined') ? opts.logs : 3;
    if (opts.suppressLog) opts.logs = 0;
    opts.max = (typeof opts.max !== 'undefined') ? opts.max : Number.POSITIVE_INFINITY;
    opts.min = (typeof opts.min !== 'undefined') ? opts.min : Number.NEGATIVE_INFINITY;
    if (typeof opts.max !== 'number' || typeof opts.min !== 'number') {
      // try to convert to a number
      opts.min = Number(opts.min);
      opts.max = Number(opts.max);
      // check it worked, or else default to infinity
      opts.max = (typeof opts.max !== 'number') ? opts.max : Number.POSITIVE_INFINITY;
      opts.min = (typeof opts.min !== 'number') ? opts.min : Number.NEGATIVE_INFINITY;
    }
    opts.nGrams = (typeof opts.nGrams !== 'undefined') ? opts.nGrams : [2, 3];
    if (!Array.isArray(opts.nGrams)) {
      if (opts.logs > 1) {
        console.warn('prospectimo: nGrams option must be an array! ' + 
            'Defaulting to [2, 3].');
      }
      opts.nGrams = [2, 3];
    }
    opts.output = (typeof opts.output !== 'undefined') ? opts.output : 'lex';
    opts.places = (typeof opts.places !== 'undefined') ? opts.places : 9;
    opts.sortBy = (typeof opts.sortBy !== 'undefined') ? opts.sortBy : 'freq';
    opts.wcGrams = (typeof opts.wcGrams !== 'undefined') ? opts.wcGrams : false;
    // cache frequently used options
    const encoding = opts.encoding;
    const logs = opts.logs;
    const nGrams = opts.nGrams;
    const output = opts.output;
    const places = opts.places;
    const sortBy = opts.sortBy;
    // no string return null
    if (!str) {
      if (logs > 1) console.warn('prospectimo: no input found! Returning null.');
      return null;
    }
    // if str isn't a string, make it into one
    if (typeof str !== 'string') str = str.toString();
    // trim whitespace and convert to lowercase
    str = str.toLowerCase().trim();
    // translalte US English to UK English if selected
    if (opts.locale === 'GB') str = trans.uk2us(str);
    // convert our string to tokens
    let tokens = tokenizer(str, {logs: opts.logs});
    // if there are no tokens return null
    if (!tokens) {
      if (logs > 1) console.warn('prospectimo: no tokens found. Returned null.');
      return null;
    }
    // get wordcount before we add ngrams
    let wordcount = tokens.length;
    // get n-grams
    if (nGrams) {
      async.each(nGrams, function(n, callback) {
        if (wordcount < n) {
          callback(`prospectimo: wordcount (${wordcount}) less than n-gram value (${n}). Ignoring.`);
        } else {
          tokens = [...arr2string(simplengrams(str, n, {logs: logs})), ...tokens];
          callback();
        }
      }, function(err) {
        if (err && logs > 0) console.error('prospectimo: nGram error: ', err);        
      });
    }
    // recalculate wordcount if wcGrams is true
    if (opts.wcGrams) wordcount = tokens.length;    
    // get matches from array
    const matches = getMatches(itemCount(tokens), lexicon, opts.min, opts.max);
    // define intercept values
    const ints = {
      PAST: (-0.649406376419),
      PRESENT: 0.236749577324,
      FUTURE: (-0.570547567181),
    };
    // returns
    if (output.match(/matches/gi)) {
      return doMatches(matches, sortBy, wordcount, places, encoding);
    } else if (output.match(/full/gi)) {
      async.parallel({
        matches: function(callback) {
          callback(null, doMatches(matches, sortBy, wordcount, places, encoding));
        },
        values: function(callback) {
          callback(null, doLex(matches, ints, places, encoding, wordcount));
        },
      }, function(err, results) {
        if (err && logs > 0) console.error(err);
        return results;
      });
    } else if (output.match(/orientation/gi)) {
      return getOrientation(doLex(matches, ints, places, encoding, wordcount));
    } else {
      if (!output.match(/lex/gi) && logs > 1) {
        console.warn('prospectimo: output option ("' + output +
            '") is invalid, defaulting to "lex".');
      }
      // default to lexical values
      return doLex(matches, ints, places, encoding, wordcount);
    }
  };

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = prospectimo;
    }
    exports.prospectimo = prospectimo;
  } else {
    global.prospectimo = prospectimo;
  }
})();
