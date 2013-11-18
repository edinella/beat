var ModuleReference = require('./ModuleReference');
var generateAlias = require('./generateAlias');
var Stack = require('./Stack');
var Block = require('./Block');

var Beat = module.exports = function Beat(alias, modulesInfo) {
  this._alias = generateAlias(alias || 'unnamed');
  this._properties = {};
  this._factories = {};
  this._stack = new Stack(this._alias);
  this._moduleRefs = {};
  this.loadModules(modulesInfo);
};

Beat.prototype.loadModules = function loadModules(modulesInfo) {
  for(var i in modulesInfo) {
    if(modulesInfo.hasOwnProperty(i)) {
      var ref = new ModuleReference(modulesInfo[i]);
      this._moduleRefs[ref.alias] = ref;
    }
  }
};

Beat.prototype.load = function load(beat) {
  if(!beat instanceof Beat) {
    throw this._stack.error('Can not load Beat "'+beat+'". Expected a instance of Beat.');
  }
  var self = this;
  var itemsToImport = ['_properties', '_factories', '_moduleRefs'];
  itemsToImport.forEach(function(itemToImport) {
    for(var key in beat[itemToImport]) {
      if(beat[itemToImport].hasOwnProperty(key)) {
        self[itemToImport][key] = beat[itemToImport][key];
      }
    }
  });
  return this;
};

Beat.prototype.value = function value(alias, property) {
  alias = generateAlias(alias);
  this._properties[alias] = property;
  delete this._factories[alias];
  return this;
};

Beat.prototype.factory = function factory(alias, blockDefinition) {
  alias = generateAlias(alias);
  delete this._properties[alias];
  this._factories[alias] = new Block(blockDefinition);
  return this;
};

Beat.prototype.get = function get(alias, silently) {
  alias = generateAlias(alias);
  
  var alreadyResolving = this._stack.contains(alias);
  this._stack.push(alias);
  if(alreadyResolving) {
    throw this._stack.error('Can not resolve circular dependency for "'+alias+'".');
  }
  
  // value
  if(typeof this._properties[alias] !== 'undefined') {
    this._stack.pop();
    return this._properties[alias];
  }
  
  // factory
  if(typeof this._factories[alias] !== 'undefined') {
    var resolvedDependencies = [];
    for(var i=0;i<this._factories[alias]._deps.length;i++) {
      resolvedDependencies.push(this.get(this._factories[alias]._deps[i]));
    }
    this._properties[alias] = this._factories[alias].apply(this, resolvedDependencies);
    delete this._factories[alias];
    this._stack.pop();
    return this._properties[alias];
  }
  
  // remote
  for(var a in this._moduleRefs) {
    if(this._moduleRefs.hasOwnProperty(a)) {
      var module = this._moduleRefs[a].module;
      if(module instanceof Beat) {
        var property = module.get(alias, true);
        if(typeof property !== 'undefined') {
          this._properties[alias] = property;
          this._stack.pop();
          return this._properties[alias];
        }
      }
      else {
        this._properties[alias] = module;
        this._stack.pop();
        return this._properties[alias];
      }
    }
  }
  
  if(!silently) {
    throw this._stack.error('No provider for "'+alias+'".');
  }
  return undefined;
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