var restify = require('restify');

var server = restify.createServer();
server.use(restify.queryParser({ mapParams: false }));

server.get('/api/', function() {});
server.get(/\/?.*/, restify.serveStatic({
  directory: './public'
}));

var port = process.env.PORT || 5000;
server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url);
});
