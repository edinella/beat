var Beat = module.exports = function Beat(alias) {
    this._alias = alias || 'unnamed';
    this._properties = {};
    this._factories = {};
    this._factoryDependencies = {};
    this._path = [];
};
Beat.prototype._error = function _error(msg) {
    var stack = this._path.join(' -> ');
    this._path = [];
    return new Error((stack ? msg+' (Resolving: '+stack+')' : msg)+' at "'+this._alias+'".');
};
Beat.prototype._getBlockInfo = function _getBlockInfo(block) {
    if(block instanceof Array)
        return {fn:block.pop(), deps:block};
    if(typeof block !== 'function')
        throw this._error('Can not get arguments from "'+block+'". Expected a function.');
    var match = block.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m);
    var deps = match && match[1] && match[1].split(',').map(function(arg) {
        var match = arg.match(/\/\*([^\*]*)\*\//m);
        return match ? match[1].trim() : arg.trim();
    }) || [];
    return {fn:block, deps:deps};
};
Beat.prototype.value = function value(alias, value) {
    if(typeof alias != 'string' && typeof alias != 'number')
        throw this._error('Invalid key "'+alias+'" for value "'+value+'"');
    this._properties[alias] = value;
    return this;
};
Beat.prototype.factory = function factory(alias, fn) {
    this._factories[alias] = this._getBlockInfo(fn);
    return this;
};
Beat.prototype.get = function get(alias) {
    var alreadyResolving = this._path.indexOf(alias) !== -1;
    this._path.push(alias);
    if(alreadyResolving)
        throw this._error('Can not resolve circular dependency for "'+alias+'".');
    if(typeof this._properties[alias] === 'undefined') {
        if(typeof this._factories[alias] === 'undefined')
            throw this._error('No provider for "'+alias+'".');
        var resolvedDependencies = [];
        for(var i=0;i<this._factories[alias].deps.length;i++)
            resolvedDependencies.push(this.get(this._factories[alias].deps[i]));
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
    for(var i=0;i<info.deps.length;i++)
        resolvedDependencies.push(this.get(info.deps[i]));
    info.fn.apply(this, resolvedDependencies);
    return this;
};