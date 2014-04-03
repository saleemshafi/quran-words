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
    
    function loadVerses(word, locationsElem) {
        $.get('/api/verses/'+word, filter, function(data) {
            locationsElem.data("loaded", true);
            locationsElem.html(templates.word_verses(data));
        });
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
})(window, jQuery);