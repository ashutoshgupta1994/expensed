var passport = require('passport');
var authenticate = require('../authenticate');
var express = require('express');
var authRouter = express.Router();
var Sequelize = require('sequelize');
var Model = Sequelize.Model;

var bt = require('../models/baseTables');

const { QueryTypes } = require('sequelize');
const Op = Sequelize.Op;

//setting Sequelize Connection
var sequelize = new Sequelize('split','local','local',{
  port: 5432,
  host: 'localhost',
  dialect: 'postgres'
});

//Serving at '/auth/signup'
authRouter.post('/signup', (req, res, next) => {
    // registering new user using credentials given in the body
    bt.user.register( new bt.user({username: req.body.username}), req.body.password, (err, user)=>{ 
        //serving callback inside user.register function
        if (err) {
            res.statusCode=500;
            res.setHeader('Content-Type','application/json');
            res.json({err: err});
        }
        else { // setting other user details and then saving
            if(req.body.firstname)
                user.firstname = req.body.firstname;
            if(req.body.lastname)
                user.lastname = req.body.lastname;
            user.save()
            .then((user)=>{
                console.log('\nUser Saved as ',user);

                passport.authenticate('local')(req,res,()=>{
                    console.log('\nInside passport.authenticate() Callback');
                    
                    res.statusCode=200;
                    res.setHeader('Content-Type','application/json');
                    res.json({success: true, status: 'Registration Successful'});
                });
              
            })
            .catch((err)=>next(err));
        };
    });
});

//Serving at '/auth/login'
authRouter.post('/login', passport.authenticate('local'), (req, res) => {
    var token = authenticate.getToken({_id: req.user.userId});
    res.statusCode=200;
    res.setHeader('Content-Type','application/json');
    res.json({success: true, token: token, status: 'Login Successful'});
    
});

//serving '/auth/logout'
authRouter.get('/logout',(req,res,next)=>{
    if(req.session){
      req.session.destroy();
      res.clearCookie('session-id');
      res.redirect('/');
    }
    else{
      var err = new Error('You are not logged in.');
      err.status = 403;
      next(err);
    }
});

module.exports = authRouter;