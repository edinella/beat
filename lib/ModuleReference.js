var ModuleReference = module.exports = function ModuleReference(info) {
  this.info = info;
};
ModuleReference.prototype.getAlias = function getAlias() {
  if(typeof this.info === 'string') {
    return this.info;
  }
  for(var alias in this.info) {
    if(!this.info.hasOwnProperty(alias)) continue;
    return alias;
  }
  throw new ReferenceError('Can not resolve alias for module reference "'+this.info+'". Expected a string or plain object.');
};
ModuleReference.prototype.getReference = function getReference() {
  var reference = this.info;
  if(typeof this.info !== 'string') {
    for(var alias in this.info) {
      if(!this.info.hasOwnProperty(alias)) continue;
      reference = this.info[alias];
      break;
    }
  }
  return typeof reference === 'string'? reference.replace(/^\//, process.cwd()+'/'): reference;
};
ModuleReference.prototype.getModule = function getModule() {
  var reference = this.getReference();
  return typeof reference === 'string'? this._require(reference): reference;
};
ModuleReference.prototype._require = function(path){
  return require(path);
};