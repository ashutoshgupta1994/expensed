var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken');
var Sequelize = require('sequelize');
var Model = Sequelize.Model;

var bt = require('./models/baseTables');
var config = require('./config');

//setting Sequelize Connection
var sequelize = new Sequelize('split','local','local',{
    port: 5432,
    host: 'localhost',
    dialect: 'postgres'
});

//'local strategy'
exports.local = passport.use(bt.user.createStrategy());
passport.serializeUser(bt.user.serializeUser());
passport.deserializeUser(bt.user.deserializeUser());

//creating and exporting 'json-web-token'
exports.getToken = function(user) {
    return jwt.sign(user, config.secretKey, {expiresIn: 36000});
};

//creating 'options' for jsonwebtoken strategy
var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

//'jsonwebtoken strategy'
exports.jwtPassport = passport.use(new JwtStrategy( opts, (jwt_payload, done)=>{
    console.log('JWT payload :- ', jwt_payload);
    bt.user.findOne({userId: jwt_payload._id}, (err,user)=>{
        if(err){
            return done(err, false);
        }
        else if(user){
            return done(null, user);
        }
        else{
            return done(null, false);
        }
    });
    
}));

exports.verifyUser = passport.authenticate('jwt', {session:false});
exports.verifyAdmin = function (req) {
    if (req.user.admin){
        return next();
    }
    else{
        err = new Error('Not an Authorised Administrator');
        err.status=403;
        next(err);
    }
};