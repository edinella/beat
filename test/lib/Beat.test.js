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
      expect(spy.calledWith()).to.be.equal(true);
    });
    it('.value method should set a value to be obtained by .get', function(){
      var mv = 'a';
      beat.value('myValue', mv);
      expect(beat.get('myValue')).to.be.equal(mv);
    });
    it('.value method should overwrite previously defined value', function(){
      var v1 = 'a';
      var v2 = 'b';
      beat.value('x', v1);
      beat.value('x', v2);
      expect(beat.get('x')).to.be.equal(v2);
    });
    it('.factory method should set a factory function of a value', function(){
      var mv = 'a';
      var stub = sinon.stub().returns(mv);
      beat.factory('myValue', stub);
      expect(beat.get('myValue')).to.be.equal(mv);
      expect(stub.calledWith()).to.be.equal(true);
    });
    it('.factory method should overwrite previously defined factory', function(){
      var v1 = 'a';
      var v2 = 'b';
      beat.factory('x', sinon.stub().returns(v1));
      beat.factory('x', sinon.stub().returns(v2));
      expect(beat.get('x')).to.be.equal(v2);
    });
    it('last definition should overwrite previously defined ones', function(){
      var v1 = 'a';
      var v2 = 'b';
      beat.value('x', v1);
      beat.factory('x', sinon.stub().returns(v2));
      expect(beat.get('x')).to.be.equal(v2);
    });
    it('factories should be called once', function(){
      var stub = sinon.stub().returns({});
      beat.factory('fValue', stub);
      beat.get('fValue');
      beat.get('fValue');
      expect(stub.calledOnce).to.be.equal(true);
    });
    it('.run method should be able to require values, including fabricated ones', function(done){
      var x = 'a';
      var y = 'b';
      beat.value('myValue', x);
      beat.factory('myFabricatedValue', sinon.stub().returns(y));
      beat.run(function(myFabricatedValue, myValue){
        expect(myFabricatedValue).to.be.equal(y);
        expect(myValue).to.be.equal(x);
        done();
      });
    });
    it('factories should be able to require values, including fabricated ones', function(done){
      var x = 'a';
      var y = 'b';
      var z = 'c';
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
      var x = 'a';
      var y = 'b';
      beat.value('myValue', x);
      beat.factory('myFabricatedValue', sinon.stub().returns(y));
      beat.run(['myFabricatedValue', 'myValue', function(a, b){
        expect(a).to.be.equal(y);
        expect(b).to.be.equal(x);
        done();
      }]);
    });
    it('.factory method should be able to deal with an array for declaring dependencies', function(done){
      var x = 'a';
      var y = 'b';
      beat.value('myValue', x);
      beat.factory('myFabricatedValue', sinon.stub().returns(y));
      beat.factory('z', ['myFabricatedValue', 'myValue', function(a, b){
        expect(a).to.be.equal(y);
        expect(b).to.be.equal(x);
        done();
      }]);
      beat.get('z');
    });
    
    it('.load method should import properties from a beat instance', function(done){
      var x = 'a';
      var y = 'b';
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
      var x = 'a';
      var y = 'b';
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
      var x = 'a';
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
    var originalLoadModules;
    var originalRequire;
    beforeEach(function(){
      originalLoadModules = Beat.prototype.loadModules;
      originalRequire = Beat.prototype.require;
    });
    afterEach(function(){
      Beat.prototype.loadModules = originalLoadModules;
      Beat.prototype.require = originalRequire;
    });
    it('can be loaded from constructor', function(){
      Beat.prototype.loadModules = function(modulesInfo){
        expect(modulesInfo).to.be.equal(dependencies);
      };
      var dependencies = [];
      var beat = new Beat('a', dependencies);
    });
    it('can be a reference to a beat module', function(){
      Beat.prototype.require = function(path){
        if(path == 'beatA') return beatA;
      };
      var testValue = {};
      var beatA = new Beat('a');
      beatA.value('x', testValue);
      var beatB = new Beat('b');
      beatB.loadModules(['beatA']);
      expect(beatB.get('x')).to.be.equal(testValue);
    });
    it('can be a reference to any other module', function(){
      Beat.prototype.require = function(path){
        if(path == 'anyModule') return testValue;
      };
      var testValue = {};
      var beat = new Beat('myBeat');
      beat.loadModules(['anyModule']);
      expect(beat.get('anyModule')).to.be.equal(testValue);
    });
    it('can be a reference to any other module with an alias', function(){
      Beat.prototype.require = function(path){
        if(path == 'anyModule') return testValue;
      };
      var testValue = {};
      var beat = new Beat('myBeat');
      beat.loadModules([{yes: 'anyModule'}]);
      expect(beat.get('yes')).to.be.equal(testValue);
    });
    it('can be file paths rooted as the process', function(){
      Beat.prototype.require = function(path){
        expect(path).to.be.equal(process.cwd()+'/package');
        return testValue;
      };
      var testValue = {};
      var beatA = new Beat('a');
      beatA.loadModules([{pkg: '/package'}]);
      expect(beatA.get('pkg')).to.be.equal(testValue);
    });
  });
});