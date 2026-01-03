const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');
const Scan = require('./Scan');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  format: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Report;
