var ModuleReference = require('../../lib/ModuleReference');
var Block = require('../../lib/Block');
var Beat = require('../../');

describe('Beat', function(){
  it('should be an construtor', function(){
    expect(Beat).to.be.an('function');
  });
  describe('instance', function(){
    var beat;
    beforeEach(function(){
      beat = new Beat();
    });
    
    // basics
    it('.run method should recieve and execute a function', function(){
      var spy = sinon.spy();
      beat.run(spy);
      expect(spy.calledOnce).to.be.equal(true);
      expect(spy.calledOn(beat)).to.be.equal(true);
      expect(spy.calledWith()).to.be.equal(true);
    });
    it('.value method should set a value to be obtained by .get', function(){
      var mv = {};
      beat.value('myValue', mv);
      expect(beat.get('myValue')).to.be.equal(mv);
    });
    it('.factory method should set a factory function of a value', function(){
      var mv = {};
      var stub = sinon.stub().returns(mv);
      beat.factory('myValue', stub);
      expect(beat.get('myValue')).to.be.equal(mv);
      expect(stub.calledOn(beat)).to.be.equal(true);
      expect(stub.calledWith()).to.be.equal(true);
    });
    it('factories should be called once', function(){
      var stub = sinon.stub().returns({});
      beat.factory('fValue', stub);
      beat.get('fValue');
      beat.get('fValue');
      expect(stub.calledOnce).to.be.equal(true);
    });
    it('.run method should be able to require values, including fabricated ones', function(done){
      var x = {};
      var y = {};
      beat.value('myValue', x);
      beat.factory('myFabricatedValue', sinon.stub().returns(y));
      beat.run(function(myFabricatedValue, myValue){
        expect(myFabricatedValue).to.be.equal(y);
        expect(myValue).to.be.equal(x);
        done();
      });
    });
    it('factories should be able to require values, including fabricated ones', function(done){
      var x = {};
      var y = {};
      var z = {};
      beat.value('myValue', x);
      beat.factory('myFabricatedValue', sinon.stub().returns(y));
      beat.factory('test', function(myFabricatedValue, myValue){
        expect(myFabricatedValue).to.be.equal(y);
        expect(myValue).to.be.equal(x);
        return z;
      });
      beat.run(function(test){
        expect(test).to.be.equal(z);
        done();
      });
    });

    // chainability
    it('.run method should be chainable', function(){
      expect(beat.run(function(){})).to.be.equal(beat);
    });
    it('.value method should be chainable', function(){
      expect(beat.value('myValue')).to.be.equal(beat);
    });
    it('.factory method should be chainable', function(){
      expect(beat.factory('myValue', function(){})).to.be.equal(beat);
    });
    
    // array declaration
    it('.run method should be able to deal with an array for declaring dependencies', function(done){
      var x = {};
      var y = {};
      beat.value('myValue', x);
      beat.factory('myFabricatedValue', sinon.stub().returns(y));
      beat.run(['myFabricatedValue', 'myValue', function(a, b){
        expect(a).to.be.equal(y);
        expect(b).to.be.equal(x);
        done();
      }]);
    });
    it('.factory method should be able to deal with an array for declaring dependencies', function(done){
      var x = {};
      var y = {};
      beat.value('myValue', x);
      beat.factory('myFabricatedValue', sinon.stub().returns(y));
      beat.factory('z', ['myFabricatedValue', 'myValue', function(a, b){
        expect(a).to.be.equal(y);
        expect(b).to.be.equal(x);
        done();
      }]);
      beat.get('z');
    });
    
    // comment aliases
    it('.run method should be able to deal with comments for declaring dependencies', function(done){
      var x = {};
      var y = {};
      beat.value('myValue', x);
      beat.factory('myFabricatedValue', sinon.stub().returns(y));
      beat.run(function(/* myFabricatedValue */ a, /* myValue */ b){
        expect(a).to.be.equal(y);
        expect(b).to.be.equal(x);
        done();
      });
    });
    it('.factory method should be able to deal with comments for declaring dependencies', function(done){
      var x = {};
      var y = {};
      beat.value('myValue', x);
      beat.factory('myFabricatedValue', sinon.stub().returns(y));
      beat.factory('z', function(/* myFabricatedValue */ a, /* myValue */ b){
        expect(a).to.be.equal(y);
        expect(b).to.be.equal(x);
        done();
      });
      beat.get('z');
    });
    it('.load method should import properties from a beat instance', function(done){
      var x = {};
      var y = {};
      var anotherBeat = new Beat('another');
      anotherBeat.value('myValueX', x);
      anotherBeat.value('myValueY', y);
      beat.load(anotherBeat);
      beat.run(function(myValueX, myValueY){
        expect(myValueX).to.be.equal(x);
        expect(myValueY).to.be.equal(y);
        done();
      });
    });
    it('.load method should import factories from a beat instance', function(done){
      var x = {};
      var y = {};
      var anotherBeat = new Beat('another');
      anotherBeat.factory('myValueX', function(){return x;});
      anotherBeat.factory('myValueY', function(){return y;});
      beat.load(anotherBeat);
      beat.run(function(myValueX, myValueY){
        expect(myValueX).to.be.equal(x);
        expect(myValueY).to.be.equal(y);
        done();
      });
    });
    it('.load method should import factories with dependencies from a beat instance', function(done){
      var x = {};
      var anotherBeat = new Beat('another');
      anotherBeat.factory('generateX', function(X){return X;});
      anotherBeat.value('X', x);
      beat.load(anotherBeat);
      beat.run(function(generateX){
        expect(generateX).to.be.equal(x);
        done();
      });
    });
  });
  describe('instance dependencies', function(){
    var originalMethod;
    beforeEach(function(){
      originalMethod = Beat.prototype.loadModules;
    });
    afterEach(function(){
      Beat.prototype.loadModules = originalMethod;
    });
    it('can be loaded from constructor', function(){
      var dependencies = [];
      Beat.prototype.loadModules = function(modulesInfo){
        expect(modulesInfo).to.be.equal(dependencies);
      };
      var beat = new Beat('a', dependencies);
    });
    it('can be a reference to a beat module', function(){
      var testValue = {};
      var beatA = new Beat('a');
      beatA.value('x', testValue);
      ModuleReference.prototype._require = function(path){
        if(path == 'beatA') return beatA;
      };
      var beatB = new Beat('b');
      beatB.loadModules(['beatA']);
      expect(beatB.get('x')).to.be.equal(testValue);
    });
    it('can be a reference to any other module', function(){
      var testValue = {};
      ModuleReference.prototype._require = function(path){
        if(path == 'anyModule') return testValue;
      };
      var beat = new Beat('myBeat');
      beat.loadModules(['anyModule']);
      expect(beat.get('anyModule')).to.be.equal(testValue);
    });
    it('can be a reference to any other module with an alias', function(){
      var testValue = {};
      ModuleReference.prototype._require = function(path){
        if(path == 'anyModule') return testValue;
      };
      var beat = new Beat('myBeat');
      beat.loadModules([{yes: 'anyModule'}]);
      expect(beat.get('yes')).to.be.equal(testValue);
    });
    it('can be file paths rooted as the process', function(){
      var testValue = {};
      var beatA = new Beat('a');
      beatA.loadModules([{pkg: '/package'}]);
      ModuleReference.prototype._require = function(path){
        expect(path).to.be.equal(process.cwd()+'/package');
        return testValue;
      };
      expect(beatA.get('pkg')).to.be.equal(testValue);
    });
  });
});