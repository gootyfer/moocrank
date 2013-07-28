function changeOutcome(url){
	jQuery.ajax({
	  url: url
	}).done(function() {
	  console.log("saved");
	});
}

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-42081482-1', 'moocrank.com');
ga('send', 'pageview');

<!-- UserVoice JavaScript SDK (only needed once on a page) -->
(function(){var uv=document.createElement('script');uv.type='text/javascript';uv.async=true;uv.src='//widget.uservoice.com/END4McFdFlPOtx5dSW2HJQ.js';var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(uv,s)})()

<!-- A tab to launch the Classic Widget -->
UserVoice = window.UserVoice || [];
UserVoice.push(['showTab', 'classic_widget', {
  mode: 'full',
  primary_color: '#cc6d00',
  link_color: '#007dbf',
  default_mode: 'support',
  forum_id: 216610,
  tab_label: 'Feedback & Support',
  tab_color: '#cc6d00',
  tab_position: 'middle-right',
  tab_inverted: false
}]);