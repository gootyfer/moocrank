
/**
 * Module dependencies.
 */

var express = require('express')
//  , routes = require('./routes')
//  , user = require('./routes/user')
//  , wishlist = require('./routes/wishlist')
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , mongoose = require('mongoose')
  , LocalStrategy = require('passport-local').Strategy
  , CatManager = require('./models/catManager').CatManager
  , UniManager = require('./models/uniManager').UniManager
  , OutcomeManager = require('./models/outcomeManager').OutcomeManager
  , CourseManager = require('./models/courseManager').CourseManager;

//config file
var config = require('./config.json');

// mongoose connection and models
mongoose.connect('mongodb://' + config.database.url + ':' + config.database.port + '/' + config.database.name);
var User = require('./models/userModel').User;

// register auth strategy
passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({username: username}, function(err, user) {
    if (err) return done(err);
    if (!user) return done(null, false, {message: 'Unknown user.'});
    user.comparePassword(password, function(err, isMatch) {
      if (err) return done(err);
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, {message: 'Invalid password.'});
      }
    });
  });
}));

var app = express();

// all environments
app.set('port', process.env.PORT || config.server.port);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({secret: 'brazil 2 - uruguay 1'}));
app.use(passport.initialize());
app.use(passport.session());
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
          title: 'moocrank',
          active: 0
        });
  });
});

app.get('/wishlist', ensureAuthenticated, function(req, res) {
   outcomeManager.findAll(function(error, outcomes) {
     var outcomesTree = treeStructure(outcomes);
     res.render('wishlist', { active: 1, title: 'Select outcomes', cats: outcomesTree});  
   }); 
});

app.get('/search', function(req, res){
  var searchObj = {cats:{$in:[1,11,12,17,10000,20000]}};
  if(req.query.query){
    searchObj.name = {$regex:req.query.query, $options: 'i'};
  }
  //Search computer science courses only
  courseManager.find(searchObj, function(error, courses){
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
          active: 2,
          title: 'Courses recommendation',
          active: 2, 
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
              active: 2,
              title: 'Evaluate '+course.name,
              active: 2, 
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

// User login

app.get('/login', function(req, res, next) {
  res.render('login', {
    activate: 5,
    user: req.user, 
    message: req.session.messages
  });
});

app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err);
    if (!user) {
      req.session.messages = [info.message];
      return res.redirect('/login'); 
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      return res.redirect('/');
    });
  })(req, res, next);
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
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

function treeStructure(outcomes) {
  var arrayByCats = {};
  outcomes.map(function(outcome) {
    var createSubcat = false;
    if (outcome.cat in arrayByCats) {
      if (outcome.subcat in arrayByCats[outcome.cat].subcats) {
        arrayByCats[outcome.cat].subcats[outcome.subcat].outcomes.push(outcome);
      } else {
        createSubcat = true;
      }
    } else {
      arrayByCats[outcome.cat] = {
        id: outcome.cat,
        catName: outcome.catName,
        subcats: {}
      };
      createSubcat = true;
    }
    if (createSubcat) {
      arrayByCats[outcome.cat].subcats[outcome.subcat] = {
        id: outcome.subcat,
        subcatName: outcome.subcatName,
        outcomes: [outcome]  
      };
    }
  });
  return arrayByCats;
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}
