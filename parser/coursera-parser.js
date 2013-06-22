var data  = require('../data/coursera.json');
var config = require('../config.json');

//var CourseManager = require('../models/courseManager').CourseManager;
//var courseManager = new CourseManager(config.database.url, config.database.port, config.database.name);

var courses = [];
for (id in data.topics){
	var course = data.topics[id];
	//console.log(course.name);
	course._id = id;
	courses.platform = "coursera";
	courses.push(course);
}


var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;    

  MongoClient.connect('mongodb://'+config.database.url+':'+config.database.port+'/'+config.database.name, function(err, db) {
    if(err) throw err;

    var collection = db.collection('courses');
    collection.insert(courses, function(err, docs) {

      collection.count(function(err, count) {
        console.log(format("count = %s courses saved!", count));
      });

	db.close();
    console.log("DONE!");     
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