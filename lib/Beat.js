var ModuleReference = require('./ModuleReference');
var generateAlias = require('./generateAlias');
var Stack = require('./Stack');
var Block = require('./Block');

var Beat = module.exports = function Beat(alias, modulesInfo) {
  this._alias = generateAlias(alias || 'unnamed');
  this._properties = {};
  this._factories = {};
  this._factoryDependencies = {};
  this._stack = new Stack(this._alias);
  this._moduleRefs = {};
  this.loadModules(modulesInfo);
};

Beat.prototype.loadModules = function loadModules(modulesInfo) {
  for(var i in modulesInfo) {
    if(!modulesInfo.hasOwnProperty(i)) continue;
    var ref = new ModuleReference(modulesInfo[i]);
    this._moduleRefs[ref.alias] = ref;
  }
};

Beat.prototype.load = function load(beat) {
  if(!beat instanceof Beat) {
    throw this._stack.error('Can not load Beat "'+beat+'". Expected a instance of Beat.');
  }
  var self = this;
  var itemsToImport = ['_properties', '_factories', '_factoryDependencies', '_moduleRefs'];
  itemsToImport.forEach(function(itemToImport) {
    for(var key in beat[itemToImport]) {
      if(!beat[itemToImport].hasOwnProperty(key)) continue;
      self[itemToImport][key] = beat[itemToImport][key];
    }
  });
  return this;
};

Beat.prototype.value = function value(alias, value) {
  this._properties[generateAlias(alias)] = value;
  return this;
};

Beat.prototype.factory = function factory(alias, blockDefinition) {
  this._factories[generateAlias(alias)] = new Block(blockDefinition);
  return this;
};

Beat.prototype.get = function get(alias) {
  alias = generateAlias(alias);
  for(var a in this._moduleRefs) {
    if(!this._moduleRefs.hasOwnProperty(a)) continue;
    var module = this._moduleRefs[a].module;
    if(module instanceof Beat) {
      this.load(module);
    }
    else {
      this._properties[generateAlias(a)] = module;
    }
    delete this._moduleRefs[a];
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
    for(var i=0;i<this._factories[alias]._deps.length;i++) {
      resolvedDependencies.push(this.get(this._factories[alias]._deps[i]));
    }
    this._properties[alias] = this._factories[alias].apply(this, resolvedDependencies);
    delete this._factories[alias];
  }
  this._stack.pop();
  return this._properties[alias];
};

Beat.prototype.run = function run(blockDefinition) {
  this._stack.reset();
  var block = new Block(blockDefinition);
  var resolvedDependencies = [];
  for(var i=0;i<block._deps.length;i++) {
    resolvedDependencies.push(this.get(block._deps[i]));
  }
  block.apply(this, resolvedDependencies);
  return this;
};