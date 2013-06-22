var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

CourseManager = function(host, port, dbName) {
	//console.log(host+port+dbName);
  this.db= new Db(dbName, new Server(host, port), {auto_reconnect: true, safe: true});
  this.db.open(function(err, client){
  	if(err){
  		console.log("Error!:"+err);
  	}else{
  		console.log("open OK");
  	}
  });
};

CourseManager.prototype.getCollection= function(callback) {
	  this.db.collection('courses', function(error, coursesCollection) {
	    if( error ) callback(error);
	    else callback(null, coursesCollection);
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


	CourseManager.prototype.findById = function(id, callback) {
	    this.getCollection(function(error, coursesCollection) {
	      if( error ) callback(error);
	      else {
	        coursesCollection.findOne({_id: coursesCollection.db.bson_serializer.ObjectID.createFromHexString(id)}, function(error, result) {
	          if( error ) callback(error);
	          else callback(null, result);
	        });
	      }
	    });
	};

	CourseManager.prototype.save = function(courses, callback) {
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

	CourseManager.prototype.close = function(){
		this.db.close();
	}

	exports.CourseManager = CourseManager;