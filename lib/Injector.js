var Provide = require('./Provide');

var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var INSTANTIATING = {};

var Injector = module.exports = function Injector() {
  this.path = [];
  this.cache = {};
  this.cache.$provide = new Provide(this);
  this.cache.$injector = this;
};

Injector.prototype.annotate = function annotate(fn) {
  var $inject;
  var fnText;
  var argDecl;
  if(typeof fn == 'function') {
    if(!($inject = fn.$inject)) {
      $inject = [];
      if (fn.length) {
        fnText = fn.toString().replace(STRIP_COMMENTS, '');
        argDecl = fnText.match(FN_ARGS);
        argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg) {
          arg.replace(FN_ARG, function(all, underscore, name) {
            $inject.push(name);
          });
        });
      }
      fn.$inject = $inject;
    }
  }
  else if(fn instanceof Array) {
    $inject = fn.slice(0, fn.length - 1);
  }
  return $inject;
};

Injector.prototype.get = function get(name) {
  if(this.cache.hasOwnProperty(name)) {
    if(this.cache[name] === INSTANTIATING) {
      throw new Error('Circular dependency found: '+this.path.join(' <- '));
    }
    return this.cache[name];
  }
  else {
    try {
      this.path.unshift(name);
      this.cache[name] = INSTANTIATING;
      if(/Provider$/.test(name)) {
        throw new Error('Unknown provider: '+this.path.join(' <- '));
      }
      var provider = this.get(name + 'Provider');
      return this.cache[name] = this.invoke(provider.$get, provider);
    } finally {
      this.path.shift();
    }
  }
};

Injector.prototype.has = function has(name) {
  return this.cache.hasOwnProperty(name + 'Provider') || this.cache.hasOwnProperty(name);
};

Injector.prototype.instantiate = function instantiate(Type, locals) {
  var Constructor = function() {};
  var returnedValue;
  Constructor.prototype = (Type instanceof Array ? Type[Type.length - 1] : Type).prototype;
  var instance = new Constructor();
  returnedValue = this.invoke(Type, instance, locals);
  return typeof returnedValue === 'object' || typeof returnedValue === 'function'
    ? returnedValue
    : instance;
};

Injector.prototype.invoke = function invoke(fn, self, locals) {
  var args = [];
  var $inject = this.annotate(fn);
  var key;
  var length = $inject.length;
  for(var i=0;i<length;i++) {
    key = $inject[i];
    args.push(
        locals && locals.hasOwnProperty(key)
        ? locals[key]
        : this.get(key)
      );
  }
  if(!fn.$inject) {
    fn = fn[length];
  }
  return fn.apply(self, args);
};
