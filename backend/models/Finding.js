const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');
const Scan = require('./Scan');

const Finding = sequelize.define('Finding', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  severity: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  recommendation: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  protocol: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  host: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Finding;
