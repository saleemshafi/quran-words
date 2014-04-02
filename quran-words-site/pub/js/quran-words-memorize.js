(function(window, $, $db) {
    var memorizedWords = [];

    $("#word-list").on("words-updated", decorateWords);
    readWords();
    
    function decorateWords() {
        $(".word").each( function(index, elem) {
            var je = $(elem);
            var word = je.data("word");
            var memorized = isMemorized(word);
            je.data("memorized", memorized);

            if (memorized) {
                je.append("<span class='memory memorized'>-</span>");
            } else {
                je.append("<span class='memory'>+</span>");
            }
        });
        $(".memory").each( function(index, e) {
            var elem = $(e);
            var wordElem = elem.parent();
            elem.on("click", function() {
                var word = wordElem.data("word");
                var memorized = wordElem.data("memorized");
                wordElem.data("memorized", !memorized);
                elem.toggleClass("memorized", !memorized);
                elem.text( !memorized ? "-" : "+" );
                if (memorized) {
                    forgetWord(word);
                } else {
                    learnWord(word);
                }
            });
        });
    }
    
    function readWords() {
        memorizedWords = $db.get("memorizedWords") || [];
    }
    
    function learnWord(word) {
        memorizedWords.push(word);
        $db.set("memorizedWords", memorizedWords);
    }
    
    function forgetWord(word) {
        memorizedWords.splice( memorizedWords.indexOf( word ), 1 );
        $db.set("memorizedWords", memorizedWords);
    }
    
    function isMemorized(word) {
        return memorizedWords.indexOf(word) > -1;
    }
})(window, jQuery, jQuery.localStorage);