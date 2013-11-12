# beat [![Build Status](https://travis-ci.org/edinella/beat.png?branch=master)](https://travis-ci.org/edinella/beat) [![Coverage Status](https://coveralls.io/repos/edinella/beat/badge.png)](https://coveralls.io/r/edinella/beat)
Simple dependency injection for node

[![NPM](https://nodei.co/npm/beat.png)](https://npmjs.org/package/beat)

```js
var Beat = require('beat');
var app = new Beat('app');

app.value('port', process.env.PORT || 3000);
app.value('express', require('express'));
  
app.factory('app', function(express){
  return express();
});
  
app.run(function(app, port){
  app.get('/hello.txt', function(req, res){
    res.send('Hello World');
  });
  app.listen(port);
  console.log('Express running at :'+port);
});
```

## How to use
Install it with NPM:
```sh
npm install --save beat
```

Then require it:
```js
var Beat = require('beat');
```

## API

**constructor(alias)**: starts a new Beat with an alias (defaults to "unnamed")

To produce the instance, `Beat` should be called with `new` operator.

The `alias` argument identifies it, useful for debugging in case of errors.

```js
var myServer = new Beat('server');
```

**value(token, value)**: defines a value for injection

Register the final value.

```js
myServer.value('port', 80);
```

**factory(token, factoryFn)**: defines a factory for injection

To produce the instance, `factoryFn` will be called once (with instance context) and its result will be used.

The `factoryFn` function can use injection annotation.

```js
myServer.factory('port', function(){
  var port = 80;
  // some logic here
  return port;
});
```

**run(fn)**: runs a code block, with injection

`fn` will be called (with instance context).

The `fn` function can use injection annotation.

```js
myServer.run(function(server, port){
  server.listen(port);
});
```

**get(token)**: obtains a property

```js
myServer.value('port', 80);
var port = myServer.get('port');
```

**load(beatInstance)**: import properties and factories from an Beat instance

Useful to bind different beats
```js
var config = new Beat('config');
config.value('port', 80);

myServer.load(config);
myServer.run(function(app, port){
  app.listen(port);
});
```
or at different files

```js
var config = module.exports = new Beat('config');
config.value('port', 80);
```

```js
myServer.load(require('./config'));
myServer.run(function(app, port){
  app.listen(port);
});
```

### Annotation

Methods `run` and `factory` can recieve annotated functions as arguments, that will be used for injection.

The injector looks up tokens based on argument names:

```js
myServer.run(function(server, port) {
  // will inject objects bound to 'server' and 'port' tokens
});
```

You can also use comments:

```js
myServer.run(function(/* httpServer */ server, /* serverPort */ port) {
  // will inject objects bound to 'http' and 'serverPort' tokens
});
```

You can also use a array:

```js
myServer.run(['http', 'serverPort', function(server, port) {
  // will inject objects bound to 'http' and 'serverPort' tokens
}]);
```

### Dependencies

Beat instantiation can declare modules as dependencies.

Therefore, declare them as array at constructor second parameter:

```js
var Beat = require('beat');
var db = module.exports = new Beat('db', ['mongoose']);

db.factory('db', function(mongoose, conf) {
  if(conf.env == 'test')
    mongoose.set('debug', true);
  return mongoose.createConnection(conf.mongo).once('open', function() {
    console.log('Mongoose connected');
  });
});
```

You can also use objects for aliasing:

```js
var Beat = require('beat');
var db = module.exports = new Beat('db', ['mongoose', {conf:'../config.json'}]);

db.factory('db', function(mongoose, conf) {
  if(conf.env == 'test')
    mongoose.set('debug', true);
  return mongoose.createConnection(conf.mongo).once('open', function() {
    console.log('Mongoose connected');
  });
});
```
_file paths starting with `/` will be relative to process cwd._

If the required module provides a Beat object, their properties will be mixed with local ones:

```js
var Beat = require('beat');
var routes = module.exports = new Beat('routes', [
  '/lib/middlewares',
  '/lib/models',
  '/lib/app'
]);

routes.factory('routes', function routes(app, authMiddleware, ProductsModel){
  app.all('/api/*', authMiddleware);
  app.get('/api/products/:id', function show(req, res) {
    ProductsModel.findById(req.params.id, function(err, doc) {
      res.send(err?400:(doc||404));
    });
  });
});
```
