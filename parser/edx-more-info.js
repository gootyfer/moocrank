var config = require('../config.json');
var MongoClient = require('mongodb').MongoClient;
var request = require('request');

MongoClient.connect('mongodb://'+config.database.url+':'+config.database.port+'/'+config.database.name, function(err, db) {
  if(err) throw err;
  var courses_collection = db.collection('courses');
  courses_collection.find({platform:"edx"}).toArray(function(err, courses){
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
			course.about = $('.about').text().trim();
			//course.description = info.description;
			//Short description
			course.short_description = $('.subtitle > h2').text().trim();
			//faq
			course.faq = $('.faq').text().trim();
			//youtube video id
			course.video = $('a[rel="lightvideo"]').attr('href');
			course.video = course.video.substr(course.video.indexOf('?')+3);
			//syllabus
			//course.syllabus = ;
			//TODO: get numbers and assume hours per week
			//workload
			course.workload = $('.effort').text().trim();
			//course format description
			//course.format = info.course_format;
			//recommended background
			course.background = $('#prerequisites-container > p').text().trim();
			//TODO: create date and duration in weeks
			course.opps =[{
								start_date_string: $('.startdate').text().trim(),
								duration_string: $('.duration').text().trim()
							}];

			callback(course);
	});
}