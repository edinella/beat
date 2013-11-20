var ModuleReference = require('./ModuleReference');
var generateAlias = require('./generateAlias');
var Stack = require('./Stack');
var Block = require('./Block');
var Scope = require('./Scope');

var Beat = module.exports = function Beat(alias, modulesInfo) {
  this.scope = new Scope();
  this.alias = generateAlias(alias || 'unnamed');
  this.properties = {};
  this.factories = {};
  this.stack = new Stack(this.alias);
  this.moduleRefs = {};
  this.loadModules(modulesInfo);
};

Beat.prototype.loadModules = function loadModules(modulesInfo) {
  for(var i in modulesInfo) {
    if(modulesInfo.hasOwnProperty(i)) {
      var ref = new ModuleReference(modulesInfo[i]);
      this.moduleRefs[ref.alias] = ref;
    }
  }
};

Beat.prototype.load = function load(beat) {
  if(!beat instanceof Beat) {
    throw this.stack.error('Can not load Beat "'+beat+'". Expected a instance of Beat.');
  }
  var self = this;
  var itemsToImport = ['properties', 'factories', 'moduleRefs'];
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
  this.properties[alias] = property;
  delete this.factories[alias];
  return this;
};

Beat.prototype.factory = function factory(alias, blockDefinition) {
  alias = generateAlias(alias);
  delete this.properties[alias];
  this.factories[alias] = new Block(blockDefinition);
  return this;
};

Beat.prototype.get = function get(alias, silently) {
  alias = generateAlias(alias);
  
  var alreadyResolving = this.stack.contains(alias);
  this.stack.push(alias);
  if(alreadyResolving) {
    throw this.stack.error('Can not resolve circular dependency for "'+alias+'".');
  }
  
  // value
  if(typeof this.properties[alias] !== 'undefined') {
    this.stack.pop();
    return this.properties[alias];
  }
  
  // factory
  if(typeof this.factories[alias] !== 'undefined') {
    var resolvedDependencies = [];
    for(var i=0;i<this.factories[alias]._deps.length;i++) {
      resolvedDependencies.push(this.get(this.factories[alias]._deps[i]));
    }
    this.properties[alias] = this.factories[alias].apply(this.scope, resolvedDependencies);
    delete this.factories[alias];
    this.stack.pop();
    return this.properties[alias];
  }
  
  // remote
  for(var a in this.moduleRefs) {
    if(this.moduleRefs.hasOwnProperty(a)) {
      var module = this.moduleRefs[a].module;
      if(module instanceof Beat) {
        var property = module.get(alias, true);
        if(typeof property !== 'undefined') {
          this.properties[alias] = property;
          this.stack.pop();
          return this.properties[alias];
        }
      }
      else {
        this.properties[alias] = module;
        this.stack.pop();
        return this.properties[alias];
      }
    }
  }
  
  if(!silently) {
    throw this.stack.error('No provider for "'+alias+'".');
  }
  return undefined;
};

Beat.prototype.run = function run(blockDefinition) {
  this.stack.reset();
  var block = new Block(blockDefinition);
  var resolvedDependencies = [];
  for(var i=0;i<block._deps.length;i++) {
    resolvedDependencies.push(this.get(block._deps[i]));
  }
  block.apply(this.scope, resolvedDependencies);
  return this;
};