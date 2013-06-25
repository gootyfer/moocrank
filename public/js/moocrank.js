function changeOutcome(url){
	jQuery.ajax({
	  url: url
	}).done(function() {
	  console.log("saved");
	});
}