var generateAlias = require('../../lib/generateAlias');
describe('generateAlias', function(){
  it('should be a function', function(){
    expect(generateAlias).to.be.an('function');
  });
  it('should convert aliasCandidate to a string', function(){
    expect(generateAlias(123)).to.be.equal('123');
  });
  it('should convert aliasCandidate from snake-case to camelCase', function(){
    expect(generateAlias('test-case-alias')).to.be.equal('testCaseAlias');
  });
});