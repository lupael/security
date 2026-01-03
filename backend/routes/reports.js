const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../models');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

// @route   GET api/reports/:scanId/export
// @desc    Export a scan report
// @access  Private
router.get('/:scanId/export', auth, async (req, res) => {
    try {
        const { scanId } = req.params;
        const { format } = req.query; // pdf or csv
        const userId = req.user.id;

        const scan = await db.Scan.findOne({
            where: { id: scanId, user_id: userId },
            include: [{ model: db.Finding }],
        });

        if (!scan) {
            return res.status(404).json({ message: 'Scan not found' });
        }

        if (format === 'pdf') {
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=report-${scanId}.pdf`);
            doc.pipe(res);

            doc.fontSize(25).text(`Scan Report for ${scan.target}`, { align: 'center' });
            doc.fontSize(12).text(`Scanned on: ${new Date(scan.createdAt).toLocaleString()}`);
            doc.moveDown();

            scan.Findings.forEach(finding => {
                doc.fontSize(16).text(finding.category, { underline: true });
                doc.fontSize(12).text(`Severity: ${finding.severity}`);
                doc.fontSize(12).text(`Description: ${finding.description}`);
                doc.fontSize(12).text(`Recommendation: ${finding.recommendation}`);
                doc.moveDown();
            });

            doc.end();

        } else if (format === 'csv') {
            const fields = ['category', 'severity', 'description', 'recommendation'];
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(scan.Findings);

            res.header('Content-Type', 'text/csv');
            res.attachment(`report-${scanId}.csv`);
            return res.send(csv);

        } else {
            return res.status(400).json({ message: 'Invalid format specified' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;
