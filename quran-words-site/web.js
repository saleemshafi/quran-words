var restify = require('restify');
var quran = require('../corpus-to-mongo/quranic-corpus-morphology-0.4.js');
var _ = require('underscore');

function getWords(req, res, next) {
    var memorized_words = quran.tokens.filter( function(token) { return token.location.chapter >= 0 } );
    var mem_words = memorized_words.map(function(token) { return {"word": token.lemma_tr ? token.lemma_tr : token.form_tr, "tag":token.tag}; });
    var grouped_words = _.chain(mem_words).groupBy('word').pairs().value();
    var sorted_words = _.chain(grouped_words)
        .map( function(w) { return {"word":w[0], "count":w[1].length} } )
        .sortBy('count')
        .reverse()
        .take(10)
        .value();
    res.charSet('utf-8');
    res.send(sorted_words);
    return next();
}

var server = restify.createServer();
server.use(restify.queryParser({ mapParams: false }));

server.get('/api/words', getWords);
server.get(/\/?.*/, restify.serveStatic({
  directory: './public'
}));

var port = process.env.PORT || 5000;
server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url);
});
