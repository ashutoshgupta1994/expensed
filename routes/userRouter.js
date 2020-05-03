var express = require('express');
var userRouter = express.Router();
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

//Serving at '/user'
userRouter.get('/', (req, res, next) => {

});


//Serving at '/user/signup'

userRouter.post('/signup', (req, res, next) => {
  bt.user.sync()
  .then(()=>{
    bt.user.create({
      username: req.body.username, 
      password: req.body.password, 
      firstname: req.body.firstname, 
      lastname: req.body.lastname
    })
    .then((newuser)=>{
      console.log('New User created with credentials = ', newuser);

      res.statusCode=200;
      res.setHeader('Content-Type','application/json');
      res.json(newuser);
    })
    .catch((err)=>next(err));
  })
  .catch((err)=>next(err));
});


//Serving specific user at '/user/:userId' for different kinds of requests. getType = [balance]

userRouter.get('/:userId', (req, res, next) => {
  bt.user.findOne({userId: req.params.userId})
  .then((curUser)=>{
    console.log('Get ( Type: ', req.body.getType,' ) request from User = ',curUser);

    switch (req.body.getType) {
      //Sending Balance with each distinct person
      case 'balance':

  
        break;
    
      //Sending whole Tran and Group table
      default :
      bt.tran.findAll({  //finding transactions involving user, whether as creditor or debtor
        where:{
          [Op.or]: [{creditor: req.params.userId}, {debtor: req.params.userId}]
        }
      })
      .then((allTran)=>{
        console.log('All Transactions for User = ', curUser.firstname, ' ', curUser.lastname, ' are :- \n',);
        
      })
      .catch((err)=>next(err));
      
        break;
    }
  })
  .catch((err)=>next(err));
});

userRouter.post('/:userId', (req, res, next) => {
  bt.tran.create({
    actor: req.params.userId,
    creditor: req.body.creditor,
    debtor: req.body.debtor,
    value: req.body.value})
  .then((newTran)=>{
    console.log('New Tran logged is = ', newTran);

    res.statusCode=200;
    res.setHeader('Content-Type','application/json');
    res.json(newTran);
  })
  .catch((err)=>next(err));
});


//Serving specific user at '/user/:userId/groups'

userRouter.get('/:userId/groups', (req, res, next) => {
  
});

userRouter.post('/:userId/groups', (req, res, next) => {
  bt.group.sync()
  .then(()=>{
    bt.group.create({
      groupName: req.body.groupName, 
      members: req.body.members,
      admin: req.params.userId
    })
    .then((newGroup)=>{
      console.log('New Group created in the Groups Info Table with details = ', newGroup);
      
      bt.user.findOne({
        where:{userId: req.params.userId}
      })
      .then((curUser)=>{
        console.log('New Group being created by User = ',curUser);

        var curGroups = curUser.groups;
        curGroups += (';' + newGroup.groupId);
        bt.user.update(
          {groups: curGroups},
          {where:{userId: req.params.userId}}
        )
        .then((updateUser)=>{
          res.statusCode=200;
          res.setHeader('Content-Type','application/json');
          res.json({New_Group: newGroup, Updated_User: updateUser});
        })
        .catch((err)=>next(err));
      })
      .catch((err)=>next(err));
    })
    .catch((err)=>next(err));
  })
  .catch((err)=>next(err));
});


//Serving specific user at '/user/:userId/groups/:groupId'

userRouter.post('/:userId/groups/:groupId', (req, res, next) => {
  bt.tran.create({
    actor: req.params.userId,
    creditor: req.body.creditor,
    debtor: req.body.debtor,
    value: req.body.value,
    groupId: req.params.groupId
  })
  .then((newTran)=>{
    console.log('New Tran logged is = ', newTran);

    res.statusCode=200;
    res.setHeader('Content-Type','application/json');
    res.json(newTran);
  })
  .catch((err)=>next(err));  
});

module.exports = userRouter;