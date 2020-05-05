var passport = require('passport');
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
  bt.tran.findAll({ }) //finding all transactions
  .then((allTran)=>{
    console.log('All Transactions are :- \n', allTran);
    
    bt.user.findAll({ }) //finding all users
    .then((allUser)=>{
      console.log('All users are :- \n', allUser);

      res.statusCode=200;
      res.setHeader('Content-Type','application/json');
      res.json({'All Transactions': allTran, 'All Users': allUser});
    })
    .catch((err)=>next(err));  
  })
  .catch((err)=>next(err));
});


//Serving specific user at '/user/:userId' for different kinds of requests. getType = [balance]

userRouter.get('/:userId', (req, res, next) => {
  bt.user.findOne({  // Finding the req.params.userId in the database
    userId: req.params.userId
  })
  .then((curUser)=>{
    console.log('Get ( Type: ', req.body.getType,' ) request from User = ',curUser);

    switch (req.body.getType) {
      //Sending Balance with each distinct person
      case 'balance':
        bt.tran.findAll({ // Finding all transactions and adding them where the user is creditor
          attributes : [
            'debtor', 
            [sequelize.fn('SUM',sequelize.col('value')),'creditBalance']
          ],
          where: {
            creditor: req.params.userId 
          },
          group: ['debtor']
        })
        .then((creditTran)=>{
          bt.tran.findAll({  // Finding all transactions and adding them where the user is debtor
            attributes : [
              'creditor', 
              [sequelize.fn('SUM',sequelize.col('value')),'debtBalance']
            ],
            where: {
              debtor: req.params.userId 
            },
            group: ['creditor']
          })
          .then((debtTran)=>{
            
            var cdFlag = new Array(creditTran.length);
            var dbFlag = new Array(debtTran.length);
            var finalTran = new Array ();
            for(i=0; i<creditTran.length; i++){

              for(j=0; j<debtTran.length; j++){

                if(creditTran[i].dataValues.debtor == debtTran[j].dataValues.creditor){
                  cdFlag[i] = 1;  // Flagging wherever the creditor and debtor match
                  dbFlag[j] = 1;
                  console.log('\ncreditTran[',i,'].dataValues.debtor = ',creditTran[i].dataValues.debtor,' and creditTran[',i,'].dataValues.creditBalance = ',creditTran[i].dataValues.creditBalance);
                  console.log('\ndebtTran[',j,'].dataValues.creditor = ', debtTran[j].dataValues.creditor,' and debtTran[',j,'].dataValues.debtBalance = ', debtTran[j].dataValues.debtBalance);
                  
                  finalTran.push({  //Transferring the balance of matched debtor and creditor to the finalTran
                    'finalBalance': creditTran[i].dataValues.creditBalance - debtTran[j].dataValues.debtBalance,
                    'user': creditTran[i].dataValues.debtor
                });
                }
              }
              if (cdFlag[i] !== 1){
                finalTran.push({ //Transferring wherever the creditor remains untransferred to the finalTran
                  'finalBalance': creditTran[i].dataValues.creditBalance,
                  'user': creditTran[i].dataValues.debtor
                });
              }
            }
            for(j=0; j<debtTran.length; j++){
              if(dbFlag[j] !== 1){
                finalTran.push({  //Transferring wherever the debtor remains untransferred to the finalTran
                  'finalBalance': debtTran[j].dataValues.debtBalance,
                  'user': debtTran[j].dataValues.creditor
                });
              }
            }

            res.statusCode=200;
            res.setHeader('Content-Type','application/json');
            res.json({'Credit Balance': creditTran, 'Debt Balance': debtTran, 'Final Balance': finalTran});
            
          })
          .catch((err)=>next(err));
        })
        .catch((err)=>next(err));

  
        break;
    
      //Sending whole Tran and Group table
      default :
      bt.tran.findAll({  //finding transactions involving user, whether as creditor or debtor
        where:{
          [Op.or]: [{creditor: req.params.userId}, {debtor: req.params.userId}]
        }
      })
      .then((allTran)=>{
        console.log('All Transactions for User = ', curUser.firstname, ' ', curUser.lastname, ' are :- \n', allTran);
        
        res.statusCode=200;
        res.setHeader('Content-Type','application/json');
        res.json(allTran);
      })
      .catch((err)=>next(err));
      
        break;
    }
  })
  .catch((err)=>next(err));
});

userRouter.post('/:userId', (req, res, next) => {
  bt.tran.create({  // Creating new transaction via details provided in req.body
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
  bt.group.create({  // Creating new Group by details provided in req.body
    groupName: req.body.groupName, 
    members: req.body.members,
    admin: req.params.userId
  })
  .then((newGroup)=>{
    console.log('New Group created in the Groups Info Table with details = ', newGroup);
    
    bt.user.findOne({  // Finding the User who generated the request to create new group
      where:{userId: req.params.userId}
    })
    .then((curUser)=>{
      console.log('New Group being created by User = ',curUser);

      var curGroups = curUser.groups;
      if(curGroups) curGroups += (';' + req.body.groups);
      else curGroups = req.body.groups;
      bt.user.update(  // Updating the groups column in the Users Info Table
        {groups: curGroups},
        {returning: true, where:{userId: req.params.userId}}
      )
      .then(([rowsUpdate, [updateUser]])=>{
        res.statusCode=200;
        res.setHeader('Content-Type','application/json');
        res.json({New_Group: newGroup, Updated_User: updateUser});
      })
      .catch((err)=>next(err));
    })
    .catch((err)=>next(err));
  })
  .catch((err)=>next(err));
});


//Serving specific user at '/user/:userId/groups/:groupId'

userRouter.post('/:userId/groups/:groupId', (req, res, next) => {
  bt.tran.create({  // Creating new transaction via details provided in req.body
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