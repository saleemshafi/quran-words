(function(window, $, $db) {
    var memorizedWords = [];

    $("#word-list").on("words-updated", decorateWords);
    readWords();
    
    function decorateWords() {
        $(".word").each( function(index, elem) {
            var je = $(elem);
            je.append("<span class='memory'></span>");
            var word = je.data("word");
            var memorized = isMemorized(word);
            learnWord(word, memorized);
        });
        $(".memory").each( function(index, e) {
            var elem = $(e);
            var wordElem = elem.parent();
            elem.on("click", function() {
                var word = wordElem.data("word");
                var memorized = wordElem.data("memorized");
                learnWord(word, !memorized);
            });
        });
    }
    
    function readWords() {
        memorizedWords = $db.get("memorizedWords") || [];
    }
    
    function learnWord(word, memorized) {
        memorized = (memorized == undefined) || memorized;
        var idx = memorizedWords.indexOf( word );
        if (memorized && idx == -1) {
            memorizedWords.push(word);
            $db.set("memorizedWords", memorizedWords);
        } else if (!memorized && idx > -1) {
            memorizedWords.splice( idx, 1 );
            $db.set("memorizedWords", memorizedWords);
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