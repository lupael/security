const db = require('../models');

const mockFindings = [
    { category: 'Security', severity: 'High', description: 'SQL Injection vulnerability found in login form.', recommendation: 'Use parameterized queries to prevent SQL injection.' },
    { category: 'Security', severity: 'Medium', description: 'Cross-Site Scripting (XSS) found on search results page.', recommendation: 'Sanitize user input before rendering it on the page.' },
    { category: 'Optimization', severity: 'Low', description: 'Images are not optimized.', recommendation: 'Compress images to reduce page load time.' },
    { category: 'Design', severity: 'Low', description: 'Color contrast between text and background is not sufficient.', recommendation: 'Increase contrast to meet WCAG AA standards.' },
    { category: 'SEO', severity: 'Medium', description: 'Meta description is missing.', recommendation: 'Add a meta description to improve search engine visibility.' },
    { category: 'Security', severity: 'Critical', description: 'Outdated SSL/TLS version.', recommendation: 'Update to the latest SSL/TLS version.' },
];

const runScan = async (scanId, io, userId) => {
    console.log(`Starting scan for scanId: ${scanId}`);
    try {
        const scan = await db.Scan.findByPk(scanId);
        if (!scan) {
            console.error(`Scan with id ${scanId} not found.`);
            return;
        }

        // Simulate scanning time
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Create mock findings
        for (const finding of mockFindings) {
            await db.Finding.create({
                scan_id: scanId,
                ...finding,
            });
        }

        // Update scan status
        await scan.update({ status: 'completed' });

        console.log(`Scan completed for scanId: ${scanId}`);
        io.to(`user-${userId}`).emit('scan_completed', { scanId, status: 'completed' });

    } catch (error) {
        console.error(`Error during scan for scanId: ${scanId}`, error);
        const scan = await db.Scan.findByPk(scanId);
        if (scan) {
            await scan.update({ status: 'failed' });
            io.to(`user-${userId}`).emit('scan_completed', { scanId, status: 'failed' });
        }
    }
};

module.exports = {
    runScan,
};
