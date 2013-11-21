var Injector = require('../../lib/Injector');
var Provide = require('../../lib/Provide');

describe('Injector', function(){
  it('should be an construtor', function(){
    expect(Injector).to.be.an('function');
  });
  
  describe('instance', function(){
    var $injector;
    beforeEach(function(){
      $injector = new Injector();
    });
    
    // annotate
    it('"annotate" method should extract the dependencies from the arguments of the function', function(){
      var fn = function(first, second){};
      expect($injector.annotate(fn)).to.be.eql(['first', 'second']);
    });
    it('"annotate" method should extract the dependencies from the "$inject" property of the function', function(){
      var fn = function(){};
      fn.$inject = ['first', 'second'];
      expect($injector.annotate(fn)).to.be.equal(fn.$inject);
    });
    it('"annotate" method should extract the dependencies using the array notation', function(){
      var fn = ['first', 'second', function(){}];
      expect($injector.annotate(fn)).to.be.eql(['first', 'second']);
    });
    
    // get
    it('"get" method should provide $injector service', function(){
      expect($injector.get('$injector')).to.be.equal($injector);
      expect($injector.invoke(function($injector){
        return $injector;
      })).to.be.equal($injector);
    });
    it('"get" method should provide $provide service', function(){
      var $provide = $injector.get('$provide');
      expect($provide).to.be.instanceof(Provide);
    });
    
    // has
    it('"has" method should detect if the particular service exist', function(){
      expect($injector.has('$injector')).to.be.equal(true);
      expect($injector.has('X')).to.be.equal(false);
    });
    
    // instantiate
    it('"instantiate" method should create a new instance of JS type', function(){
      var TestType = function TestType($injector){
        this.myInjector = $injector;
        };
      var instance = $injector.instantiate(TestType);
      expect(instance).to.be.instanceof(TestType);
      expect(instance.myInjector).to.be.equal($injector);
    });
    it('"instantiate" method should read argument names from locals before the $injector is consulted', function(){
      var locals = {$injector: {}};
      var TestType = function TestType($injector){
        this.myInjector = $injector;
      };
      var instance = $injector.instantiate(TestType, locals);
      expect(instance.myInjector).not.to.be.equal($injector);
      expect(instance.myInjector).to.be.equal(locals.$injector);
    });
    
    // invoke
    it('"invoke" method should invoke function and supply the function arguments from the $injector', function(){
      var inj;
      var ret = 'ok';
      var fn = function($injector){
        inj = $injector;
        return ret;
      };
      expect($injector.invoke(fn)).to.be.equal(ret);
      expect(inj).to.be.equal($injector);
    });
    it('"invoke" method should invoke function with given "this"', function(){
      var self = {x:123};
      var fn = function(){
        return this.x;
      };
      expect($injector.invoke(fn, self)).to.be.equal(self.x);
    });
    it('"invoke" method should read argument names from locals before the $injector is consulted', function(){
      var inj;
      var locals = {$injector: {}};
      var fn = function($injector){
        inj = $injector;
      };
      $injector.invoke(fn, {}, locals);
      expect(inj).not.to.be.equal($injector);
      expect(inj).to.be.equal(locals.$injector);
    });
    
  }); // instance
  
});