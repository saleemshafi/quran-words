var restify = require('restify');
var quran = require('../corpus-to-mongo/quranic-corpus-morphology-0.4.js');
var _ = require('underscore');
var url = require('url');

function getIndex(req, res, next) {
    res.send({'links': {
        'words': baseUrl(req)+'api/words',
    }});
    return next();
}

function getWords(req, res, next) {
    var memorized_words = quran.tokens.filter( function(token) { return token.location.chapter >= 0 } );
    var mem_words = memorized_words.map(function(token) { return {"word": token.lemma_tr ? token.lemma_tr : token.form_tr, "tag":token.tag}; });
    var grouped_words = _.chain(mem_words).groupBy('word').pairs().value();
    var sorted_words = _.chain(grouped_words)
        .map( function(w) { 
            return {
                "word":w[0], 
                "count":w[1].length,
                "links": {
                    "locations": baseUrl(req)+'api/locations/'+w[0],
                }
            }; 
        })
        .sortBy('count')
        .reverse()
        .take(10)
        .value();
    res.send({'words':sorted_words});
    return next();
}

function getLocations(req, res, next) {
    var word = req.params.word;
    var locations = _.chain(quran.tokens)
        .filter( function(token) { return token.lemma_tr == word || token.form_tr == word; } )
        .map( function(token) { 
            var location = token.location;
            location.links = {
                'verse': baseUrl(req)+'api/verse/'+location.chapter+'/'+location.verse+'?word='+location.word,
            };
            return location;
        })
        .take(10)
        .value();
    res.send({
        'word': word,
        'locations': locations
    });
    return next();
}

function getVerse(req, res, next) {
    var surah = req.params.surah;
    var verse = req.params.verse;
    var word = req.params.word;

    var words = _.chain(quran.tokens)
        .filter( function(token) { return token.location.chapter == surah && token.location.verse == verse; } )
        .groupBy( function(token) { return token.location.word; } )
        .values()
        .value();
    var verse = words
        .map( function(word_tokens) {
            return word_tokens
                .map(function(token) { return token.form_tr; })
                .join("");
        } )
        .join(" ");
    var verse_tr = words
        .map( function(word_tokens) {
            return word_tokens
                .map(function(token) { return token.form; })
                .join("");
        } )
        .join(" "); 
    res.send({
        'verse': verse,
        'verse_tr': verse_tr,
    });
    return next();
}

function baseUrl(req) {
    return 'http://'+req.headers.host+'/';
}

var server = restify.createServer();
server.use(restify.queryParser({ mapParams: false }));
server.use(function(req, res, next) {
    res.charSet('utf-8');
    return next();
});
server.get('/', getIndex);
server.get('/api/', getIndex);
server.get('/api/words', getWords);
server.get('/api/locations/:word', getLocations);
server.get('/api/verse/:surah/:verse', getVerse);
server.get(/\/?.*/, restify.serveStatic({
  directory: './public'
}));

var port = process.env.PORT || 5000;
server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url);
});
