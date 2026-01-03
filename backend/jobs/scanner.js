const db = require('../models');
const { runWebScan } = require('./webScanner');
const { runNetworkScan } = require('./networkScanner');

const runScan = async (scanId, io, userId) => {
    const scan = await db.Scan.findByPk(scanId);
    if (!scan) {
        console.error(`Scan with id ${scanId} not found in dispatcher.`);
        return;
    }

    if (scan.type === 'WEB') {
        await runWebScan(scanId, io, userId);
    } else if (scan.type === 'NETWORK') {
        await runNetworkScan(scanId, io, userId);
    } else {
        console.error(`Unknown scan type: ${scan.type}`);
        await scan.update({ status: 'failed' });
        io.to(`user-${userId}`).emit('scan_completed', { scanId, status: 'failed', message: `Unknown scan type: ${scan.type}` });
    }
};

module.exports = {
    runScan,
};
