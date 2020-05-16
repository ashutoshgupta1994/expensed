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



async function fetchAll(){
    try {
        const allTran = await bt.tran.findAll({ }); //finding all transactions
        const allUser = await bt.user.findAll({ }); //finding all users
        const allGroup = await bt.group.findAll({ }); //finding all groups

        return {allTran, allUser, allGroup}
               
    } catch (error) {
        next(error);
    }
}

async function deleteAll(){
    try {
        await bt.test.drop();
        await bt.group.drop();
        await bt.user.drop();
        await bt.tran.drop();
        
        return true;                
    } catch (error) {
        next(error);
    }
    
    return {allTran, allUser};
}


module.exports = {fetchAll, deleteAll};
