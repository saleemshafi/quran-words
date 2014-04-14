(function(window, $) {
    var filter = { range: $("#range").val() };
    
    var templates = {
        'word_list': Handlebars.compile($("#word-list-template").html()),
        'word_verses': Handlebars.compile($("#word-verses-template").html()),
    };

    function updateWords() {
        $.get('/api/words', filter, function(data) {
            $("#word-list").html(templates.word_list(data));
            $("#word-list .word span").on("click", function() {
                var details = $(this).parent().children("details");
                if (!details.data("loaded")) {
                    var word = $(this).parent().data("word");
                    loadVerses(word, details);
                } else {
                    details.toggle();
                }
            });
            $("#word-list").trigger("words-updated");
        });
    }
    
    function loadVerses(word, versesElem) {
        $.get('/api/verses/'+word, filter, function(data) {
            versesElem.data("loaded", true);
            versesElem.html(templates.word_verses(data));
            $.get('/api/locations/'+word, filter, function(data) {
                var word = data.word;
                $(data.locations).each(function(idx, location) {
                    highlightWord(word, location.word, 
                        $("*[data-chapter="+location.chapter+"][data-verse="+location.verse+"]", versesElem));
                });
            });   
        });
    }
    
    function highlightWord(word, wordIndex, verseElem) {
        var text = verseElem.html();
        if (text) {
            var highlighted = text.split(" ");
            highlighted[wordIndex-1] = "<mark>"+highlighted[wordIndex-1]+"</mark>";
            verseElem.html(highlighted.join(" "));
        }
    }
    
    function attachFilterHandler() {
        $("#range").change( function() {
            filter.range = $(this).val();
            updateWords();
        } );
        $("input:checkbox[name=type]").change( function() {
            filter.typeSet = $.makeArray($("input:checkbox[name=type]:checked").map( function() { 
                return $(this).val();
            } )).join(",");
            updateWords();
        } );
    }

    $(window.document).ready( function() {
        updateWords();
        attachFilterHandler();
    });
    
    window.quranWords = {
        "filter": filter,
    };
})(window, jQuery);