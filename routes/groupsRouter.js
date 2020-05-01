const express = require('express');
const Sequelize = require('sequelize');
const tModel = require('../models/transactionsModel');

const groupsRouter = express.Router();

//serving '/:userId/groups' endpoint
groupsRouter.route('/')
