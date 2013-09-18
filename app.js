/*-- TO DO: Restructure and divide this file -- */

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
  , ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn
  , flash = require('connect-flash')
  , CatManager = require('./models/catManager').CatManager
  , UniManager = require('./models/uniManager').UniManager
  , OutcomeManager = require('./models/outcomeManager').OutcomeManager
  , CourseManager = require('./models/courseManager').CourseManager;

//config file
var config = require('./config.json');

// mongoose connection and models
mongoose.connect('mongodb://' + config.database.url + ':' + config.database.port + '/' + config.database.name);
var User = require('./models/userModel').User;

// passport serialize and deserialize
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// register auth strategy
passport.use(new LocalStrategy({
    usernameField: 'email'
  }, function(email, password, done) {
  User.findOne({email: email}, function(err, user) {
    if (err) return done(err);
    if (!user) return done(null, false, {messageType: '', message: 'Unknown user.'});
    user.comparePassword(password, function(err, isMatch) {
      if (err) return done(err);
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, {messageType: '', message: 'Invalid password.'});
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
app.use(flash());
// pass session user to views
app.use(function(req, res, next) {
//  res.locals.menuList = [ 
//    {title:'Home', link:'/'},
//    {title:'Objectives', link:'/wishlist'}, 
//    {title:'Courses', link:'/search'}, 
//    {title:'Source', link:'http://github.com/gootyfer/moocrank'}, 
//    {title:'About', link:'/about'}
//  ];
  res.locals.user = req.session.passport.user;
  next();
});
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

//Route: Home page
app.get('/', function(req, res){
  if(req.session.passport.user){
    res.redirect('/search');
  }else{
    res.render('index', {
          title: 'moocrank - Personalized MOOC recommendations',
          active: 0
        });
  }
});

//Route: Search page
app.get('/search', ensureLoggedIn('/login'), function(req, res){
  //console.log(req.session.passport.user);
  //Categories of computer science from coursera, edx and udacity
  var searchObj = {cats:{$in:[1,11,12,17,10000,20000]}};
  if(req.query.query){
    searchObj.name = {$regex:req.query.query, $options: 'i'};
  }
  User.findById(req.session.passport.user, function(error, user){
    searchObj.id = {$nin:user.completedCourses};
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
          rankCourses(courses, user);
          res.render('search', {
            active: 2,
            title: 'Courses recommendation',
            courses: courses
          });
        });
      });
    });
  });
});

//Route: Course detail page
app.get('/evaluate/:id', ensureLoggedIn('/login'), function(req, res){
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

//Route: Add outcome and course to user
app.get('/addCourseAndOutcomesToUser/:courseId', ensureLoggedIn('/login'), function(req, res){
  var outcomes = [];
  for(outcome in req.query){
    outcomes.push(parseInt(outcome));
  }
  //console.log(outcomes);
  //console.log(req.query);
  var courseId = parseInt(req.params.courseId);
  courseManager.findById(courseId, function(error, course){
    if(error) res.send(404);
    User.findById(req.session.passport.user, function(error, user){
      if(error) res.send(404);
      else{

        user.completedCourses = mergeArrays(user.completedCourses, courseId);

        if(outcomes.length>0){
          //Update course
          course.userEvaluations = course.userEvaluations? course.userEvaluations : [];
          course.userEvaluations.push(outcomes);
          //Recalculate outcomes
          recalculateCourseOutcomes(course);
          //Save course info, not wait for response
          courseManager.save(course, function(){});
          //Update user
          user.achievements = mergeArrays(user.achievements, outcomes);
          user.courseScores.push({courseId:courseId, courseOutcomes: outcomes});
        }
        user.save(function(error){
          //console.log("save error: "+error);
          if(error) res.send(404);
          else res.redirect('/search');
        });
      }
    });
  });
});

//Route: User login page
app.get('/login', function(req, res, next) {
  var errorMsg = req.flash()['error'];
  errorMsg = errorMsg?errorMsg[0]:undefined;
  //console.log(errorMsg)
  res.render('login', {
    activate: 4,
    title: 'Register / Login',
    messageType: 'alert-error',
    message: errorMsg
  });
});

//Route: User login
app.post('/login', passport.authenticate('local', 
  { successReturnToOrRedirect: '/', failureRedirect: '/login', failureFlash: true }));

//Route: Logout
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

//Route: Registration new user
app.post('/register', function(req, res) {
  var user = new User(req.body.user);
  var message = '';
  user.save(function(err) {
    if (err) {
      //console.log(err);
      req.session.messageType = 'alert-error';
      req.session.message = 'There was an error in the registration process. Please try again later.';
      res.redirect('/login');
    } else {
      //console.log(user);
      //Log the user in and redirect to wishlist
      req.login(user, function(err) {
        if (err) { return next(err); }
        return res.redirect('/wishlist');
      });
    }
  });
});


//Route: Outcomes wishlist page
app.get('/wishlist', ensureLoggedIn('/login'), function(req, res) {
   outcomeManager.findAll(function(error, outcomes) {
     var outcomesTree = treeStructure(outcomes);
     util.isError(e);.findById(req.session.passport.user, function(err, user) {
       res.render('wishlist', {
         active: 1,
         title: 'Select outcomes',
         cats: outcomesTree,
         wishlist: user.wishlist
       });  
     });
   }); 
});

//Route: add wished outcome to user
app.get('/wishOutcome/:outcomeId', ensureLoggedIn('/login'), function(req, res) {
  User.findById(req.session.passport.user, function(err, user) {
    if (err) {
      res.send(404);
      return;
    }
    if (!user.wishlist) {
      user.wishlist = [];
    }
    user.wishlist.push(parseInt(req.params.outcomeId));
    user.save(function(err) {
      if (err) {
        res.send(500);
      } else {
        res.send(200);
      }
    });
  });
});

//Route: remove wished outcome from user
app.get('/unwishOutcome/:outcomeId', ensureLoggedIn('/login'), function(req, res){
  User.findById(req.session.passport.user, function(err, user) {
    if (err || !user.wishlist) {
      res.send(404);
      return;
    }
    var outcomeId = parseInt(req.params.outcomeId); 
    user.wishlist = user.wishlist.filter(function(x) {
      return(x != outcomeId);
    });
    user.save(function(err) {
      if (err) res.send(500)
      else res.send(200);
    });
  });
});

//Route: about page
app.get('/about', function(req, res){
  res.render('about', {
    title: 'About',
    active: 3
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

function rankCourses(courses, user){
  //console.log("NOT SORTED:");
  //console.log(courses);
  var diff = user.wishlist.filter(function(x){
    return user.achievements.indexOf(x) == -1;
  });
  courses.sort(function(x,y){
    var xRank = []
      , yRank = [];
    if(x.outcomes){
      xRank = x.outcomes.filter(function(o){
        return diff.indexOf(o) != -1;
      });
    }
    if(y.outcomes){
      yRank = y.outcomes.filter(function(o){
        return diff.indexOf(o) != -1;
      });
    }
    //console.log(x.name+":"+xRank.length+" AND "+y.name+":"+yRank.length);
    return yRank.length - xRank.length;
  });
  //console.log("SORTED:");
  //console.log(courses);
}

function mergeArrays(a,b){
  var c = a.concat(b);
  return c.filter(function(elem, pos, self) {
      return self.indexOf(elem) == pos;
  })
}

function recalculateCourseOutcomes(course){
  var outcomesRank = {};
  course.userEvaluations.forEach(function(userEvaluation){
    userEvaluation.forEach(function(outcome){
      if(outcome in outcomesRank){
        outcomesRank[outcome] += 1;
      }else{
        outcomesRank[outcome] = 1;
      }
    });
  });
  course.outcomes = [];
  for(outcome in outcomesRank){
    if(outcomesRank[outcome] >= (course.userEvaluations.length/2)){
      course.outcomes.push(parseInt(outcome));
    }
  }
}