(function(window, $, $db) {
    var templates = {
        'word_stats': Handlebars.compile($("#word-stats-template").html()),
    };
    var memorizedWords = readWords();
    var statsCall = null;
    updateMemorizedWordStats(memorizedWords);

    $("#word-list").on("words-updated", function() {
        decorateWords();
        updateMemorizedWordStats(memorizedWords);
    } );
    
    function decorateWords() {
        $(".word").each( function(index, elem) {
            var je = $(elem);
            $("span", je).after("<span class='memory'></span>");
            var word = je.data("word");
            var memorized = isMemorized(word);
            learnWord(word, memorized);
        });
        $(".memory").each( function(index, e) {
            var elem = $(e);
            elem.on("click", function() {
                var wordElem = $(this).parent();
                var word = wordElem.data("word");
                var memorized = wordElem.data("memorized");
                learnWord(word, !memorized);
            });
        });
    }
    
    function updateMemorizedWordStats(words) {
        if (statsCall != null) {
            statsCall.abort();
        }
        var params = $.extend({'words': words}, window.quranWords.filter);
        statsCall = $.post('/api/words/stats', params, function(data) {
            statsCall = null;
            $("#word-stats").html(templates.word_stats(data));
        });
    }
    
    function readWords() {
        return $db.get("memorizedWords") || [];
    }
    
    function learnWord(word, memorized) {
        memorized = (memorized == undefined) || memorized;
        var idx = memorizedWords.indexOf( word );
        if (memorized && idx == -1) {
            memorizedWords.push(word);
            $db.set("memorizedWords", memorizedWords);
            // only update if list of memorized words has changed
            updateMemorizedWordStats(memorizedWords);
        } else if (!memorized && idx > -1) {
            memorizedWords.splice( idx, 1 );
            $db.set("memorizedWords", memorizedWords);
            // only update if list of memorized words has changed
            updateMemorizedWordStats(memorizedWords);
        }

        var wordElems = $("*[data-word="+word+"]");
        wordElems.data("memorized", memorized);
        wordElems.toggleClass("memorized", memorized);
        $("*[data-word="+word+"] .memory").text(memorized ? "-" : "+");
    }
    
    function forgetWord(word) {
        learnWord(word, false);
    }
    
    function isMemorized(word) {
        return memorizedWords.indexOf(word) > -1;
    }
})(window, jQuery, jQuery.localStorage);