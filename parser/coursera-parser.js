var data  = require('../data/coursera.json');
var config = require('../config.json');

//var CourseManager = require('../models/courseManager').CourseManager;
//var courseManager = new CourseManager(config.database.url, config.database.port, config.database.name);
//coursera categories association to domains in the Computer Science Curricula 2013
var cats2domains = {
	1 : [1,3,4],
	11: [2,7,8,10,11,12,13,17],
	12: [5,6,14,15,16,18],
	17: [9]
};

var courses = [];
for (id in data.topics){
	var course = data.topics[id];
	//console.log(course);
	course._id = course.id;
	course.platform = "coursera";
	if(course.cats){
		var domains = [];
		course.cats.forEach(function(cat){
			if(cat in cats2domains){
				domains = domains.concat(cats2domains[cat]);
			}
		});
		course.domains = domains;
		course.link = "http://www.coursera.org/course/"+course.short_name;
	}
	courses.push(course);
}

var cats = [];
data.cats.forEach(function(cat){
	//console.log(course.name);
	cat._id = cat.id;
	cat.platform = "coursera";
	cats.push(cat);
});

var opps = [];
data.courses.forEach(function(opp){
	//console.log(course.name);
	opp._id = opp.id;
	opp.platform = "coursera";
	opps.push(opp);
});

var unis = [];
data.unis.forEach(function(uni){
	//console.log(course.name);
	uni._id = uni.id;
	uni.platforms = ["coursera"];
	unis.push(uni);
});

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
    collection2.insert(cats, function(err, docs) {

      collection2.count(function(err, count) {
        console.log(format("count = %s categories saved!", count));
      });

	//db.close();
    console.log("DONE categories!");     
    });

    var collection3 = db.collection('opps');
    collection3.insert(opps, function(err, docs) {

      collection3.count(function(err, count) {
        console.log(format("count = %s opportunities saved!", count));
      });

	//db.close();
    console.log("DONE opportunities!");     
    });

    var collection4 = db.collection('unis');
    collection4.insert(unis, function(err, docs) {

      collection4.count(function(err, count) {
        console.log(format("count = %s unis saved!", count));
      });

	//db.close();
    console.log("DONE unis!");     
    });

  });

// courseManager.save(courses, function(error, courses2){
// 	if(error){
// 		console.log(error);
// 	}else{
// 		console.log(courses2[0].name);
// 	}
// 	console.log("DONE!");
// });
// courseManager.close();