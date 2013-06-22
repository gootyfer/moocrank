var xmldoc = require('xmldoc');
var fs = require('fs');
var config = require('../config.json');
var xmlFilePath = './data/outcomes.xml';

fs.exists(xmlFilePath, function(exists){console.log(exists);})

fs.readFile(xmlFilePath, "UTF-8",function(error, xml) {
	//console.log(xml);
	var document = new xmldoc.XmlDocument(xml);
	var rootId = document.attr.id;
	var catArray = [];
	document.childrenNamed("LOCassociation").forEach(function(catNode){
		//search for root categories
		if(catNode.attr.type == "http://purl.org/net/inloc/LOCrel" && catNode.childNamed("subject").attr.id == rootId && catNode.childNamed("scheme").attr.id == "http://purl.org/net/inloc/hasLOCpart"){
			var catId = catNode.childNamed("object").attr.id;
			//search for the name
			var cat = {};
			//TODO: should we give the cat a unique id to avoid duplicates?
			var catDefinition = document.childWithAttribute("id",catId);
			if(catDefinition){
				cat.name = catDefinition.valueWithPath("title");
				//search for sub-categories
				cat.subcats = [];
				document.childrenNamed("LOCassociation").forEach(function(subcatNode){
					if(subcatNode.attr.type == "http://purl.org/net/inloc/LOCrel" && subcatNode.childNamed("subject").attr.id == catId && subcatNode.childNamed("scheme").attr.id == "http://purl.org/net/inloc/hasLOCpart"){
						var subcatId = subcatNode.childNamed("object").attr.id;
						//search for the name
						var subcat = {};
						var subcatDefinition = document.childWithAttribute("id",subcatId);
						subcat.name = subcatDefinition.valueWithPath("title");
						//search for outcomes
						subcat.outcomes = [];
						document.childrenNamed("LOCassociation").forEach(function(outcomeNode){
							if(outcomeNode.attr.type == "http://purl.org/net/inloc/LOCrel" && outcomeNode.childNamed("subject").attr.id == subcatId && outcomeNode.childNamed("scheme").attr.id == "http://purl.org/net/inloc/hasLOCpart"){
								var outcomeId = outcomeNode.childNamed("object").attr.id;
								//search for the name
								var outcome = {};
								var outcomeDefinition = document.childWithAttribute("id",outcomeId);
								if(outcomeDefinition){
									outcome.name = outcomeDefinition.valueWithPath("description");
									//search for outcome types (several are permitted)
									outcome.outcomeTypes = [];
									document.childrenNamed("LOCassociation").forEach(function(outcomeTypeNode){
										if(outcomeTypeNode.attr.type == "http://purl.org/net/inloc/category" && outcomeTypeNode.childNamed("subject").attr.id == outcomeId && outcomeTypeNode.childNamed("scheme").attr.id == "http://www.eummena.org/inloc/competence-IEEE-ACM-CS2013"){
											var outcomeTypeName = outcomeTypeNode.valueWithPath("object.label");
											outcome.outcomeTypes.push(outcomeTypeName);
										}
									});
									subcat.outcomes.push(outcome);
								}
							}
						});
						cat.subcats.push(subcat);
					}
				});
				catArray.push(cat);
				console.log(cat);
			}
		}
	});
	//Save to mongo
	var MongoClient = require('mongodb').MongoClient
	    , format = require('util').format;    

	  MongoClient.connect('mongodb://'+config.database.url+':'+config.database.port+'/'+config.database.name, function(err, db) {
	    if(err) throw err;

	    var collection = db.collection('outcomeCategories');
	    collection.insert(catArray, function(err, docs) {

	      collection.count(function(err, count) {
	        console.log(format("count = %s outcomeCategories saved!", count));
	      });

		db.close();
	    console.log("DONE!");     
	    });
	  });
	
	//console.log(document);
});


