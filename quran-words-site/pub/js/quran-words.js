(function(window, $) {
    var filter = { range: $("#range").val() };
    
    var templates = {
        'word_list': Handlebars.compile($("#word-list-template").html()),
    };

    function updateWords() {
        $.get('/api/words', filter, function(data) {
            var rendered = templates.word_list(data);
            $("#word-list").html(templates.word_list(data));
            $("#word-list").trigger("words-updated");
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