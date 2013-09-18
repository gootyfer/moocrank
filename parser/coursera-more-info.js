var config = require('../config.json');
var MongoClient = require('mongodb').MongoClient;
var request = require('request');
var moreInfoURL = 'https://www.coursera.org/maestro/api/topic/information?topic-id=';

MongoClient.connect('mongodb://'+config.database.url+':'+config.database.port+'/'+config.database.name, function(err, db) {
  if(err) throw err;
  var courses_collection = db.collection('courses');
  courses_collection.find({platform:"coursera"}).toArray(function(err, courses){
  	if(err) throw err;
  	var courses_done = 0;
  	courses.forEach(function(course){
  		if(course.short_name){
  			console.log(moreInfoURL+course.short_name);
  			request(moreInfoURL+course.short_name, function(error, response, info){
  				info = JSON.parse(info);
  				//Long descriptions
  				course.about = info.about_the_course;
  				course.description = info.description;
  				//Short description
					course.short_description = info.short_description;
					//faq
					course.faq = info.faq;
					//youtube video id
					course.video = info.video;
					//syllabus
					course.syllabus = info.course_syllabus;
					//TODO: get numbers and assume hours per week
					//workload
					course.workload = info.estimated_class_workload;
					//course format description
					course.format = info.course_format;
					//recommended background
					course.background = info.recommended_background;

					//lerning opportunities
					course.opps = [];
					//console.log(info.courses);
					if(info.courses){
						info.courses.forEach(function(opp){
							course.opps.push({
								//TODO: create date
								start_day: opp.start_day,
								start_month: opp.start_month,
								start_year: opp.start_year,
								//TODO: assume weeks
								duration_string: opp.duration_string
							});
						});
					}
					//console.log(course);
					courses_collection.save(course, function(err, course){
						if(err) throw err;	
						if(courses_done == courses.length){
	  					//console.log(courses);
							db.close();
							console.log('DONE!');
	  				}
					});
  			}).end();
  		}
  		courses_done++;
  	});
  });
});