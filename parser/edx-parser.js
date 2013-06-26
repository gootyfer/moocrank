var scraper = require('scraper');
var config = require('../config.json');
var service_edx = "https://www.edx.org";

function scrapService(service, page, callback){
	scraper(service+'/course-list/allschools/computer%20science/allcourses?page='+page
		, function(err, $) {
	    if (err) {throw err}
	    //console.log($("body").html());
		//console.log($('.course-tile').html());
	    var courses = [];
	    $('.course-tile').each(function() {
	    	var course = {};
	    	course.small_icon_hover = $(this).find('.image > img').attr('src');
	    	course.large_icon = course.small_icon_hover;
	    	//course.date = $(this).find('.start-date').text().trim();
	    	course.link = service + $(this).find('.go-to-course').attr('href');
	    	course.name = $(this).find('.title > h1:last').text().trim();
	    	course.cats = [10000];
	    	course.unis = $(this).find('.school-list').text().trim();
	    	course.platform = 'edx';
	    	//course.id = courses.length+20000;
	    	//course._id = course.id;
	        courses.push(course);
	    });
		//console.log(courses);
		//console.log(courses.length+" courses scraped");
		callback(courses);
	});
}

scrapService(service_edx, 0, function(courses0){
	scrapService(service_edx, 1, function(courses1){
		scrapService(service_edx, 2, function(courses2){
			var courses = [].concat(courses0, courses1, courses2);
			//console.log(courses);
			//console.log(courses.length+" courses scraped");
			//Remove duplicates
			var uniqueCoursesNames = [];
			var uniqueCoursesObj = [];
			var unis = [];
			var unisObj = [];
			var catsObj = {id:20000, _id:20000, name:"Computer Science", platform:"edx"};
			courses.forEach(function(course){
				//Tried to delete duplicates, but the SaaS course in two parts fucks it off!
				//course.name = course.name.substring(course.name.indexOf(':')+2);
				//Duplicates manually
				var dups = ['CS169.1x: Software as a Service', 'CS169.2x: Software as a Service', 'CS169.1x : Software as a Service', 'CS184.1x: Foundations of Computer Graphics'];
				if(uniqueCoursesNames.indexOf(course.name)==-1 && dups.indexOf(course.name)==-1){
					//Remove duplicates manually
					uniqueCoursesNames.push(course.name);
					uniqueCoursesObj.push(course);
				}
				if(unis.indexOf(course.unis)==-1){
					unisObj.push({
						_id: unis.length+20000,
						id: unis.length+20000,
						name: course.unis,
						platforms: ["edx"]
					});
					unis.push(course.unis);
				}
			});
			uniqueCoursesObj.forEach(function(course, index){
				course.cats = [20000];
				course.unis = [unis.indexOf(course.unis)+20000];
				course.id = index + 20000;
				course._id = course.id;
				switch(course.name){
					case "CS-184.1x: Foundations of Computer Graphics":
						course.domains = [5];
						break;
					case "CS-169.2x: Software as a Service":
					case "CS-169.1x: Software as a Service":
						course.domains = [16];
						break;
					case "6.002x: Circuits and Electronics":
						course.domains = [2, 17];
						break;
					case "CS188.1x: Artificial Intelligence":
						course.domains = [9];
						break;
					case "CS191x: Quantum Mechanics and Quantum Computation":
						course.domains = [1, 3];
						break;
					case "6.00x: Introduction to Computer Science and Programming":
						course.domains = [14, 15];
						break;
					case "CS50x: Introduction to Computer Science":
						course.domains = [8, 15];
						break;
				}
			});
		 	//console.log(catsObj);
			//console.log(unisObj);
			//console.log(uniqueCoursesObj);
			//console.log(uniqueCoursesObj.length+" courses to save");

			//Save to mongo cats, unis and courses
			var MongoClient = require('mongodb').MongoClient
			, format = require('util').format;    

			MongoClient.connect('mongodb://'+config.database.url+':'+config.database.port+'/'+config.database.name, function(err, db) {
			    if(err) throw err;

			    var collection = db.collection('courses');
			    collection.insert(uniqueCoursesObj, function(err, docs) {

			      collection.count(function(err, count) {
			        console.log(format("count = %s courses in total!", count));
			      });

				//db.close();
			    console.log("DONE courses!");     
			    });

			    var collection2 = db.collection('cats');
			    collection2.insert(catsObj, function(err, docs) {

			      collection2.count(function(err, count) {
			        console.log(format("count = %s categories in total!", count));
			      });

				//db.close();
			    console.log("DONE categories!");     
			    });

			    var collection4 = db.collection('unis');
			    collection4.insert(unisObj, function(err, docs) {

			      collection4.count(function(err, count) {
			        console.log(format("count = %s unis in total!", count));
			      });

				//db.close();
			    console.log("DONE unis!");     
			    });

			});
		});
	});
});
