var Injector = require('../../lib/Injector');
var Provide = require('../../lib/Provide');

describe('Provide', function(){
  it('should be an construtor', function(){
    expect(Provide).to.be.an('function');
  });
  
  describe('$provide service', function(){
    var $injector;
    var $provide;
    beforeEach(function(){
      $injector = new Injector();
      $provide = $injector.get('$provide');
    });
    
    it('should be instance of Provide', function(){
      expect($provide).to.be.instanceof(Provide);
    });
    
    it('"provider" method should register a annotated provider with the $injector', function(){
      var testResult = {};
      var factory = sinon.stub().returns(testResult);
      var provider = {$get: ['$provide', factory]};
      $provide.provider('test', provider);
      expect($injector.get('test')).to.be.equal(testResult);
      expect(factory.calledOn(provider)).to.be.equal(true);
      expect(factory.calledWith($provide)).to.be.equal(true);
    });
    
    it('"service" method should register a service constructor, which will be invoked with "new" to create the service instance', function(){
      var TestType = function TestType($injector){
        this.myInjector = $injector;
      };
      $provide.service('tt', TestType);
      var instance = $injector.get('tt');
      expect(instance).to.be.instanceof(TestType);
      expect(instance.myInjector).to.be.equal($injector);
    });
    
    it('"value" method should register a value service with the $injector', function(){
      var val = {};
      $provide.value('v', val);
      expect($injector.get('v')).to.be.equal(val);
    });
    
    it('"factory" method should register a service factory, which will be called to return the service instance', function(){
      var val = {};
      var factory = sinon.stub().returns(val);
      $provide.factory('v', ['$provide', factory]);
      expect($injector.get('v')).to.be.equal(val);
      expect(factory.calledWith($provide)).to.be.equal(true);
    });
    
    it('"decorator" method should register a service decorator with the $injector', function(){
      var val = {a:1, b:2};
      $provide.value('v', val);
      $provide.decorator('v', ['$delegate', function($delegate) {
        $delegate.a = $delegate.b;
        return $delegate;
      }]);
      var v = $injector.get('v');
      expect(v).to.have.property('b', val.b);
      expect(v).to.have.property('a', val.b);
    });
    
  }); // $provide service
});