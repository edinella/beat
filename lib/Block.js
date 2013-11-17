var Errors = require('./Errors');
var BeatError = Errors.BeatError;

var Block = module.exports = function Block(fn, deps) {
  if(deps instanceof Array) {
    fn._deps = deps;
    return fn;
  }
  if(fn instanceof Array) {
    return new Block(fn.pop(), fn);
  }
  if(typeof fn === 'function') {
    var match = fn.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m);
    var deps = match && match[1] && match[1].split(',').map(function(arg) {
      var match = arg.match(/\/\*([^\*]*)\*\//m);
      return match ? match[1].trim() : arg.trim();
    }) || [];
    return new Block(fn, deps);
  }
  throw new BeatError('Can not resolve block "'+fn+'". Expected a function.');
};