(function(window, $) {
    var filter = { range: "" };
    var templates = {
        'word_list': Handlebars.compile($("#word-list-template").html()),
    };

    function updateWords() {
        $.get('/api/words', filter, function(data) {
            var rendered = templates.word_list(data);
            $("#word-list").html(templates.word_list(data));
        });
    }
    
    function attachFilterHandler() {
        $("#range").change( function() {
            filter.range = $(this).val();
            updateWords();
        } );
    }

    $(window.document).ready( function() {
        updateWords();
        attachFilterHandler();
    });
})(window, jQuery);