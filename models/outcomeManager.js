var Db = require('mongodb').Db;
var Server = require('mongodb').Server;

OutcomeManager = function(host, port, dbName) {
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

OutcomeManager.prototype.getCollection= function(callback) {
  this.db.collection('outcomes', function(error, myCollection) {
    if( error ) callback(error);
    else callback(null, myCollection);
  });
};

OutcomeManager.prototype.findAll = function(callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        myCollection.find().toArray(function(error, outcomes) {
          if( error ) callback(error);
          else callback(null, outcomes);
        });
      }
    });
};

OutcomeManager.prototype.find = function(course, callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        myCollection.find(course).toArray(function(error, outcomes) {
          if( error ) callback(error);
          else callback(null, outcomes);
        });
      }
    });
};

OutcomeManager.prototype.findById = function(id, callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        myCollection.findOne({_id: id}, function(error, outcome) {
          if( error ) callback(error);
          else{
      		callback(null, outcome);
          }
        });
      }
    });
};

OutcomeManager.prototype.findAllById = function(idArray, callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        myCollection.find({cat: {$in: idArray}}).sort({"cat":1, "subcat":1}).toArray(function(error, outcomes) {
          if( error ) callback(error);
          else{
          callback(null, outcomes);
          }
        });
      }
    });
};

OutcomeManager.prototype.save = function(outcomes, callback) {
    this.getCollection(function(error, myCollection) {
      if( error ) callback(error);
      else {
        if( typeof(outcomes.length)=="undefined")
          outcomes = [outcomes];
          myCollection.insert(outcomes, function(err) {
          	if(err) console.log("ERROR:"+err);
          	callback(null, outcomes);
        });
      }
    });
};

OutcomeManager.prototype.close = function(){
	this.db.close();
}

exports.OutcomeManager = OutcomeManager;