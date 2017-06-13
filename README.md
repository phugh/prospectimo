# prospectimo

Get the temporal orientation of a string.

## Usage
```Javascript
const prospectimo = require('prospectimo');
const opts = {
  'return': 'lex',         // 'orientation' returns a string, 'lex' (default) returns object of lexical values
  'encoding': 'binary',    // 'binary' (default), or 'frequency' - type of word encoding to use.
  'threshold': -0.98,      // a lexical weight threshold between 1.16 (include nothing), and -0.98 (include everything, default)
  'bigrams': true,         // compare against bigrams in the lexicon?
  'trigrams': true,        // compare against trigrams in the lexicon?
}
const str = "A big long string of text...";
const orientation = prospectimo(str, opts);
console.log(orientation);
```

## Options

### 'return'

Valid options: 'lex' (default), or 'orientation'.

'lex' returns an object with 'PAST', 'PRESENT' and 'FUTURE' keys, each containing a lexical value for that orientation.

'orientation' returns a string stating either 'Past', 'Present', 'Future', or 'Unknown'.

### 'encoding'

Valid options: 'binary' (default), or 'frequency'.

'binary' calculates the lexical value as simply a sum of weights, i.e. weight[1] + weight[2] + etc...

'frequency' calculates the lexical value as (word frequency / total wordcount) * word weight

Unless you have a specific need for frequency encoding, we recommend you use binary only.

### 'threshold'

The lexicon contains weight values that are very small. You can exclude them using the threshold option.

The smallest value in the lexicon is -0.9772179. Therefore a threshold of -0.98 will include all words in the lexicon.

The largest value in the lexicon is 1.15807005. Therefore a threshold of 1.16 will include no words in the lexicon.

### 'bigrams' and 'trigrams'

The lexicon includes strings that are between one and three words in length. By default we will match against these using bi-grams and tri-grams, however you may want to disable these when analysing very long strings to save processing time and memory use.

## Acknowledgements

### References
Park, G., Schwartz, H.A., Sap, M., Kern, M.L., Weingarten, E., Eichstaedt, J.C., Berger, J., Stillwell, D.J., Kosinski, M., Ungar, L.H. & Seligman, M.E. (2015). Living in the Past, Present, and Future: Measuring Temporal Orientation with Language. Journal of personality.

### Lexicon
Using the prospection lexicon data from http://www.wwbp.org/lexica.html

Used under the [Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported](http://creativecommons.org/licenses/by-nc-sa/3.0/)

# Licence
(C) 2017 [P. Hughes](www.phugh.es)

[Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported](http://creativecommons.org/licenses/by-nc-sa/3.0/)
