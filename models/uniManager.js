var Db = require('mongodb').Db;
var Server = require('mongodb').Server;

UniManager = function(host, port, dbName) {
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

UniManager.prototype.getCollection= function(callback) {
  this.db.collection('unis', function(error, myCollection) {
    if( error ) callback(error);
    else callback(null, myCollection);
  });
};

UniManager.prototype.findAll = function(callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        myCollection.find().toArray(function(error, unis) {
          if( error ) callback(error);
          else callback(null, unis);
        });
      }
    });
};

UniManager.prototype.find = function(course, callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        myCollection.find(course).toArray(function(error, unis) {
          if( error ) callback(error);
          else callback(null, unis);
        });
      }
    });
};

UniManager.prototype.findById = function(id, callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        myCollection.findOne({_id: id}, function(error, uni) {
          if( error ) callback(error);
          else{
      		callback(null, uni);
          }
        });
      }
    });
};

UniManager.prototype.findAllById = function(idArray, callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        myCollection.find({_id: {$in: idArray}}).toArray(function(error, unis) {
          if( error ) callback(error);
          else{
          callback(null, unis);
          }
        });
      }
    });
};

UniManager.prototype.save = function(unis, callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        if( typeof(unis.length)=="undefined")
          unis = [unis];
          myCollection.insert(unis, function(err) {
          	if(err) console.log("ERROR:"+err);
          	callback(null, unis);
        });
      }
    });
};

UniManager.prototype.close = function(){
	this.db.close();
}

exports.UniManager = UniManager;