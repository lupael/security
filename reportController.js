const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const db = require('../models');

exports.exportReport = async (req, res) => {
    const { id, format } = req.params;
    const userId = req.user.id;

    try {
        const scan = await db.Scan.findOne({
            where: { id, user_id: userId },
            include: [{ model: db.Finding, as: 'findings' }]
        });

        if (!scan) {
            return res.status(404).json({ error: 'Scan not found or access denied' });
        }

        if (format === 'csv') {
            const fields = ['type', 'severity', 'description', 'recommendation', 'host', 'port', 'protocol'];
            const parser = new Parser({ fields });
            const csv = parser.parse(scan.findings || []);
            
            res.header('Content-Type', 'text/csv');
            res.attachment(`scan-report-${id}.csv`);
            return res.send(csv);
        }

        if (format === 'pdf') {
            const doc = new PDFDocument();
            res.header('Content-Type', 'application/pdf');
            res.attachment(`scan-report-${id}.pdf`);
            
            doc.pipe(res);
            
            doc.fontSize(20).text(`Security Scan Report`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Target: ${scan.target}`);
            doc.text(`Date: ${new Date(scan.createdAt).toLocaleString()}`);
            doc.text(`Status: ${scan.status}`);
            doc.moveDown();
            
            // Add findings would go here in a real implementation
            doc.text(`Findings count: ${scan.findings ? scan.findings.length : 0}`);
            
            doc.end();
            return;
        }

        res.status(400).json({ error: 'Invalid format specified. Use pdf or csv.' });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
};