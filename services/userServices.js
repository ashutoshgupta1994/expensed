//Functions Details:-
//1. getAllUserTran = Find all the Transactions of current user
//2. getUserBalance = Find the balance pending of the user with others
//3. postTran = post a transactions with details in req.body
//4. postGroup = create new group
//5. getUserGroups = find all the groups where User is a member
//6. getAllGroupTran = find all the transactions in the groups provided in 'groups' array
//7. getUserGroupTran = find the transactions of the user in the groups provided in the 'groups' array
//8. getGroupDetails = get the details of the groups provided in the 'groups' array

var bt = require('../models/baseTables');

var Sequelize = require('sequelize');
var Model = Sequelize.Model;
const { QueryTypes } = require('sequelize');
const Op = Sequelize.Op;
//setting Sequelize Connection
var sequelize = new Sequelize('split','local','local',{
    port: 5432,
    host: 'localhost',
    dialect: 'postgres'
});

//1. getAllUserTran = Find all the Transactions of current user
//input = 'req' containing current user in req.user
//output = Array 'allUserTran' of all the transactions of the user. Each transaction is a js object.
async function getAllUserTran(req, next){
    try {
        //finding transactions involving user, whether as creditor or debtor
        const allUserTran = await bt.tran.findAll({
            where:{
                [Op.or]: [{creditor: req.user.userId}, {debtor: req.user.userId}]
            }
        });
        
        console.log('allUserTran (inside getAllUserTran function) = ', allUserTran);
        
        return allUserTran;

    } catch (error) {
        next(error);
    }
}

//2. getUserBalance = Find the balance pending of the user with others
//input = 'req' containing current user in req.user
//output = Array 'balanceTran' of js objects. Each js object has 2 values - user and balance.
async function getUserBalance(req, next){
    try {
        console.log('Inside getUserBalance function');

        // Finding all transactions and adding them where the user is creditor
        const creditTran = await bt.tran.findAll({
            attributes : [
              'debtor', 
              [sequelize.fn('SUM',sequelize.col('value')),'creditBalance']
            ],
            where: {
              creditor: req.user.userId 
            },
            group: ['debtor']
        });

        // Finding all transactions and adding them where the user is debtor
        const debtTran = await bt.tran.findAll({
            attributes : [
                'creditor', 
                [sequelize.fn('SUM',sequelize.col('value')),'debtBalance']
            ],
            where: {
                debtor: req.user.userId
            },
            group: ['creditor']
        });

        var cdFlag = new Array(creditTran.length);
        var dbFlag = new Array(debtTran.length);
        var balanceTran = new Array ();
        for(i=0; i<creditTran.length; i++){
            for(j=0; j<debtTran.length; j++){
                if(creditTran[i].dataValues.debtor == debtTran[j].dataValues.creditor){
                    cdFlag[i] = 1;  // Flagging wherever the creditor and debtor match
                    dbFlag[j] = 1;
                    console.log('\ncreditTran[',i,'].dataValues.debtor = ',creditTran[i].dataValues.debtor,' and creditTran[',i,'].dataValues.creditBalance = ',creditTran[i].dataValues.creditBalance);
                    console.log('\ndebtTran[',j,'].dataValues.creditor = ', debtTran[j].dataValues.creditor,' and debtTran[',j,'].dataValues.debtBalance = ', debtTran[j].dataValues.debtBalance);
                    
                    balanceTran.push({  //Transferring the balance of matched debtor and creditor to the finalTran
                      'finalBalance': creditTran[i].dataValues.creditBalance - debtTran[j].dataValues.debtBalance,
                      'user': creditTran[i].dataValues.debtor
                  });
                }
            }
            if (cdFlag[i] !== 1){
                balanceTran.push({ //Transferring wherever the creditor remains untransferred to the finalTran
                    'finalBalance': creditTran[i].dataValues.creditBalance,
                    'user': creditTran[i].dataValues.debtor
                });
            }
        }
        for(j=0; j<debtTran.length; j++){
            if(dbFlag[j] !== 1){
                balanceTran.push({  //Transferring wherever the debtor remains untransferred to the finalTran
                    'finalBalance': debtTran[j].dataValues.debtBalance,
                    'user': debtTran[j].dataValues.creditor
                });
            }
        }
    
        return balanceTran;

    } catch (error) {
        next(error);        
    }    
}

//3. postTran = post a transactions with details in req.body
//input = 'req' containing current user in req.user and transaction details in req.body
//output = A js object containing the values of the newly created transaction in 'tran' basetable
async function postTran(req, next){
    try {
        
        const newTran = await bt.tran.create({  // Creating new transaction via details provided in req.body
            actor: req.user.userId,
            creditor: req.body.creditor,
            debtor: req.body.debtor,
            value: req.body.value,
            groupId: req.params.groupId,
            tranDescription: req.body.tranDescription
        });

        return newTran;

    } catch (error) {
        next(error);
    }
}

//4. postGroup = create new group
//input = 'req' containing current user in req.user and group details in req.body
//output = Array 'newGroup' of js objects. Each js object is a row of the 'group' basetable related to created group
async function postGroup(req, next){
    try {
        // Creating new Group by details provided in req.body
        var newGroup = new Array();
        newGroup[0] = await bt.group.create({
            groupName: req.body.groupName, 
            userId: req.user.userId,
            groupAdmin: true,
            groupDescription: req.body.groupDescription
        });

        const m = req.body.members.length;
        for(var i=0; i<m; i++){
            newGroup[i+1] = await bt.group.create({
                groupId: newGroup[0].groupId,
                groupName: newGroup[0].groupName, 
                userId: req.body.members[i],
                groupDescription: newGroup[0].groupDescription
            });
        }

        return newGroup;

    } catch (error) {
        next(error);
    }
}

//5. getUserGroups = find all the groups where User is a member
//input = 'req' containing current user in req.user
//ouput = Array of js objects. Each object is a row from 'group' basetable where user ia member of the group
async function getUserGroups(req, next){
    try {
        const userGroups = await bt.group.findAll({
            where:{
                userId: req.user.userId
            }
        });

        console.log('Returning userGroups from getUserGroups function');
        
        return userGroups;

    } catch (error) {
        next(error);
    }
}

//6. getAllGroupTran = find all the transactions in the groups provided in 'groups' array
//input = 'req' containing current user in req.user and 'groups' array
//output = Array of js objects. Each object is a row from 'tran' basetable 
//         where groupId matches elements of 'groups' array
async function getAllGroupTran(req, next, groups){
    
    try {
        const allGroupTran = await bt.tran.findAll({
            where:{
                groupId: groups
            }
        });
        
        console.log('Returning allGroupTran from getAllGroupTran function');

        return allGroupTran;

    } catch (error) {
        next(error);
    }
}

//7. getUserGroupTran = find the transactions of the user in the groups provided in the 'groups' array
//input = 'req' containing current user in req.user and 'groups' array
//output = Array of js objects. Each object is a row from 'tran' basetable where userId matches user in req.user 
//         and groupId matches elements of 'groups' array
async function getUserGroupTran(req, next, groups){
    
    try {
        const userGroupTran = await bt.tran.findAll({
            where:{
                [Op.or]: [{creditor: req.user.userId},{debtor: req.user.userId}],
                groupId: groups
            }
        });

        return userGroupTran;

    } catch (error) {
        return error;
    }
}

//8. getGroupDetails = get the details of the group in 'groups' array
//input = 'groups' array containing groupId of all the groups whose details are required
//output = Array of js objects. Each object is a row for that specific group from 'group' basetable 
async function getGroupDetails(req, next, groups){
    try {
        const groupDetails = await bt.group.findAll({
                where:{
                    groupId: groups
                }
            });

        return groupDetails;

    } catch (error) {
        next(error);
    }
}


module.exports = {getUserBalance, getAllUserTran, postTran, postGroup, getUserGroups, getAllGroupTran, getUserGroupTran, getGroupDetails};
