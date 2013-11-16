var util = require('util');
var options = {
  red:      '\u001b[31m',
  green:    '\u001b[32m',
  yellow:   '\u001b[33m',
  blue:     '\u001b[34m',
  magenta:  '\u001b[35m',
  cyan:     '\u001b[36m',
  gray:     '\u001b[90m',
  reset:    '\u001b[0m'
};
var BeatError = exports.BeatError = function BeatError(msg) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  msg = msg.replace(/\"([^"]+)\"/g, '"[GRAY:$1]"');
  msg = msg.replace(/\[(red|green|yellow|blue|magenta|cyan|gray)\:/gi, function(str, color){
    return options[color.toLowerCase()];
  });
  msg = msg.replace(/\]/g, options.reset);
  this.message = msg;
  this.name = 'BeatError';
};

util.inherits(BeatError, ReferenceError);