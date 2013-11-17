var util = require('util');
var Errors = require('./Errors');
var BeatError = Errors.BeatError;

var Stack = module.exports = function Stack(moduleAlias) {
  Array.call(this);
  this.moduleAlias = moduleAlias;
};

util.inherits(Stack, Array);

Stack.prototype.contains = function contains(alias) {
  return this.indexOf(alias) !== -1;
};

Stack.prototype.reset = function reset() {
  this.length = 0;
};

Stack.prototype.error = function error(msg) {
  this.unshift(this.moduleAlias);
  var stack = '"'+this.join('" -> "')+'"';
  this.reset();
  return new BeatError(msg+' at '+stack);
};