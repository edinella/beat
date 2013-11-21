var Injector = require('./Injector');
var Provide = require('./Provide');

var Beat = module.exports = function Beat(alias, modulesInfo) {
  this.alias = (alias || 'unnamed').toString();
  this.injector = new Injector();
  this.provide = this.injector.get('$provide');
  this.loadModules(modulesInfo);
};

Beat.prototype.require = function require(path) {
  return require(path);
};

Beat.prototype.loadModules = function loadModules(modulesInfo) {
  modulesInfo = modulesInfo || [];
  for(var i=0,l=modulesInfo.length;i<l;i++) {
    var alias;
    var info = modulesInfo[i];
    var path = info;
    if(typeof info === 'string') {
      alias = info;
    } else {
      for(var a in info) {
        if(info.hasOwnProperty(a)) {
          path = modulesInfo[i][a];
          alias = a;
          break;
        }
      }
    }
    if(typeof alias !== 'string') {
      throw new Error('Can not resolve alias for module reference "'+info+'". Expected a string or plain object.');
    }
    var module = path;
    if(typeof path === 'string') {
      path = path.replace(/^\//, process.cwd()+'/');
      module = this.require(path);
    }
    if(module instanceof Beat) {
      this.load(module);
    }
    else {
      this.value(alias, module);
    }
  }
};

Beat.prototype.load = function load(beat) {
  if(!beat instanceof Beat) {
    throw this.stack.error('Can not load Beat "'+beat+'". Expected a instance of Beat.');
  }
  var self = this;
  for(var key in beat.injector.cache) {
    if(beat.injector.cache.hasOwnProperty(key)) {
      self.injector.cache[key] = beat.injector.cache[key];
    }
  }
  return this;
};

Beat.prototype.provider = function provider(name, prov) {
  this.provide.provider(name, prov);
  return this;
};

Beat.prototype.value = function value(name, val) {
  this.provide.value(name, val);
  return this;
};

Beat.prototype.factory = function factory(name, fn) {
  this.provide.factory(name, fn);
  return this;
};

Beat.prototype.service = function factory(name, constructor) {
  this.provide.service(name, constructor);
  return this;
};

Beat.prototype.get = function get(name) {
  return this.injector.get(name);
};

Beat.prototype.run = function run(fn) {
  this.injector.invoke(fn);
  return this;
};