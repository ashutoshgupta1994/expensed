var express = require('express');
var testRouter = express.Router();
var Sequelize = require('sequelize');
var Model = Sequelize.Model;

var bt = require('../models/baseTables');

var sequelize = new Sequelize('split','local','local',{
    port: 5432,
    host: 'localhost',
    dialect: 'postgres'
  });

//Serving at '/test'
testRouter.get('/:userId', (req, res, next) => {
/*
    bt.test.findAll({})
    .then((testObj)=>{
        res.statusCode=200;
        res.setHeader('Content-Type','application/json');
        res.json(testObj);
    
    })
*/
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
      var finalTran = new Array ((creditTran.length + debtTran.length));
      for(i=0; i<creditTran.length; i++){
        cdFlag[i] = 0;
        for(j=0; j<debtTran.length; j++){
          dbFlag[j] = 0;
          
          if(creditTran[i].debtor == debtTran[j].creditor){
            cdFlag[i] = 1;
            dbFlag[j] = 1;
            console.log({
                'finalBalance': creditTran[i].creditBalance - debtTran[j].debtBalance,
                'user': creditTran[i].debtor
            });
            
            finalTran.push({
              'finalBalance': creditTran[i].creditBalance - debtTran[j].debtBalance,
              'user': creditTran[i].debtor
          });
          }
        }
        if (cdFlag[i]==0){
            console.log({
                'finalBalance': creditTran[i].creditBalance,
                'user': creditTran[i].debtor
            });
            
            finalTran.push({
            'finalBalance': creditTran[i].creditBalance,
            'user': creditTran[i].debtor
          });
        }
      }
      for(j=0; j<debtTran.length; j++){
        if(dbFlag[j]==0){
            console.log({
                'finalBalance': debtTran[j].debtBalance,
                'user': debtTran[j].creditor
              });
            
          finalTran.push({
            'finalBalance': debtTran[j].debtBalance,
            'user': debtTran[j].creditor
          });
        }
      }
    })
    .catch((err)=>next(err));
  })
  .catch((err)=>next(err));


});

testRouter.post('/', (req, res, next) => {
    bt.test.create({
        username: req.body.username, 
        password: req.body.password, 
        firstname: req.body.firstname, 
        lastname: req.body.lastname,
    })
    .then((testObj)=>{
        console.log('New test object created = ',testObj);
        
        res.statusCode=200;
        res.setHeader('Content-Type','application/json');
        res.json(testObj);
    })
    .catch((err)=>next(err));
});

testRouter.put('/', (req, res, next) => {
    bt.test.findOne({
        where:{testId: req.params.testId}
    })
    .then((curtest)=>{
        console.log('New Group being created in Test = ',curtest);

        var curGroups = curtest.groups;
        if(curGroups) curGroups += (';' + req.body.groups);
        else curGroups = req.body.groups;
        bt.test.update(
            {groups: curGroups},
            {returning: true, where:{testId: req.params.testId}}
        )
        .then(([rowsUpdate, [updateTest]])=>{
            res.statusCode=200;
            res.setHeader('Content-Type','application/json');
            res.json(updateTest);
        })
        .catch((err)=>next(err));
    })
    .catch((err)=>next(err));
});


module.exports = testRouter;
