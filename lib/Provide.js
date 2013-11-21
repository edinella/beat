var Provide = module.exports = function Provide(injector) {
  this.injector = injector;
};

Provide.prototype.provider = function provider(name, prov) {
  if(typeof prov === 'function' || prov instanceof Array) {
    prov = this.injector.instantiate(prov);
  }
  if(!prov.$get) {
    throw new Error('Provider "'+name+'" must define $get factory method');
  }
  return this.injector.cache[name + 'Provider'] = prov;
};

Provide.prototype.value = function value(name, val) {
  return this.factory(name, function() {
    return val;
  });
};

Provide.prototype.factory = function factory(name, fn) {
  return this.provider(name, {$get: fn});
};

Provide.prototype.service = function service(name, constructor) {
  return this.factory(name, function($injector) {
    return $injector.instantiate(constructor);
  });
};

Provide.prototype.decorator = function decorator(serviceName, decorFn) {
  var origProvider = this.injector.get(serviceName + 'Provider');
  var orig$get = origProvider.$get;
  var self = this;
  origProvider.$get = function() {
    var origInstance = self.injector.invoke(orig$get, origProvider);
    return self.injector.invoke(decorFn, null, {$delegate: origInstance});
  };
};
