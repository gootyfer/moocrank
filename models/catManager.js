var Db = require('mongodb').Db;
var Server = require('mongodb').Server;

CatManager = function(host, port, dbName) {
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

CatManager.prototype.getCollection= function(callback) {
  this.db.collection('cats', function(error, myCollection) {
    if( error ) callback(error);
    else callback(null, myCollection);
  });
};

CatManager.prototype.findAll = function(callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        myCollection.find().toArray(function(error, cats) {
          if( error ) callback(error);
          else callback(null, cats);
        });
      }
    });
};

CatManager.prototype.find = function(course, callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        myCollection.find(course).toArray(function(error, cats) {
          if( error ) callback(error);
          else callback(null, cats);
        });
      }
    });
};

CatManager.prototype.findById = function(id, callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        myCollection.findOne({_id: id}, function(error, cat) {
          if( error ) callback(error);
          else{
      		callback(null, cat);
          }
        });
      }
    });
};

CatManager.prototype.findAllById = function(idArray, callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        myCollection.find({_id: {$in: idArray}}).toArray(function(error, cats) {
          if( error ) callback(error);
          else{
          callback(null, cats);
          }
        });
      }
    });
};

CatManager.prototype.save = function(cats, callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        if( typeof(cats.length)=="undefined")
          cats = [cats];
          myCollection.insert(cats, function(err) {
          	if(err) console.log("ERROR:"+err);
          	callback(null, cats);
        });
      }
    });
};

CatManager.prototype.close = function(){
	this.db.close();
}

exports.CatManager = CatManager;