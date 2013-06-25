var Db = require('mongodb').Db;
var Server = require('mongodb').Server;

CourseManager = function(host, port, dbName) {
	//console.log(host+port+dbName);
  this.db= new Db(dbName, new Server(host, port), {auto_reconnect: true, safe: true});
  this.db.open(function(err, client){
  	if(err){
  		console.log("Error!:"+err);
  	}else{
  		//console.log("open OK");
  	}
  });
};

CourseManager.prototype.getCollection= function(callback) {
  this.db.collection('courses', function(error, myCollection) {
    if( error ) callback(error);
    else callback(null, myCollection);
  });
};

CourseManager.prototype.findAll = function(callback) {
    this.getCollection(function(error, coursesCollection) {
      if( error ) callback(error);
      else {
        coursesCollection.find().toArray(function(error, results) {
          if( error ) callback(error);
          else callback(null, results);
        });
      }
    });
};

CourseManager.prototype.find = function(course, callback) {
    this.getCollection(function(error, coursesCollection) {
      if( error ) callback(error);
      else {
        coursesCollection.find(course).sort({id:1}).toArray(function(error, results) {
          if( error ) callback(error);
          else callback(null, results);
        });
      }
    });
};

CourseManager.prototype.findById = function(id, callback) {
    this.getCollection(function(error, coursesCollection) {
      if( error ) callback(error);
      else {
        coursesCollection.findOne({_id: id}, function(error, course) {
          if( error ) callback(error);
          else{
      		callback(null, course);
          }
        });
      }
    });
};

CourseManager.prototype.findAllById = function(idArray, callback) {
    this.getCollection(function(error, coursesCollection) {
      if( error ) callback(error);
      else {
        coursesCollection.find({_id: {$in: idArray}}).toArray(function(error, courses) {
          if( error ) callback(error);
          else{
      		callback(null, courses);
          }
        });
      }
    });
};

CourseManager.prototype.insert = function(courses, callback) {
    this.getCollection(function(error, coursesCollection) {
      if( error ) callback(error);
      else {
        if( typeof(courses.length)=="undefined")
          courses = [courses];
          coursesCollection.insert(courses, function(err) {
          	if(err) console.log("ERROR:"+err);
          	callback(null, courses);
        });
      }
    });
};

CourseManager.prototype.save = function(course, callback) {
    this.getCollection(function(error, coursesCollection) {
      if( error ) callback(error);
      else {
          coursesCollection.save(course, function(err) {
          	if(err) console.log("ERROR:"+err);
          	callback(null, course);
        });
      }
    });
};

CourseManager.prototype.close = function(){
	this.db.close();
}

exports.CourseManager = CourseManager;