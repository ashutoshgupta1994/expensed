var express = require('express');
var Sequelize = require('sequelize');
var Model = Sequelize.Model;
//const { QueryTypes } = require('sequelize');

var passportLocalSequelize = require('passport-local-sequelize');

//setting Sequelize Connection
var sequelize = new Sequelize('split','local','local',{
  port: 5432,
  host: 'localhost',
  dialect: 'postgres'
});

//New Model for Users Info Table
class user extends Model{}
user.init({
  userId:{
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstname:{
    type: Sequelize.STRING
  },
  lastname:{
    type: Sequelize.STRING
  },
  username:{
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  userHash:{
    type: Sequelize.TEXT,
    allowNull: false
  },
  userSalt:{
    type: Sequelize.STRING,
    allowNull: false
  },
  groups:{
    type: Sequelize.STRING,
    default: null
  }
},{
  sequelize,
  modelName: 'user'
});

passportLocalSequelize.attachToUser(user, {
	usernameField: 'username',
	hashField: 'userHash',
	saltField: 'userSalt'
});

//Model for Groups Info table
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
    type: Sequelize.STRING,
  },
  admin:{
      type: Sequelize.STRING
  }
},{
  sequelize,
  modelName: 'group'
});

// Model fro Transaction Table
class tran extends Model{}
tran.init({
  tranId:{
    type: Sequelize.INTEGER,
    primaryKey:true,
    autoIncrement:true
  },
  actor:{
    type: Sequelize.STRING
  },
  creditor:{
    type: Sequelize.STRING
  },
  debtor:{
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
  modelName: 'tran'
});

//New Model for Users Info Table
class test extends Model{}
test.init({
  testId:{
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstname:{
    type: Sequelize.STRING
  },
  lastname:{
    type: Sequelize.STRING
  },
  username:{
    type: Sequelize.STRING,
    unique: true
  },
  password:{
    type: Sequelize.STRING
  },
  groups:{
    type: Sequelize.STRING,
    /*
    get() {
        if (this.getDataValue('groups') == null){
          return this.getDataValue('groups')
        }
        else{
          return this.getDataValue('groups').split(';')
        }
    },
    set(val) {
       this.setDataValue('groups',(';',val));
    }
    */
  }
},{
  sequelize,
  modelName: 'test'
});

module.exports = {user, group, tran, test};