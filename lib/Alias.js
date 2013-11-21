var Alias = module.exports = function Alias(aliasCandidate) {
  this.original;
  this.value;
  this.set(aliasCandidate);
};

Alias.prototype.set = function set(aliasCandidate) {
  this.original = (aliasCandidate || 'unnamed').toString();
  this.value = this.original.replace(/([-_.+ ]\w)/g, function(match) {
    return match[1].toUpperCase();
  });
};

Alias.prototype.toString = function toString() {
  return this.value;
};