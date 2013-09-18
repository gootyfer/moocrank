var config = require('../config.json');
var MongoClient = require('mongodb').MongoClient;
var request = require('request');

MongoClient.connect('mongodb://'+config.database.url+':'+config.database.port+'/'+config.database.name, function(err, db) {
  if(err) throw err;
  var courses_collection = db.collection('courses');
  courses_collection.find({platform:"udacity"}).toArray(function(err, courses){
  	if(err) throw err;
  	var courses_done = 0;
  	courses.forEach(function(course){
  		scrapService(course, function(course){
  			courses_collection.save(course, function(err, course){
					if(err) throw err;
					courses_done++;
					if(courses_done == courses.length){
  					//console.log(courses);
						db.close();
						console.log('DONE!');
  				}
				});
  		})
  	});
  });
});

function scrapService(course, callback){
	scraper(course.link
		, function(err, $) {
	    if (err) {throw err}

	    //Long descriptions
			course.about = $('.sum-need-get > .pretty-format > p').first().text().trim();
			//recommended background
			course.background = $('.sum-need-get > .pretty-format > p').slice(1, 1).text().trim();
			//Short description
			course.short_description = $('.sum-need-get > .pretty-format > p').last().text().trim();
			//course.description = info.description;
			//syllabus
			course.syllabus = $('.syllabus > .pretty-format').first().text().trim();
			//faq
			course.faq = $('.syllabus > .pretty-format').last().text().trim();
			//youtube video id
			course.video = $('#overview-video').attr('data-video-id');
			//workload
			//TODO: include default udacity workload in hours per week
			//course.workload = info.estimated_class_workload;
			//course format description
			//course.format = info.course_format;
			//TODO: initial date when the students enroles
			//TODO: estimate duration according to the student profile o 8 week by default?

			callback(course);
	});
}