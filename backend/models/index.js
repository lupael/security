const { sequelize } = require('../database');
const User = require('./User');
const Scan = require('./Scan');
const Finding = require('./Finding');
const Report = require('./Report');
const Log = require('./Log');

// Associations
User.hasMany(Scan, { foreignKey: 'user_id' });
Scan.belongsTo(User, { foreignKey: 'user_id' });

Scan.hasMany(Finding, { foreignKey: 'scan_id' });
Finding.belongsTo(Scan, { foreignKey: 'scan_id' });

Scan.hasOne(Report, { foreignKey: 'scan_id' });
Report.belongsTo(Scan, { foreignKey: 'scan_id' });

User.hasMany(Log, { foreignKey: 'user_id' });
Log.belongsTo(User, { foreignKey: 'user_id' });

const db = {
  sequelize,
  User,
  Scan,
  Finding,
  Report,
  Log,
};

module.exports = db;
