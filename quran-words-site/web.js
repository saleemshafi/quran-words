var restify = require('restify');
var quran = require('../corpus-to-mongo/quranic-corpus-morphology-0.4.js');
var _ = require('underscore');
var url = require('url');

quran.tokens = _.map(quran.tokens, addQuranAndDisplayWord);
quran.stats = getQuranStats(quran.tokens);

function getQuranStats(quranTokens) {
    var quranTokenCounts = _.countBy(quranTokens, function(token) { return token.displayWord });
    var numUniqueTokens = _.keys(quranTokenCounts).length;
    var totalNumTokens = quranTokens.length;

    var allWords = _.chain(quranTokens)
        .groupBy(function(token) { return token.location.chapter+":"+token.location.verse+":"+token.location.word; })
        .map(function(words, location) {
            return _.map(words, function(token) { return token.displayWord; });
        })
        .value();
    var quranWordCounts = _.countBy(allWords, function(word) { return word; });
    var totalNumWords = allWords.length;
    var numUniqueWords = _.keys(quranWordCounts).length;
    
    return {
        "numWords": totalNumWords,
        "numUniqueWords": numUniqueWords,
        "numTokens": totalNumTokens,
        "numUniqueTokens": numUniqueTokens,
        "wordCounts": quranWordCounts,
        "tokenCounts": quranTokenCounts,
    };
}

function addQuranAndDisplayWord(token) {
    token.quranWord = token.lemma_tr ? token.lemma_tr : token.form_tr;
    token.displayWord = getDisplayWord(token.quranWord);
    return token;
}

function getDisplayWord(quranWord) {
    var word = quranWord;
    
    // remove shadda if it is on the first letter
    if('\u0651' == word[1]) {
        word = word.replace("\u0651", "");
    }
    
    // replace symbolic alif with real alif if not on top of ya'
    var symAlifSplit = word.split("\u0670");
    var origWordLen = word.length;
    word = "";
    for (var i=0; i<symAlifSplit.length; i++) {
        word = word.concat(symAlifSplit[i]);
        // ensure letter before sym alif is not ya' 
        if('\u0649' != word[word.length - 1]) {
            // avoid adding an extra sym alif that was not at the end of the orig word
            if(word.length != origWordLen) {
                word = word.concat("\u0627");
            }
        }
    }
    // add sym alif if it was the last letter in the quranWord
    if(word.length != origWordLen) {
        word = word.concat("\u0670");
    }
    
    return word;
}

function getIndex(req, res, next) {
    res.send({'links': {
        'words': baseUrl(req)+'api/words',
    }});
    return next();
}

function rangeCheck(range) {
    var s1, s2, a1, a2;
    if (range != undefined) {
        var pattern = new RegExp(/^(?:(\d*)(?::(\d+))?)(?:-(?:(\d*)(?::(\d+))?))?$/);
        var matches = range.match(pattern);
        if (matches) {
            s1 = matches[1];
            a1 = matches[2];
            s2 = matches[3];
            a2 = matches[4];
            
            // disallow range = "" or "-"
            if ((s1 == "" && s2 == undefined)
                || (s1 == "" && s2 == "")) {
                return function() { return false; };
            }
        } else return function() { return false; };
    }
    return function(token) {
        var l = token.location;
        return ((s1 == undefined || s1 == "") 
                || (l.chapter > s1 && s2 != undefined) 
                || (l.chapter == s1 && (a1 == undefined || l.verse == a1))
                || (l.chapter == s1 && s2 != undefined && l.verse > a1))
            && ((s2 == undefined || s2 == "")
                || l.chapter < s2
                || (l.chapter == s2 && (a2 == undefined || l.verse <= a2)));
    }
}

function rangeTokens(range) {
    return range_tokens = quran.tokens.filter( rangeCheck(range) );
}

function verseTokens(chapter, verse) {
    return quran.tokens.filter ( function(token) { return token.location.chapter == chapter && token.location.verse == verse } );
}

function typeFilter(typeSet) {
    var types = typeSet ? typeSet.split(",") : false;
    return function(token) {
        return !types || _.contains(types, token.tag);
    }
}

function getWords(req, res, next) {
    var mem_words = rangeTokens(req.query.range)
        .filter(typeFilter(req.query.typeSet))
        .map(function(token) { return {"word": token.displayWord, "tag":token.tag}; });
    var grouped_words = _.chain(mem_words).groupBy('word').pairs().value();
    var sorted_words = _.chain(grouped_words)
        .map( function(w) {
            return {
                "word":w[0], 
                "count":w[1].length,
                "links": {
                    "locations": baseUrl(req)+'api/locations/'+w[0]+(req.query.range ? '?range='+req.query.range : ''),
                    "verses": baseUrl(req)+'api/verses/'+w[0]+(req.query.range ? '?range='+req.query.range : '')
                }
            }; 
        })
        .sortBy('count')
        .reverse()
        .take(100)
        .value();
    res.send({'words':sorted_words});
    return next();
}

function getLocations(req, res, next) {
    var word = req.params.word;
    var locations = _.chain(rangeTokens(req.query.range))
        .filter( function(token) { return token.displayWord == word; } )
        .map( function(token) { 
            var location = token.location;
            location.links = {
                'verse': baseUrl(req)+'api/verse/'+location.chapter+'/'+location.verse+'?word='+location.word,
            };
            return location;
        })
        .take(100)
        .value();
    res.send({
        'word': word,
        'locations': locations
    });
    return next();
}

function getVerses(req, res, next) {
    var word = req.params.word;
    var versesTokens = _.chain(rangeTokens(req.query.range))
        .filter( function(token) { return token.displayWord == word; } )
        .map( function(token) { return { "chapter":token.location.chapter, "verse":token.location.verse }; } )
        .uniq(true, function(elem) { return elem.chapter+":"+elem.verse; } )
        .map( function (location) { return verseTokens(location.chapter, location.verse); } )
        .value();
    var verses = _.chain(versesTokens)
        .map( function (verseTokens) {
            var location = _.first(verseTokens).location;
            var wordsTokens = _.chain(verseTokens).groupBy( function(token) { return token.location.word; } ).values().value();
            var verse = wordsTokens
                .map( function(wordTokens) { return wordTokens.map( function(token) { return token.form_tr; } ).join(""); } )
                .join(" ");
            var verse_tr = wordsTokens
                .map( function(wordTokens) { return wordTokens.map( function(token) { return token.form; } ).join(""); } )
                .join(" ");
            return { 'verse': verse, 'verse_tr': verse_tr, 'location': location.chapter+':'+location.verse, 'chapter': location.chapter, 'verse_num': location.verse };
        })
        .value();
    res.send({
        'word': word,
        'verses': verses,
    });
    return next();
}

function getVerse(req, res, next) {
    var surah = req.params.surah;
    var verse = req.params.verse;
    var word = req.query.word;

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

function round(number, decimals) {
    decimals = decimals || 0;
    var adjust = Math.pow(10, decimals);
    return Math.round(number * adjust) / adjust;
}

function getMemorizedStats(tokens, stats) {
    var memorizedTokens = _.filter(tokens, function(token) { return stats.tokenCounts[token] != undefined; });
    var numMemorizedTokens = memorizedTokens.length;
    var numOccursMemorizedTokens = _.reduce(memorizedTokens, function(count, token) {
        return count + stats.tokenCounts[token];
    }, 0);

    var memorizedWords = _.chain(stats.wordCounts)
        .pairs()
        .filter(function(wordCount) {
            var word = wordCount[0];
            return _.every(word.split(","), function(token) {return memorizedTokens.indexOf(token) > -1; } ); 
        })
        .groupBy(function(wordCount) { return wordCount[0]; })
        .keys()
        .value();
    var numMemorizedWords = memorizedWords.length;
    var numOccursMemorizedWords = _.reduce(memorizedWords, function(count, word) {
        return count + stats.wordCounts[word];
    }, 0);
    
    return {
        "percentWords": round(numMemorizedWords / stats.numUniqueWords * 100, 2),
        "percentTokens": round(numMemorizedTokens / stats.numUniqueTokens * 100, 2),
        "percentWordOccurrence": round(numOccursMemorizedWords / stats.numWords * 100, 2),
        "percentTokenOccurrence": round(numOccursMemorizedTokens / stats.numTokens * 100, 2),
        "numWords": numMemorizedWords,
        "numTokens": numMemorizedTokens,
    };
}

function getWordStats(req, res, next) {
    var tokens = req.params.words || [];
    var filtered = rangeTokens(req.params.range)
        .filter(typeFilter(req.params.typeSet));
    res.send({
        "full": getMemorizedStats(tokens, quran.stats),
        "filtered": getMemorizedStats(tokens, getQuranStats(filtered)),
    });
    return next();
}

function baseUrl(req) {
    return 'http://'+req.headers.host+'/';
}

var server = restify.createServer();
server.use(restify.queryParser({ mapParams: false }));
server.use(restify.bodyParser());
server.use(function(req, res, next) {
    res.charSet('utf-8');
    return next();
});
server.get('/api/', getIndex);
server.get('/api/words', getWords);
server.post('/api/words/stats', getWordStats);
server.get('/api/locations/:word', getLocations);
server.get('/api/verses/:word', getVerses);
server.get('/api/verse/:surah/:verse', getVerse);
server.get(/^\/?.*/, restify.serveStatic({
  'directory': './pub',
  'default': 'index.html',
}));

var port = process.env.PORT || 5000;
server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url);
});
