var scraper = require('scraper');
var config = require('../config.json');
var service_udacity = "https://www.udacity.com";

function scrapService(service, callback){
	scraper(service+'/courses'
		, function(err, $) {
	    if (err) {throw err}
	    //console.log($("body").html());
		//console.log($('#unfiltered-class-list > li').html());
	    var courses = [];
	    $('#unfiltered-class-list > li').each(function() {
	    	var course = {};
	    	course.small_icon_hover = $(this).find('.crs-li-thumbnails > img').attr('src');
	    	course.large_icon = course.small_icon_hover;
	    	//course.date = $(this).find('.start-date').text().trim();
	    	course.link = service + $(this).find('a').attr('href');
	    	course.name = $(this).find('.crs-li-title').text().trim();
	    	course.cats = $(this).find('.crs-li-tags-category').text().trim();
	    	course.unis = $(this).find('.crs-li-accredited > h4:last').text().trim();
	    	if(!course.unis) course.unis = "Udacity";
	    	course.platform = 'udacity';
	    	course.id = courses.length+10000;
	    	course._id = course.id;
	        courses.push(course);
	    });
		//console.log(courses);
		//console.log(courses.length+" courses scraped");
		callback(courses);
	});
}

scrapService(service_udacity, function(courses){
	var cats = [];
	var catsObj = [];
	var unis = [];
	var unisObj = [];
	courses.forEach(function(course){
		if(cats.indexOf(course.cats) == -1){
			catsObj.push({
				_id: cats.length+10000,
				id: cats.length+10000,
				name: course.cats,
				platform: "udacity"
			});
			cats.push(course.cats);
		}
		if(unis.indexOf(course.unis) == -1){
			unisObj.push({
				_id: unis.length+10000,
				id: unis.length+10000,
				name: course.unis,
				platforms: ["udacity"]
			});
			unis.push(course.unis);
		}
	});

	courses.forEach(function(course){
		if(course.cats == "COMPUTER SCIENCE"){
			switch(course.name){
				case "Algorithms":
				case "Intro to Theoretical Computer Science":
					course.domains = [1];
					break;
				case "Introduction to Programming in Java NEW":
					//FIX for the image of this course
					course.small_icon_hover = service_udacity + course.small_icon_hover;
					course.large_icon = course.small_icon_hover;
				case "Introduction to Computer Science":
					course.domains = [15];
					break;
				case "Differential Equations in Action":
					course.domains = [3];
					break;
				case "Web Development":
				case "HTML5 Game Development":
					course.domains = [12, 14];
					break;
				case "Software Testing":
				case "Software Debugging":
					course.domains = [16, 14];
					break;
				case "Programming Languages":
					course.domains = [14];
					break;
				case "Introduction to Artificial Intelligence":
				case "Artificial Intelligence for Robotics":
					course.domains = [9];
					break;
				case "Interactive 3D Graphics":
					course.domains = [5];
					break;
				case "Design of Computer Programs":
					course.domains = [16];
					break;
				case "Intro to Parallel Programming":
					course.domains = [13];
					break;
				case "Functional Hardware Verification":
					course.domains = [2, 17];
					break;
				case "Applied Cryptography":
					course.domains = [7];
					break;
			}
		}
		course.cats = [cats.indexOf(course.cats)+10000];
		course.unis = [unis.indexOf(course.unis)+10000];
	});
	
	//console.log(cats);
	//console.log(unis);
	//console.log(courses);
	//console.log(courses.length+" courses scraped");

	//Save to mongo cats, unis and courses
	var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;    

  MongoClient.connect('mongodb://'+config.database.url+':'+config.database.port+'/'+config.database.name, function(err, db) {
    if(err) throw err;

    var collection = db.collection('courses');
    collection.insert(courses, function(err, docs) {

      collection.count(function(err, count) {
        console.log(format("count = %s courses saved!", count));
      });

	//db.close();
    console.log("DONE courses!");     
    });

    var collection2 = db.collection('cats');
    collection2.insert(catsObj, function(err, docs) {

      collection2.count(function(err, count) {
        console.log(format("count = %s categories saved!", count));
      });

	//db.close();
    console.log("DONE categories!");     
    });

    var collection4 = db.collection('unis');
    collection4.insert(unisObj, function(err, docs) {

      collection4.count(function(err, count) {
        console.log(format("count = %s unis saved!", count));
      });

	//db.close();
    console.log("DONE unis!");     
    });

  });
});