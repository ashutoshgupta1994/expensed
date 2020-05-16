// Routes Provided are:-
//1. Get @ /user = viewing all Transactions of the user and current Balances against other Users
//2. Post @ /user = Posting a Transaction with details provided in req.body
//3. Get @ /user/groups = Viewing all the Groups and the Transactions in each group
//4. Post @ /user/groups = Creating a new Group
//5. Get @ /user/groups/:groupId = Viewing details of the group, all Transactions of the group 
//                                 and all transactions done by the user in the group
//6. Post @ /user/groups/:groupId = Posting a new Transaction in provided group with details in req.body

var userServices = require('../services/userServices');
var authenticate = require('../authenticate');

var express = require('express');
var userRouter = express.Router();

//1. Get @ /user = viewing all Transactions of the user and current Balances against other Users
userRouter.get('/', authenticate.verifyUser, async (req, res, next) => {
  try {
    console.log('User Populated in Req is = ',req.user);
    
    const balanceTran = await userServices.getUserBalance(req, next);
    const allUserTran = await userServices.getAllUserTran(req, next);
  
    res.statusCode=200;
    res.setHeader('Content-Type','application/json');
    res.json({'All Transactions': allUserTran, 'Balance': balanceTran});    

  } catch (error) {
    next(error);
  }

});

//2. Post @ /user = Posting a Transaction with details provided in req.body
userRouter.post('/', authenticate.verifyUser, async (req, res, next) => {
  req.params.groupId = null;
  try {
    
    const newTran = await userServices.postTran(req, next);
    res.statusCode=200;
    res.setHeader('Content-Type','application/json');
    res.json(newTran);

  } catch (error) {
    next(error);    
  }
});


//3. Get @ /user/groups = Viewing all the Groups and the Transactions in each group
userRouter.get('/groups', authenticate.verifyUser, async (req, res, next) => {
  try {
    const userGroups = await userServices.getUserGroups(req, next);
    //'userGroups' returns

    var g = userGroups.length;
    var groups = new Array();
        
    for(var i=0; i<g; i++){
      groups[i]= userGroups[i].dataValues.groupId;
    }

    const allGroupTran = await userServices.getAllGroupTran(req, next, groups);
    //'allGroupTran' returns all the transactions in the groups provided in 'groups' array

    res.statusCode=200;
    res.setHeader('Content-Type','application/json');
    res.json({'All the Groups of User are ':userGroups, 'All the transactions in such Groups are': allGroupTran});

  } catch (error) {
    next(error);
  }
});

//4. Post @ /user/groups = Creating a new Group
userRouter.post('/groups', authenticate.verifyUser, async (req, res, next) => {
  try {

    const newGroup = await userServices.postGroup(req, next);
    //'newGroup' is an Array of the entries in the 'group' basetable
    res.statusCode=200;
    res.setHeader('Content-Type','application/json');
    res.json({'New Group Log': newGroup});

  } catch (error) {
    next(error);
  }
});


//5. Get @ /user/groups/:groupId = Viewing all Transactions of User in provided group
userRouter.get('/groups/:groupId', authenticate.verifyUser, async (req, res, next) => {
  try {
    
    const groupDetails = await userServices.getGroupDetails(req, next, [req.params.groupId]);
    const userGroupTran = await userServices.getUserGroupTran(req, next, [req.params.groupId]);
    const allGroupTran = await userServices.getAllGroupTran(req, next, [req.params.groupId]);
    //'userGroupTran' contains a <datatype> of all Transactions of User in the Group
    res.statusCode=200;
    res.setHeader('Content-Type','application/json');
    res.json({'groupDetails': groupDetails, 'userGroupTran': userGroupTran,'allGroupTran':allGroupTran});

  } catch (error) {
    next(error);    
  }
});


//6. Post @ /user/groups/:groupId = Posting a new Transaction in provided group with details in req.body
userRouter.post('/groups/:groupId', authenticate.verifyUser, async (req, res, next) => {
  try {
    
    const newTran = await userServices.postTran(req, next);
    res.statusCode=200;
    res.setHeader('Content-Type','application/json');
    res.json(newTran);

  } catch (error) {
    next(error);    
  }
});

module.exports = userRouter;