const db = require('../models');
const snmp = require('net-snmp');
const { NodeSSH } = require('node-ssh');
const fs = require('fs');

const runNetworkScan = async (scanId, io, userId) => {
    console.log(`Starting network scan for scanId: ${scanId}`);
    let scan;
    try {
        scan = await db.Scan.findByPk(scanId);
        if (!scan) {
            console.error(`Scan with id ${scanId} not found.`);
            return;
        }

        await scan.update({ status: 'running' });
        io.to(`user-${userId}`).emit('scan_updated', { scanId, status: 'running', message: 'Starting network device scan...' });

        const allFindings = [];
        const target = scan.target;

        // Input validation for target
        const isValidTarget = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$|^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(target);
        if (!isValidTarget) {
            await scan.update({ status: 'failed' });
            await db.Finding.create({
                scan_id: scanId,
                category: 'Scan Execution',
                severity: 'Critical',
                description: `Invalid target: ${target}. The target must be a valid IP address or hostname.`,
                recommendation: 'Please provide a valid target and restart the scan.'
            });
            io.to(`user-${userId}`).emit('scan_completed', { scanId, status: 'failed' });
            return;
        }

        const community = scan.snmpCommunity || 'public'; // Allow configurable community string

        // 1. SNMP Scan
        io.to(`user-${userId}`).emit('scan_updated', { scanId, status: 'running', message: `Polling ${target} with SNMP community '${community}'...` });
        const snmpFindings = await performSnmpScan(scan);
        allFindings.push(...snmpFindings);

        // 2. SSH Scan
        if (scan.credentialId) {
            const credential = await db.Credential.findByPk(scan.credentialId);
            if (credential && credential.type === 'SSH') {
                io.to(`user-${userId}`).emit('scan_updated', { scanId, status: 'running', message: `Attempting SSH connection to ${target}...` });
                const sshFindings = await performSshScan(target, credential);
                allFindings.push(...sshFindings);
            }
        }

        // Save findings to the database
        for (const finding of allFindings) {
            await db.Finding.create({
                scan_id: scanId,
                ...finding,
            });
        }

        // Update scan status to completed
        await scan.update({ status: 'completed' });
        console.log(`Network scan completed for scanId: ${scanId}`);
        io.to(`user-${userId}`).emit('scan_completed', { scanId, status: 'completed' });

    } catch (error) {
        console.error(`Error during network scan for scanId: ${scanId}`, error);
        if (scan) {
            await scan.update({ status: 'failed' });
            await db.Finding.create({
                scan_id: scanId,
                category: 'Scan Execution',
                severity: 'Critical',
                description: `The scan failed due to an unexpected error: ${error.message}`,
                recommendation: 'Review the scanner logs for more details.'
            });
            io.to(`user-${userId}`).emit('scan_completed', { scanId, status: 'failed' });
        }
    }
};

const performSshScan = async (target, credential) => {
    const findings = [];
    const ssh = new NodeSSH();

    try {
        await ssh.connect({
            host: target,
            username: credential.username,
            privateKey: credential.secret
        });

        // Example: run a command to get firmware version on a Cisco device
        const result = await ssh.execCommand('show version | include Version');
        if (result.stdout) {
            findings.push({
                category: 'Configuration',
                severity: 'Info',
                description: `Device version info: ${result.stdout}`,
                recommendation: 'Ensure the device firmware is up to date to protect against known vulnerabilities.'
            });
        } else {
             findings.push({
                category: 'Configuration',
                severity: 'Info',
                description: `Could not determine device version via SSH.`,
                recommendation: 'Could not execute "show version" command or the output was empty.'
            });
        }
        ssh.dispose();
    } catch(error) {
        findings.push({
            category: 'Configuration',
            severity: 'Warning',
            description: `Failed to connect or execute commands on ${target} via SSH.`,
            recommendation: `Ensure SSH is enabled on the device and that credentials are correct. Error: ${error.message}`
        });
    }
    return findings;
}


const performSnmpScan = async (scan) => {
    const findings = [];
    const target = scan.target;
    let session;

    if (scan.credentialId) {
        const credential = await db.Credential.findByPk(scan.credentialId);
        if (credential && credential.type === 'SNMPv3') {
            const user = {
                name: credential.username,
                level: snmp.SecurityLevel.authPriv,
                authProtocol: snmp.AuthProtocols.sha,
                authKey: credential.secret,
                privProtocol: snmp.PrivProtocols.aes,
                privKey: credential.secret
            };
            session = snmp.createV3Session(target, user, { timeout: 10000 });
        }
    }

    if (!session) {
        const community = scan.snmpCommunity || 'public';
        session = snmp.createSession(target, community, { timeout: 10000 });
    }

    // 1. Get basic device info
    const oids = [
        "1.3.6.1.2.1.1.1.0", // sysDescr
        "1.3.6.1.2.1.1.3.0", // sysUpTime
        "1.3.6.1.2.1.1.4.0", // sysContact
        "1.3.6.1.2.1.1.5.0", // sysName
        "1.3.6.1.2.1.1.6.0", // sysLocation
    ];

    const snmpGet = new Promise((resolve) => {
        session.get(oids, (error, varbinds) => {
            if (error) {
                findings.push({
                    category: 'Network Discovery',
                    severity: 'Critical',
                    description: `Failed to poll device at ${target} using SNMP.`,
                    recommendation: `Ensure the device is online, accepts SNMP requests from this server, and that the community string is correct. Error: ${error.message}`
                });
            } else {
                for (const varbind of varbinds) {
                    if (!snmp.isVarbindError(varbind)) {
                         let name = varbind.oid.split('.').pop(); // A simple way to name them
                         if(varbind.oid === oids[0]) name = 'System Description';
                         if(varbind.oid === oids[1]) name = 'Uptime';
                         if(varbind.oid === oids[2]) name = 'Contact';
                         if(varbind.oid === oids[3]) name = 'System Name';
                         if(varbind.oid === oids[4]) name = 'Location';

                        findings.push({
                            category: 'Device Information',
                            severity: 'Info',
                            description: `${name}: ${varbind.value.toString()}`,
                            recommendation: 'Informational finding.'
                        });
                    }
                }
            }
            resolve();
        });
    });

    // 2. Get interface list
    const ifTableOid = "1.3.6.1.2.1.2.2.1"; // ifTable
    const ifColumns = {
        ifDescr: `${ifTableOid}.2`,
        ifOperStatus: `${ifTableOid}.8`,
    };

    const snmpWalk = new Promise((resolve) => {
        session.table(ifColumns.ifDescr, (error, table) => {
             if (error) {
                findings.push({
                    category: 'Interface Scan',
                    severity: 'Warning',
                    description: `Failed to walk interface table on ${target}.`,
                    recommendation: `Could not retrieve a list of network interfaces via SNMP. Error: ${error.message}`
                });
                return resolve();
            }

            const getStatusPromises = Object.keys(table).map(index => {
                return new Promise(res => {
                    session.get([`${ifColumns.ifOperStatus}.${index}`], (err, vbs) => {
                        const statusVb = vbs ? vbs[0] : null;
                        const status = statusVb && !snmp.isVarbindError(statusVb) ? statusVb.value.toString() : 'Unknown';
                        const descr = table[index];
                        
                        let severity = 'Info';
                        if (status === '1') { // up
                           // Don't report on 'up' interfaces unless verbose mode
                        } else if (status === '2') { // down
                            severity = 'Warning';
                            findings.push({
                                category: 'Interface Scan',
                                severity,
                                description: `Interface '${descr}' (index: ${index}) is down.`,
                                recommendation: 'If this interface is expected to be operational, check the physical connection and device configuration.'
                            });
                        }
                        res();
                    });
                });
            });
            Promise.all(getStatusPromises).then(() => resolve());
        });
    });


    return Promise.all([snmpGet, snmpWalk]).then(() => {
        session.close();
        if(findings.length === 0){
             findings.push({
                category: 'Network Discovery',
                severity: 'Critical',
                description: `No SNMP data could be retrieved from ${target}.`,
                recommendation: `Ensure the device is online, accepts SNMP requests from this server, and that the community string is correct.`
            });
        }
        return findings;
    });
};


module.exports = {
    runNetworkScan,
};
