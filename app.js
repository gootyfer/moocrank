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
  res.locals.menuList = [ 
    {title:'Home', link:'/'},
    {title:'Objectives', link:'/wishlist'}, 
    {title:'Courses', link:'/search'}, 
    {title:'Source', link:'http://github.com/gootyfer/moocrank'}, 
    {title:'About', link:'/about'}
  ];
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

app.get('/', function(req, res){
  courseManager.findAll(function(error, courses){
    res.render('index', {
          title: 'moocrank',
          active: 0
        });
  });
});

app.get('/search', ensureLoggedIn('/login'), function(req, res){
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

app.get('/toggleOutcomeOfCourse/:courseId/:outcomeId', ensureLoggedIn('/login'), function(req, res){
  courseManager.findById(parseInt(req.params.courseId), function(error, course){
    if(error) res.send(404);
    else{
      if(req.query.checked=="true"){
        course.outcomes = course.outcomes? course.outcomes : [];
        course.outcomes.push(parseInt(req.params.outcomeId));
        courseManager.save(course, function(error, courses){
          if(error) res.send(404);
          else res.send(200);
        });
      }else{
        if(!course.outcomes) res.send(404);
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
    }
  });
});

app.get('/addCourseAndOutcomesToUser/:courseId', ensureLoggedIn('/login'), function(req, res){
  courseManager.findById(parseInt(req.params.courseId), function(error, course){
    if(error) res.send(404);
    User.findById(req.session.passport.user, function(error, user){
      if(error) res.send(404);
      else{
        user.completedCourses.push(req.params.courseId);
        course.outcomes = course.outcomes? course.outcomes : [];
        course.outcomes.forEach(function(outcome){
          if(user.achievements.indexOf(outcome==-1)){
            user.achievements.push(outcome);
          }
        });
        user.save(function(error){
          //console.log("save error: "+error);
          if(error) res.send(404);
          else res.redirect('/search');
        });
      }
    });
  });
});

// User login

app.get('/login', function(req, res, next) {
  var errorMsg = req.flash()['error'];
  errorMsg = errorMsg?errorMsg[0]:undefined;
  //console.log(errorMsg)
  res.render('login', {
    activate: 5,
    title: 'Register / Login',
    messageType: 'error',
    message: errorMsg
  });
});

app.post('/login', passport.authenticate('local', 
  { successReturnToOrRedirect: '/', failureRedirect: '/login', failureFlash: true }));

// Logout

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

// User registration
app.post('/register', function(req, res) {
  var user = new User(req.body.user);
  var message = '';
  user.save(function(err) {
    if (err) {
      req.session.messageType = 'alert-error';
      req.session.messages = ['There was an error in the registration process. Please try again later.'];
    } else {
      req.session.messageType = 'alert-info';
      req.session.messages = ['You have been successfully registered. Please login.'];
    }
    res.redirect('/login');
  });
});


// Outcomes wishlist

app.get('/wishlist', ensureLoggedIn('/login'), function(req, res) {
   outcomeManager.findAll(function(error, outcomes) {
     var outcomesTree = treeStructure(outcomes);
     User.findById(req.session.passport.user, function(err, user) {
       res.render('wishlist', {
         active: 1,
         title: 'Select outcomes',
         cats: outcomesTree,
         wishlist: user.wishlist
       });  
     });
   }); 
});

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


app.get('/about', function(req, res){
  res.render('about', {
    title: 'About',
    active: 4
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
