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
  type: {
    type: DataTypes.ENUM('WEB', 'NETWORK'),
    defaultValue: 'WEB',
    allowNull: false,
  },
  snmpCommunity: {
    type: DataTypes.STRING,
    defaultValue: 'public',
  },
  snmpv3Credentials: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  credentialId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Scan;
