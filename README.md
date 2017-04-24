# prospectimo

Analyse the temporal orientation of a string.

## Usage
```Javascript
const prospectimo = require('prospectimo');
const opts = {
  'return': 'orientation', // 'orientation' return string, 'lex' returns object of lexical values
  'more': false            // add more information to returned string if return = 'orientation'
}
const text = "A big long string of text...";
let orientation = prospectimo(text, opts);
console.log(orientation)
```

## Acknowledgements

### References
Park, G., Schwartz, H.A., Sap, M., Kern, M.L., Weingarten, E., Eichstaedt, J.C., Berger, J., Stillwell, D.J., Kosinski, M., Ungar, L.H. & Seligman, M.E. (2015). Living in the Past, Present, and Future: Measuring Temporal Orientation with Language. Journal of personality.

### Lexicon
Using the prospection lexicon data from http://www.wwbp.org/lexica.html
Used under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported licence

# Licence
(C) 2017 P. Hughes
Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
[Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported](http://creativecommons.org/licenses/by-nc-sa/3.0/)
