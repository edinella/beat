var generateAlias = require('./generateAlias');
var Errors = require('./Errors');
var BeatError = Errors.BeatError;

var ModuleReference = module.exports = function ModuleReference(info) {
  Object.defineProperties(this, {
    info: {
      value: info
    },
    alias: {
      get: this.getAlias
    },
    path: {
      get: this.getPath
    },
    module: {
      get: this.getModule
    }
  });
};

ModuleReference.prototype.getAlias = function getAlias() {
  if(typeof this.info === 'string') {
    return generateAlias(this.info);
  }
  for(var alias in this.info) {
    if(this.info.hasOwnProperty(alias)) {
      return generateAlias(alias);
    }
  }
  throw new BeatError('Can not resolve alias for module reference "'+this.info+'". Expected a string or plain object.');
};

ModuleReference.prototype.getPath = function getPath() {
  var reference = this.info;
  if(typeof this.info !== 'string') {
    for(var alias in this.info) {
      if(this.info.hasOwnProperty(alias)) {
        reference = this.info[alias];
        break;
      }
    }
  }
  return typeof reference === 'string'? reference.replace(/^\//, process.cwd()+'/'): reference;
};

ModuleReference.prototype.getModule = function getModule() {
  var path = this.getPath();
  return typeof path === 'string'? this._require(path): path;
};

ModuleReference.prototype._require = function(path){
  return require(path);
};