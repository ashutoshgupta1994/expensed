var express = require('express');
var userRouter = express.Router();
var Sequelize = require('sequelize');
var Model = Sequelize.Model;
const { QueryTypes } = require('sequelize');


//setting Sequelize Connection
var sequelize = new Sequelize('split','local','local',{
  port: 5432,
  host: 'localhost',
  dialect: 'postgres'
});

class user extends Model{}
user.init({
  userId:{
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username:{
    type: Sequelize.STRING,
    unique: true
  },
  password:{
    type: Sequelize.STRING
  }
},{
  sequelize,
  modelName: 'user'
});

class group extends Model{}
group.init({
  groupId:{
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  groupName:{
    type: Sequelize.STRING,
  },
  members:{
    type: Sequelize.STRING
  }
},{
  sequelize,
  modelName: 'group'
});

class userTran extends Model{}
userTran.init({
  tranId:{
    type: Sequelize.INTEGER,
    primaryKey:true,
    autoIncrement:true
  },
  person:{
    type: Sequelize.STRING
  },
  value:{
    type: Sequelize.INTEGER
  },
  groupId:{
    type: Sequelize.INTEGER,
    default: null 
  }
},{
  sequelize,
  modelName: 'UserTran'
});

class userGroup extends Model{}
userGroup.init({
  groupId:{
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  groupName:{
    type: Sequelize.STRING
  },
  members:{
    type: Sequelize.STRING
  }
},{
  sequelize,
  modelName: 'userGroup'
});

class groupTran extends Model{}
groupTran.init({
  tranId:{
    type: Sequelize.INTEGER,
    primaryKey:true,
    autoIncrement:true
  },
  person:{
    type: Sequelize.STRING
  },
  value:{
    type: Sequelize.INTEGER
  },
  groupId:{
    type: Sequelize.INTEGER,
    default: null 
  }
},{
  sequelize,
  modelName: 'UserTran'
});



//Serving at '/user'
userRouter.get('/', (req, res, next) => {
  
});

//Serving at '/user/signup'
userRouter.post('/signup', (req, res, next) => {
  user.sync()
  .then(()=>{
    user.create({username: req.body.username, password: req.body.password})
    .then((newuser)=>{
      console.log(`New User created with credentials = `, newuser);

      res.statusCode=200;
      res.setHeader('Content-Type','application/json');
      res.json(newuser);

      var userTranTable = newuser.userId + '_Tran';
      userTran.tableName = userTranTable;
      var userGroupTable = newuser.userId + '_Group';
      userGroup.tableName = userGroupTable;

      userGroup.sync()
      .then(()=>{
        console.log(`New User Group Table ( ${userGroup.tableName} ) populated for User = `, newuser);
        userTran.sync()
        .then(()=>{
          console.log(`New User Tran Table ( ${userTran.tableName} ) populated for User = `, newuser);          
        })
        .catch((err)=>next(err));
      })
      .catch((err)=>next(err));
    })
    .catch((err)=>next(err));
  })
  .catch((err)=>next(err));
});


//Serving specific user at '/user/:userId' for different kinds of requests. getType = [balance]

userRouter.get('/:userId', (req, res, next) => {
  var userTranTable = req.params.userId + '_Tran';
  userTran.tableName = userTranTable;
  var userGroupTable = req.params.userId + '_Group';
  userGroup.tableName = userGroupTable;
  
  switch (req.body.getType) {
    //Sending Balance with each distinct person
    case 'balance':
    console.log(`userTran.tableName is = ${userTran.tableName}`);
    
    userTran.findAll({
      attributes:[
        'person',
        [sequelize.fn('sum', sequelize.col('value')),'balance']
      ],
      group: ['person']
    })
    .then((balanceArray)=>{
      console.log('The Balance Array fro User Id = ', req.params.userId, ' is = ', balanceArray);
      res.statusCode=200;
      res.setHeader('content-Type','application/json');
      res.json(balanceArray);
    })
    .catch((err)=>{
      console.log({err: err});
      next(err);
    });

      break;
  
    //Sending whole Tran and Group table
    default :
    userTran.findAll({})
    .then((allTran)=>{
      userGroup.findAll({})
      .then((allGroup)=>{
        res.statusCode=200;
        res.setHeader('Content-type','application/json');
        res.json({Transactions: allTran, Groups: allGroup});
      })    
      .catch((err)=>next(err));
    })
    .catch((err)=>next(err));
    
      break;
  }
});

userRouter.post('/:userId', (req, res, next) => {
  var userTranTable = req.params.userId + '_Tran';
  userTran.tableName = userTranTable;
  userTran.create({person: req.body.person, value: req.body.value})
  .then((newTran)=>{
    console.log(`New Tran logged for UserId = ${req.params.userId} and Tran details are = `, newTran);

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
  group.sync()
  .then(()=>{
    group.create({groupName: req.body.groupName, members:req.body.members})
    .then((newGroup)=>{
      console.log(`New Group created in the Universal Group Table with details = `, newGroup);
      
      var userGroupTable = req.params.userId + '_Group';
      userGroup.tableName = userGroupTable;
      userGroup.create({groupId: newGroup.groupId, groupName: newGroup.groupName, members: newGroup.members})
      .then((newUserGroup)=>{
        console.log(`New Group created in the User Group Table = ${userGroup.tableName} with details = `, newUserGroup);
        
        res.statusCode=200;
        res.setHeader('Content-Type','application/json');
        res.json(newUserGroup);
      })
      .catch((err)=>next(err));
    })
    .catch((err)=>next(err));
  })
  .catch((err)=>next(err));
});


//Serving specific user at '/user/:userId/groups/:groupId'

userRouter.post('/:userId/groups/:groupId', (req, res, next) => {
  var userTranTable = req.params.userId + '_Tran';
  userTran.tableName = userTranTable;
  userTran.create({person: req.body.person, value: req.body.value, groupId: req.params.groupId})
  .then((newTran)=>{
    console.log(`New Tran logged for UserId = ${req.params.userId} and Tran details are = `, newTran);

    res.statusCode=200;
    res.setHeader('Content-Type','application/json');
    res.json(newTran);
  })
  .catch((err)=>next(err));  
});

module.exports = userRouter;