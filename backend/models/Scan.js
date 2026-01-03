const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');
const User = require('./User');

const Scan = sequelize.define('Scan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  target: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
});

module.exports = Scan;
