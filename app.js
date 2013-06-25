
/**
 * Module dependencies.
 */

var express = require('express')
//  , routes = require('./routes')
//  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , CatManager = require('./models/catManager').CatManager
  , UniManager = require('./models/uniManager').UniManager
  , OutcomeManager = require('./models/outcomeManager').OutcomeManager
  , CourseManager = require('./models/courseManager').CourseManager ;

//config file
var config = require('./config.json');

var app = express();

// all environments
app.set('port', process.env.PORT || config.server.port);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// app.get('/', routes.index);
// app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var courseManager = new CourseManager(config.database.url, config.database.port, config.database.name);
var uniManager = new UniManager(config.database.url, config.database.port, config.database.name);
var catManager = new CatManager(config.database.url, config.database.port, config.database.name);
var outcomeManager = new OutcomeManager(config.database.url, config.database.port, config.database.name);

//Routes

app.get('/', function(req, res){
  courseManager.findAll(function(error, courses){
    res.render('index', {
      title: 'Courses',
      courses: courses
    });
  });
});

app.get('/search', function(req, res){
  //Search computer science courses only
  courseManager.find({cats:{$in:[1,11,12,17]}}, function(error, courses){
    uniManager.findAll(function(error, unis){
      catManager.findAll(function(error, cats){
        courses.forEach(function(course){
          //Add unis names
          course.unisNames = [];
          if(course.unis){
            var myUnis = searchUnis(unis, course.unis);
            myUnis.forEach(function(uni){
              course.unisNames.push(uni.name);
            });
          }
          //Add cat names
          course.catsNames = [];
          if(course.cats){
            var myCats = searchCats(cats, course.cats);
            myCats.forEach(function(cat){
              course.catsNames.push(cat.name);
            });
          }
        });
        res.render('search', {
          title: 'Courses recommendation',
          courses: courses
        });
      });
    });
  });
});

app.get('/evaluate/:id', function(req, res){
  //console.log(req.params.id);
  courseManager.findById(parseInt(req.params.id), function(error, course){
    if(error) res.send(404, 'Sorry, we cannot find that!');
    else{
      uniManager.findAllById(course.unis, function(error, unis){
        catManager.findAllById(course.cats, function(error, cats){
          outcomeManager.findAllById(course.domains, function(error, outcomes){
            //console.log(course);
            //console.log(unis);
            //console.log(cats);
            //console.log(outcomes);
            res.render('evaluation', {
              title: 'Evaluate '+course.name,
              course:course, 
              unis:unis, 
              cats:cats, 
              outcomes: outcomes
            });
          });
        });
      });
    }
  });
});

app.get('/addOutcome/:courseId/:outcomeId', function(req, res){
  courseManager.findById(parseInt(req.params.courseId), function(error, course){
    if(error) res.send(404);
    else{
      course.outcomes = course.outcomes? course.outcomes : [];
      course.outcomes.push(parseInt(req.params.outcomeId));
      courseManager.save(course, function(error, courses){
        if(error) res.send(404);
        else res.send(200);
      });
    }
  });
});

app.get('/removeOutcome/:courseId/:outcomeId', function(req, res){
  courseManager.findById(parseInt(req.params.id), function(error, course){
    if(error || !course.outcomes) res.send(404);
    else{
      var outcomeIdIndex = course.outcomes.indexOf(parseInt(req.params.outcomeId));
      if(outcomeIdIndex != -1){
        //Remove from array
        course.outcomes.splice(outcomeIdIndex,1);
        courseManager.save(course, function(error, courses){
          if(error) res.send(404);
          else res.send(200);
        });
      }
    }
  });
});

//Helpers
function searchUnis(unis, uniIds){
  var found = [];
  unis.forEach(function(uni){
    if(uniIds.indexOf(uni.id)!=-1){
      found.push(uni);
    }
  });
  return found;
}

function searchCats(cats, catIds){
  var found = [];
  cats.forEach(function(cat){
    if(catIds.indexOf(cat.id)!=-1){
      found.push(cat);
    }
  });
  return found;
}