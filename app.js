
/**
 * Module dependencies.
 */

var express = require('express')
//  , routes = require('./routes')
//  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
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

//Routes

app.get('/', function(req, res){
  courseManager.findAll(function(error, courses){
    res.render('index', {
      title: 'Courses',
      courses: courses
    });
  });
});
