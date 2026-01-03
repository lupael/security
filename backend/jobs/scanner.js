const db = require('../models');
const tls = require('tls');
const { URL } = require('url');
const { exec } = require('child_process');
const pscan = require('js-port-scan');
const axios = require('axios');
const cheerio = require('cheerio');
const seord = require('seord');

/**
 * Checks for basic SEO and optimization issues.
 * @param {string} targetUrl The URL of the website to scan.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of findings.
 */
const checkSeo = async (targetUrl) => {
    const findings = [];
    try {
        const { data } = await axios.get(targetUrl, { timeout: 10000 });
        const $ = cheerio.load(data);

        // Check for title tag
        const title = $('title').text();
        if (!title) {
            findings.push({ category: 'SEO', severity: 'High', description: 'Missing <title> tag.', recommendation: 'Add a descriptive title tag to the page to improve SEO.' });
        } else if (title.length > 60) {
            findings.push({ category: 'SEO', severity: 'Low', description: 'Title tag is too long (over 60 characters).', recommendation: 'Shorten the title tag to ensure it displays fully in search results.' });
        }

        // Check for meta description
        const metaDescription = $('meta[name="description"]').attr('content');
        if (!metaDescription) {
            findings.push({ category: 'SEO', severity: 'Medium', description: 'Missing meta description.', recommendation: 'Add a meta description to improve click-through rates from search engines.' });
        } else if (metaDescription.length > 160) {
            findings.push({ category: 'SEO', severity: 'Low', description: 'Meta description is too long (over 160 characters).', recommendation: 'Keep the meta description concise to ensure it is not truncated in search results.' });
        }

        // Use seord for content analysis
        const content = $('body').text();
        const analysis = seord(content);
        findings.push({
            category: 'SEO',
            severity: 'Info',
            description: `SEO content score: ${analysis.score}/100.`,
            recommendation: `Top keywords found: ${analysis.keywords.slice(0, 5).map(k => k.word).join(', ')}. Review content score details for more insights.`
        });


    } catch (error) {
        findings.push({
            category: 'SEO',
            severity: 'Critical',
            description: `Failed to fetch or analyze ${targetUrl} for SEO checks.`,
            recommendation: `Ensure the URL is correct and the website is accessible. Error: ${error.message}`
        });
    }
    return findings;
};

/**
 * Checks for vulnerabilities in frontend JavaScript libraries.
 * @param {string} targetUrl The URL of the website to scan.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of findings.
 */
const checkFrontendVulnerabilities = (targetUrl) => {
    return new Promise((resolve) => {
        const findings = [];
        const command = `npx is-website-vulnerable --json ${targetUrl}`;

        exec(command, (error, stdout, stderr) => {
            if (error && !stdout) {
                // 'is-website-vulnerable' exits with an error code if vulnerabilities are found.
                // We only consider it a true error if there's no stdout to parse.
                findings.push({
                    category: 'Security',
                    severity: 'Critical',
                    description: `Failed to scan ${targetUrl} for frontend vulnerabilities.`,
                    recommendation: `The scanner tool failed to run. Error: ${stderr}`
                });
                return resolve(findings);
            }

            try {
                const results = JSON.parse(stdout);
                if (results.vulnerabilities && results.vulnerabilities.length > 0) {
                    results.vulnerabilities.forEach(vuln => {
                        findings.push({
                            category: 'Security',
                            severity: vuln.severity === 'high' ? 'High' : 'Medium',
                            description: `Vulnerable library '${vuln.library}' version ${vuln.version} found. ${vuln.description}`,
                            recommendation: `Update '${vuln.library}' to a secure version. More info: ${vuln.url}`
                        });
                    });
                } else {
                    findings.push({
                        category: 'Security',
                        severity: 'Info',
                        description: `No known vulnerable frontend libraries were detected.`,
                        recommendation: 'Keep frontend dependencies up to date.'
                    });
                }
            } catch (e) {
                findings.push({
                    category: 'Security',
                    severity: 'Critical',
                    description: 'Failed to parse the output of the frontend vulnerability scanner.',
                    recommendation: `The tool's output was not valid JSON. Output: ${stdout}`
                });
            }
            
            resolve(findings);
        });
    });
};

/**
 * Checks for common open ports on a given hostname.
 * @param {string} hostname The hostname to scan.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of findings.
 */
const checkPorts = async (hostname) => {
    const findings = [];
    const commonPorts = [21, 22, 25, 80, 110, 143, 443, 3306, 8080];
    
    for (const port of commonPorts) {
        try {
            const result = await pscan.scan(hostname, port);
            if (result.isOpen) {
                findings.push({
                    category: 'Security',
                    severity: 'Medium',
                    description: `Port ${port} is open on ${hostname}.`,
                    recommendation: `Ensure that port ${port} is intended to be publicly accessible. Unnecessary open ports can increase the attack surface.`
                });
            }
        } catch (error) {
            // This library can throw errors for timeouts or other issues, we'll ignore them for now
            // and only report open ports.
        }
    }
    return findings;
};

/**
 * Checks the SSL/TLS certificate of a given hostname.
 * @param {string} hostname The hostname to check.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of findings.
 */
const checkSsl = (hostname) => {
  return new Promise((resolve) => {
    const findings = [];
    const options = {
      host: hostname,
      port: 443,
      servername: hostname,
      rejectUnauthorized: false // We handle errors manually
    };

    const socket = tls.connect(options, () => {
      const peerCertificate = socket.getPeerCertificate();
      if (socket.authorized) {
        const validTo = new Date(peerCertificate.valid_to);
        const daysRemaining = Math.floor((validTo - new Date()) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
          findings.push({
            category: 'Security',
            severity: 'High',
            description: `The SSL/TLS certificate for ${hostname} has expired.`,
            recommendation: 'Renew the SSL/TLS certificate immediately.'
          });
        } else if (daysRemaining < 30) {
          findings.push({
            category: 'Security',
            severity: 'Medium',
            description: `The SSL/TLS certificate for ${hostname} is expiring in ${daysRemaining} days.`,
            recommendation: 'Renew the SSL/TLS certificate soon.'
          });
        } else {
            findings.push({
                category: 'Security',
                severity: 'Info',
                description: `The SSL/TLS certificate for ${hostname} is valid for ${daysRemaining} more days.`,
                recommendation: 'No action needed at this time.'
              });
        }
      } else {
        findings.push({
          category: 'Security',
          severity: 'High',
          description: `SSL/TLS certificate for ${hostname} is not valid. Reason: ${socket.authorizationError}`,
          recommendation: 'Ensure a valid, trusted SSL/TLS certificate is installed correctly on the server.'
        });
      }
      socket.destroy();
      resolve(findings);
    });

    socket.on('error', (err) => {
      findings.push({
        category: 'Security',
        severity: 'Critical',
        description: `Failed to connect to ${hostname} for SSL/TLS check.`,
        recommendation: `Ensure the server is reachable on port 443 and that there are no firewall issues. Error: ${err.message}`
      });
      resolve(findings);
    });

    socket.setTimeout(5000, () => {
        socket.destroy();
        findings.push({
            category: 'Security',
            severity: 'Critical',
            description: `Connection to ${hostname}:443 timed out during SSL/TLS check.`,
            recommendation: 'Ensure the server is online and responding to requests on port 443.'
        });
        resolve(findings);
    });
  });
};


const runScan = async (scanId, io, userId) => {
    console.log(`Starting scan for scanId: ${scanId}`);
    let scan;
    try {
        scan = await db.Scan.findByPk(scanId);
        if (!scan) {
            console.error(`Scan with id ${scanId} not found.`);
            return;
        }

        await scan.update({ status: 'running' });
        io.to(`user-${userId}`).emit('scan_updated', { scanId, status: 'running', message: 'Starting SSL/TLS scan...' });

        const url = new URL(scan.target);
        const hostname = url.hostname;

        const allFindings = [];

        // 1. SSL/TLS Scan
        io.to(`user-${userId}`).emit('scan_updated', { scanId, status: 'running', message: 'Performing SSL/TLS certificate check...' });
        const sslFindings = await checkSsl(hostname);
        allFindings.push(...sslFindings);

        // 2. Port Scan
        io.to(`user-${userId}`).emit('scan_updated', { scanId, status: 'running', message: 'Scanning for common open ports...' });
        const portFindings = await checkPorts(hostname);
        allFindings.push(...portFindings);

        // 3. Frontend Vulnerability Scan
        io.to(`user-${userId}`).emit('scan_updated', { scanId, status: 'running', message: 'Scanning for vulnerable frontend libraries...' });
        const frontendFindings = await checkFrontendVulnerabilities(scan.target);
        allFindings.push(...frontendFindings);

        // 4. SEO Scan
        io.to(`user-${userId}`).emit('scan_updated', { scanId, status: 'running', message: 'Performing SEO and optimization checks...' });
        const seoFindings = await checkSeo(scan.target);
        allFindings.push(...seoFindings);
        
        
        // Save findings to the database
        for (const finding of allFindings) {
            await db.Finding.create({
                scan_id: scanId,
                ...finding,
            });
        }
        
        // Update scan status to completed
        await scan.update({ status: 'completed' });
        console.log(`Scan completed for scanId: ${scanId}`);
        io.to(`user-${userId}`).emit('scan_completed', { scanId, status: 'completed' });

    } catch (error)
    {
        console.error(`Error during scan for scanId: ${scanId}`, error);
        if (scan) {
            await scan.update({ status: 'failed' });
            io.to(`user-${userId}`).emit('scan_completed', { scanId, status: 'failed' });
        }
    }
};

module.exports = {
    runScan,
};