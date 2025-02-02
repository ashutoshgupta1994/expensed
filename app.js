var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');

var indexRouter = require('./routes/indexRouter');
var userRouter = require('./routes/userRouter');

var app = express();

//setting Sequelize Connection
var sequelize = new Sequelize('split','local','local',{
  port: 5432,
  host: 'localhost',
  dialect: 'postgres'
});
sequelize.authenticate()
.then(()=>{
  console.log(`Connection succesfully established at host=${sequelize.options.host} and port=${sequelize.options.port}`);
})
.catch((err) => {
  console.error('Unable to connect to the database:', err);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//Routing endpoints

app.use('/', indexRouter);
app.use('/user', userRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
