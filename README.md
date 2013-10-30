# beat
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
myServer.factory('port', function(){
  var port = 80;
  // some logic here
  return port;
});
```

**get(token)**: obtains a property

```js
myServer.value('port', 80);
var port = myServer.get('port');
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