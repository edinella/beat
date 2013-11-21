var Alias = require('../../lib/Alias');

describe('Alias', function(){
  it('should be a constructor', function(){
    expect(Alias).to.be.an('function');
  });
  it('should convert aliasCandidate to a string', function(){
    var alias = new Alias(123);
    expect(alias.toString()).to.be.equal('123');
  });
  it('should convert aliasCandidate from snake-case to camelCase', function(){
    var alias = new Alias('test-case-alias');
    expect(alias.toString()).to.be.equal('testCaseAlias');
  });
});