$(document).ready(function() {
	loadRoots();
});

function loadRoots() {
	$.ajax("api/roots", {
		success: function(data) {
			$('#root_list').html(data);
		}
	});
}
