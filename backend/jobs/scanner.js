const axios = require('axios');
const cheerio = require('cheerio');
const sslChecker = require('ssl-checker');
const Evilscan = require('evilscan');
const snmp = require('net-snmp');
const { NodeSSH } = require('node-ssh');

/**
 * Performs a web scan on a target URL.
 * @param {string} targetUrl
 * @returns {Promise<Object>} Scan results
 */
const performWebScan = async (targetUrl) => {
  const results = {
    target: targetUrl,
    timestamp: new Date(),
    status: 'completed',
    findings: [],
    metadata: {},
    ssl: null,
    ports: []
  };

  try {
    // 1. Fetch Page & Metadata
    const response = await axios.get(targetUrl);
    const $ = cheerio.load(response.data);
    results.metadata.title = $('title').text();
    results.metadata.description = $('meta[name="description"]').attr('content');

    // 2. SSL/TLS Check
    const hostname = new URL(targetUrl).hostname;
    try {
      results.ssl = await sslChecker(hostname);
    } catch (sslError) {
      results.findings.push({
        type: 'SSL',
        severity: 'High',
        message: 'SSL Certificate validation failed',
        details: sslError.message
      });
    }

    // 3. Basic Port Scan (Top ports)
    const portOptions = {
        target: hostname,
        port: '21,22,23,25,53,80,110,143,443,465,587,8080,8443',
        status: 'O', // Open
        banner: true
    };

    await new Promise((resolve, reject) => {
        const scanner = new Evilscan(portOptions);
        scanner.on('result', (data) => {
            results.ports.push(data);
        });
        scanner.on('error', (err) => { console.error(err); });
        scanner.on('done', () => { resolve(); });
        scanner.run();
    });

  } catch (error) {
    results.status = 'failed';
    results.error = error.message;
  }

  return results;
};

/**
 * Performs a network scan on a target IP/Hostname.
 * @param {string} target
 * @param {string} [community]
 * @param {Object} [sshCreds]
 * @returns {Promise<Object>} Scan results
 */
const performNetworkScan = async (target, community = 'public', sshCreds = null) => {
  const results = {
    target,
    timestamp: new Date(),
    status: 'completed',
    findings: [],
    snmp: {},
    ssh: null
  };

  // SNMP Logic
  try {
    const session = snmp.createSession(target, community, { timeout: 5000 });
    const oids = [
      "1.3.6.1.2.1.1.1.0", // sysDescr
      "1.3.6.1.2.1.1.3.0", // sysUpTime
      "1.3.6.1.2.1.1.5.0", // sysName
    ];

    await new Promise((resolve) => {
      session.get(oids, (error, varbinds) => {
        if (error) {
          results.findings.push({
            type: 'SNMP',
            severity: 'High',
            message: 'SNMP connection failed',
            details: error.toString()
          });
        } else {
          varbinds.forEach(vb => {
            if (!snmp.isVarbindError(vb)) {
              if (vb.oid === oids[0]) results.snmp.sysDescr = vb.value.toString();
              if (vb.oid === oids[1]) results.snmp.sysUpTime = vb.value.toString();
              if (vb.oid === oids[2]) results.snmp.sysName = vb.value.toString();
            }
          });
        }
        resolve();
      });
    });
    session.close();
  } catch (e) {
    results.findings.push({ type: 'SNMP', severity: 'High', message: 'SNMP Error', details: e.message });
  }

  // SSH Logic
  if (sshCreds && sshCreds.username) {
    const ssh = new NodeSSH();
    try {
      await ssh.connect({
        host: target,
        username: sshCreds.username,
        password: sshCreds.password,
        privateKey: sshCreds.privateKey
      });

      // Attempt to get version info (generic)
      const result = await ssh.execCommand('uname -a');
      if (result.stdout) {
        results.ssh = result.stdout;
      } else {
        // Try Cisco/Switch style
        const result2 = await ssh.execCommand('show version');
        results.ssh = result2.stdout || "Command execution failed or returned empty";
      }
      ssh.dispose();
    } catch (err) {
      results.findings.push({
        type: 'SSH',
        severity: 'Medium',
        message: 'SSH connection failed',
        details: err.message
      });
    }
  }

  return results;
};

module.exports = { performWebScan, performNetworkScan };