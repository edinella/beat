var Block = require('../../lib/Block');
describe('Block', function(){
  it('should be an construtor', function(){
    expect(Block).to.be.an('function');
  });
  it('should return function recieved at the first argument', function(){
    var fn = function(){};
    var instance = new Block(fn);
    expect(instance).to.be.equal(fn);
  });
  it('should set ._deps prop in returned function', function(){
    var fn = function(){};
    var instance = new Block(fn);
    expect(instance._deps).to.be.an('array');
  });
  it('should be able to deal with simple parameters for declaring dependencies', function(){
    var fn = function(a, b){};
    var instance = new Block(fn);
    expect(instance).to.be.equal(fn);
    expect(instance._deps.length).to.be.equal(2);
    expect(instance._deps[0]).to.be.equal('a');
    expect(instance._deps[1]).to.be.equal('b');
  });
  it('should be able to deal with an array for declaring dependencies', function(){
    var fn = function(){};
    var instance = new Block(['a', 'b', fn]);
    expect(instance).to.be.equal(fn);
    expect(instance._deps.length).to.be.equal(2);
    expect(instance._deps[0]).to.be.equal('a');
    expect(instance._deps[1]).to.be.equal('b');
  });
  it('should be able to deal with comments for declaring dependencies', function(){
    var fn = function(/* myFabricatedValue */ a, /* myValue */ b){};
    var instance = new Block(fn);
    expect(instance).to.be.equal(fn);
    expect(instance._deps.length).to.be.equal(2);
    expect(instance._deps[0]).to.be.equal('myFabricatedValue');
    expect(instance._deps[1]).to.be.equal('myValue');
  });
});