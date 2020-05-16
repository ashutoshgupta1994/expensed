var adminServices = require('../services/adminServices');
var authenticate = require('../authenticate');

var express = require('express');
var adminRouter = express.Router();

var Sequelize = require('sequelize');
var Model = Sequelize.Model;


//Serving at '/admin'
adminRouter.get('/', authenticate.verifyUser, async (req, res, next) => {
    try {
        const {allTran, allUser, allGroup} = await adminServices.fetchAll();
        res.statusCode=200;
        res.setHeader('Content-Type','application/json');
        res.json({'All Transactions': allTran, 'All Users': allUser, 'All Groups': allGroup});   

    } catch (error) {
        next(error);
    }
});

adminRouter.delete('/all', authenticate.verifyUser, async (req, res, next) => {
    try {
        if(adminServices.deleteAll()){
            res.statusCode=200;
            res.send('All Tables successfully deleted');
        }

    } catch (error) {
        next(error);
    }
});

module.exports = adminRouter;