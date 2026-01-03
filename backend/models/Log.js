const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');
const User = require('./User');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Log;
