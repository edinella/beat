var Errors = require('./Errors');
var BeatError = Errors.BeatError;

module.exports = function generateAlias(aliasCandidate) {
  if(typeof aliasCandidate !== 'string' && typeof aliasCandidate !== 'number') {
    throw new BeatError('Invalid key "'+aliasCandidate+'". Expected string or number.');
  }
  return snakeCaseToCamelCase(''+aliasCandidate);
};

function snakeCaseToCamelCase(str) {
  return str.replace(/(\-\w)/g, function(match) {
    return match[1].toUpperCase();
  });
}