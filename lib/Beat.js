var Alias = require('./Alias');
var Stack = require('./Stack');
var Block = require('./Block');
var Scope = require('./Scope');

var Beat = module.exports = function Beat(aliasCandidate, modulesInfo) {
  this.scope = new Scope();
  this.alias = new Alias(aliasCandidate);
  this.stack = new Stack(this.alias);
  this.properties = {};
  this.factories = {};
  this.value('$scope', this.scope);
  this.value('$injector', this.properties);
  this.loadModules(modulesInfo);
};

Beat.prototype.require = function require(path) {
  return require(path);
};

Beat.prototype.loadModules = function loadModules(modulesInfo) {
  modulesInfo = modulesInfo || [];
  for(var i=0,l=modulesInfo.length;i<l;i++) {
    var aliasCandidate;
    var info = modulesInfo[i];
    var path = info;
    if(typeof info === 'string') {
      aliasCandidate = info;
    } else {
      for(var a in info) {
        if(info.hasOwnProperty(a)) {
          path = modulesInfo[i][a];
          aliasCandidate = a;
          break;
        }
      }
    }
    if(typeof aliasCandidate !== 'string') {
      throw new BeatError('Can not resolve alias for module reference "'+info+'". Expected a string or plain object.');
    }
    var alias = new Alias(aliasCandidate);
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
  var itemsToImport = ['properties', 'factories'];
  itemsToImport.forEach(function(itemToImport) {
    for(var key in beat[itemToImport]) {
      if(beat[itemToImport].hasOwnProperty(key)) {
        self[itemToImport][key] = beat[itemToImport][key];
      }
    }
  });
  return this;
};

Beat.prototype.value = function value(aliasCandidate, property) {
  var alias = new Alias(aliasCandidate);
  this.properties[alias] = property;
  delete this.factories[alias];
  return this;
};

Beat.prototype.factory = function factory(aliasCandidate, blockDefinition) {
  var alias = new Alias(aliasCandidate);
  delete this.properties[alias];
  this.factories[alias] = new Block(blockDefinition);
  return this;
};

Beat.prototype.get = function get(aliasCandidate) {
  var alias = new Alias(aliasCandidate);

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
  throw this.stack.error('No provider for "'+alias+'".');
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