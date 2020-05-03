var express = require('express');
var testRouter = express.Router();
var Sequelize = require('sequelize');
var Model = Sequelize.Model;

var bt = require('../models/baseTables');

//Serving at '/test'
testRouter.get('/', (req, res, next) => {
    res.statusCode=200;
    //res.json({json: "json", object: "object"});
    res.write(JSON.stringify({json: "json", object: "object"}));
    res.end('Bye Bye');
});

module.exports = testRouter;
