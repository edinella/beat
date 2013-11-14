var Beat = module.exports = function Beat(alias, beats) {
  this._alias = alias || 'unnamed';
  this._properties = {};
  this._factories = {};
  this._factoryDependencies = {};
  this._path = [];
  this._map = {};
  var rootPath = process.cwd();
  for(var i in beats) {
    var item = beats[i];
    for(var alias in item) {
      if(typeof item === 'string') {
        alias = item;
      }
      else {
        item = item[alias];
      }
      if(item[0] === '/') {
        item = rootPath+item;
      }
      this._map[alias] = item;
      break;
    }
  }
};
Beat.prototype._error = function _error(msg) {
  this._path.unshift(colorize(this._alias, 'blue'));
  var stack = this._path.map(function(p){return colorize(p, 'blue');}).join(' -> ');
  this._path = [];
  return new Error(colorize(msg, 'red')+' at '+stack);
};
Beat.prototype.load = function load(beat) {
  if(!beat instanceof Beat) {
    throw this._error('Can not load Beat "'+beat+'". Expected a instance of Beat.');
  }
  for(var key in beat._properties) {
    this._properties[key] = beat._properties[key];
  }
  for(var key in beat._factories) {
    this._factories[key] = beat._factories[key];
  }
  for(var key in beat._factoryDependencies) {
    this._factoryDependencies[key] = beat._factoryDependencies[key];
  }
  for(var key in beat._map) {
    this._map[key] = beat._map[key];
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
    throw this._error('Can not get arguments from "'+block+'". Expected a function.');
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
    throw this._error('Invalid key "'+alias+'" for value "'+value+'"');
  }
  this._properties[alias] = value;
  return this;
};
Beat.prototype.factory = function factory(alias, fn) {
  this._factories[alias] = this._getBlockInfo(fn);
  return this;
};
Beat.prototype.get = function get(alias) {
  for(var a in this._map) {
    var module = typeof this._map[a] === 'string'? this._require(this._map[a]): this._map[a];
    if(module instanceof Beat) {
      this.load(module);
    }
    else {
      this._properties[a.replace(/(\-\w)/g, function(match){return match[1].toUpperCase();})] = module;
    }
    delete this._map[a];
  }
  var alreadyResolving = this._path.indexOf(alias) !== -1;
  this._path.push(alias);
  if(alreadyResolving) {
    throw this._error('Can not resolve circular dependency for "'+alias+'".');
  }
  if(typeof this._properties[alias] === 'undefined') {
    if(typeof this._factories[alias] === 'undefined') {
      throw this._error('No provider for "'+alias+'".');
    }
    var resolvedDependencies = [];
    for(var i=0;i<this._factories[alias].deps.length;i++) {
      resolvedDependencies.push(this.get(this._factories[alias].deps[i]));
    }
    this._properties[alias] = this._factories[alias].fn.apply(this, resolvedDependencies);
    delete this._factories[alias];
  }
  this._path.pop();
  return this._properties[alias];
};
Beat.prototype.run = function run(block) {
  this._path = [];
  var info = this._getBlockInfo(block);
  var resolvedDependencies = [];
  for(var i=0;i<info.deps.length;i++) {
    resolvedDependencies.push(this.get(info.deps[i]));
  }
  info.fn.apply(this, resolvedDependencies);
  return this;
};
function colorize(str, color) {
  var options = {
    red:      '\u001b[31m',
    green:    '\u001b[32m',
    yellow:   '\u001b[33m',
    blue:     '\u001b[34m',
    magenta:  '\u001b[35m',
    cyan:     '\u001b[36m',
    gray:     '\u001b[90m',
    reset:    '\u001b[0m'
  };
  return options[color]+str+options.reset;
}