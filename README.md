beat
====
Simple dependency injection for node

[![NPM](https://nodei.co/npm/beat.png)](https://npmjs.org/package/beat)

```js
var Beat = require('beat');
var app = new Beat('app');

app.value('port',    process.env.PORT || 3000);
app.value('express', require('express'));
  
app.factory('app',   function(express){
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