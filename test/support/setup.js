var chai = require("chai");
var chaiHttp = require('chai-http');

chai.use(chaiHttp);

global.chai = chai;
global.should = chai.should();
global.expect = chai.expect;