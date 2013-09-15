// Obtain keywords from outcome name and sub-category
// Keywords are stored in 'keywords' objects with attributes:
// key: count

var config = require('../config.json'),
  natural = require('natural'),
  OutcomeManager = require('../models/outcomeManager').OutcomeManager;

var outcomeManager;

function countElementsBuilder(increment) {
  return function(list, current) {
    if ( list[current] ) {
      list[current] += increment;
    } else {
      list[current] = increment;
    }
    return list;
  };
}

function process(error, manager) { 
  var stemmer = natural.PorterStemmer;
  console.log(manager); 
   
  outcomeManager.findAll(function(error, outcomes) {
    if (error) {
      console.log(error);
      return;
    }
    for (var i = 0; i < outcomes.length; i++) {
      var outcome = outcomes[i];
      var nameStems = stemmer.tokenizeAndStem(outcome.name);
      var subcatStems = stemmer.tokenizeAndStem(outcome.subcatName);

      outcome.keywords = nameStems.reduce(countElementsBuilder(1), {});
      outcome.keywords = subcatStems.reduce(countElementsBuilder(2), outcome.keywords);

      console.log(outcome);

      outcomeManager.saveOne(outcome._id, outcome);
    }
    // outcomeManager.close();
  });
};

outcomeManager = new OutcomeManager(config.database.url, config.database.port, config.database.name, process);
