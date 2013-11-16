var Stack = require('./Stack');
var ModuleReference = require('./ModuleReference');
var Beat = module.exports = function Beat(alias, modulesInfo) {
  this._alias = alias || 'unnamed';
  this._properties = {};
  this._factories = {};
  this._factoryDependencies = {};
  this._stack = new Stack(this._alias);
  this._moduleReferences = {};
  this.loadModules(modulesInfo);
};
Beat.prototype.loadModules = function loadModules(modulesInfo) {
  for(var i in modulesInfo) {
    if(!modulesInfo.hasOwnProperty(i)) continue;
    var ref = new ModuleReference(modulesInfo[i]);
    this._moduleReferences[ref.getAlias()] = ref;
  }
};
Beat.prototype.load = function load(beat) {
  if(!beat instanceof Beat) {
    throw this._stack.error('Can not load Beat "'+beat+'". Expected a instance of Beat.');
  }
  for(var key in beat._properties) {
    if(!beat._properties.hasOwnProperty(key)) continue;
    this._properties[key] = beat._properties[key];
  }
  for(var key in beat._factories) {
    if(!beat._factories.hasOwnProperty(key)) continue;
    this._factories[key] = beat._factories[key];
  }
  for(var key in beat._factoryDependencies) {
    if(!beat._factoryDependencies.hasOwnProperty(key)) continue;
    this._factoryDependencies[key] = beat._factoryDependencies[key];
  }
  for(var key in beat._moduleReferences) {
    if(!beat._moduleReferences.hasOwnProperty(key)) continue;
    this._moduleReferences[key] = beat._moduleReferences[key];
  }
  return this;
};
Beat.prototype._require = function(path){
  return require(path);
};
Beat.prototype._getBlockInfo = function _getBlockInfo(block) {
  if(block instanceof Array) {
    return {fn:block.pop(), deps:block};
  }
  if(typeof block !== 'function') {
    throw this._stack.error('Can not get arguments from "'+block+'". Expected a function.');
  }
  var match = block.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m);
  var deps = match && match[1] && match[1].split(',').map(function(arg) {
    var match = arg.match(/\/\*([^\*]*)\*\//m);
    return match ? match[1].trim() : arg.trim();
  }) || [];
  return {fn:block, deps:deps};
};
Beat.prototype.value = function value(alias, value) {
  if(typeof alias !== 'string' && typeof alias !== 'number') {
    throw this._stack.error('Invalid key "'+alias+'" for value "'+value+'"');
  }
  this._properties[alias] = value;
  return this;
};
Beat.prototype.factory = function factory(alias, fn) {
  this._factories[alias] = this._getBlockInfo(fn);
  return this;
};
Beat.prototype.get = function get(alias) {
  for(var a in this._moduleReferences) {
    if(!this._moduleReferences.hasOwnProperty(a)) continue;
    var module = this._moduleReferences[a].getModule();
    if(module instanceof Beat) {
      this.load(module);
    }
    else {
      this._properties[snakeCaseToCamelCase(a)] = module;
    }
    delete this._moduleReferences[a];
  }
  var alreadyResolving = this._stack.contains(alias);
  this._stack.push(alias);
  if(alreadyResolving) {
    throw this._stack.error('Can not resolve circular dependency for "'+alias+'".');
  }
  if(typeof this._properties[alias] === 'undefined') {
    if(typeof this._factories[alias] === 'undefined') {
      throw this._stack.error('No provider for "'+alias+'".');
    }
    var resolvedDependencies = [];
    for(var i=0;i<this._factories[alias].deps.length;i++) {
      resolvedDependencies.push(this.get(this._factories[alias].deps[i]));
    }
    this._properties[alias] = this._factories[alias].fn.apply(this, resolvedDependencies);
    delete this._factories[alias];
  }
  this._stack.pop();
  return this._properties[alias];
};
Beat.prototype.run = function run(block) {
  this._stack.length = 0;
  var info = this._getBlockInfo(block);
  var resolvedDependencies = [];
  for(var i=0;i<info.deps.length;i++) {
    resolvedDependencies.push(this.get(info.deps[i]));
  }
  info.fn.apply(this, resolvedDependencies);
  return this;
};
function snakeCaseToCamelCase(str){
  return str.replace(/(\-\w)/g, function(match){
    return match[1].toUpperCase();
  });
}