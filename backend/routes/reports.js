const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { reports, patients } = require('../data/mockData');
const { logAction } = require('../database/db');

// Helper to get reports from upload if available
const getReports = () => {
    try {
        const uploadRouter = require('./upload');
        const uploadedReports = uploadRouter.getUploadedReports();
        if (uploadedReports && uploadedReports.length > 0) {
            return uploadedReports;
        }
    } catch (e) { }
    return reports;
};

// Helper to get patients from upload if available
const getPatients = () => {
    try {
        const uploadRouter = require('./upload');
        const uploadedPatients = uploadRouter.getUploadedPatients();
        if (uploadedPatients && uploadedPatients.length > 0) {
            return uploadedPatients;
        }
    } catch (e) { }
    return patients;
};

// GET all reports
router.get('/', (req, res) => {
    let filtered = [...getReports()];

    if (req.query.riskLevel) {
        filtered = filtered.filter(r => r.riskLevel === req.query.riskLevel);
    }
    if (req.query.status) {
        filtered = filtered.filter(r => r.status === req.query.status);
    }

    res.json(filtered);
});

// GET report by ID
router.get('/:id', (req, res) => {
    const allReports = getReports();
    const report = allReports.find(r => r.id === req.params.id);
    if (!report) {
        return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
});

// POST generate new report
router.post('/', (req, res) => {
    const { patientId, modelVersion } = req.body;
    const allReports = getReports();
    const allPatients = getPatients();

    const patient = allPatients.find(p => p.id === patientId);

    const newReport = {
        id: `R-${String(allReports.length + 1).padStart(4, '0')}`,
        patientId,
        patientName: patient?.name || patientId,
        date: new Date().toISOString().split('T')[0],
        riskLevel: patient?.riskLevel || 'pending',
        clinician: req.user?.name || 'Current User',
        modelVersion: modelVersion || 'LightGBM v2.1',
        status: 'completed',
        features: patient?.ctgFeatures || {},
    };

    allReports.push(newReport);

    if (req.user) {
        logAction(req.user.id, req.user.email, 'Report Generated', `Generated report for ${patientId}`, patientId, req.ip);
    }

    res.status(201).json(newReport);
});

// GET download PDF report
router.get('/:id/download', (req, res) => {
    const allReports = getReports();
    const allPatients = getPatients();

    const report = allReports.find(r => r.id === req.params.id);
    if (!report) {
        return res.status(404).json({ error: 'Report not found' });
    }

    const patient = allPatients.find(p => p.id === report.patientId);

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CTG_Report_${report.id}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('CTG Insight™', { align: 'center' });
    doc.fontSize(16).font('Helvetica').text('Fetal Heart Rate Analysis Report', { align: 'center' });
    doc.moveDown();

    // Report info
    doc.fontSize(10).text(`Report ID: ${report.id}`, { align: 'right' });
    doc.text(`Date: ${report.date}`, { align: 'right' });
    doc.moveDown();

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Patient Information Section
    doc.fontSize(14).font('Helvetica-Bold').text('Patient Information');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');

    if (patient) {
        doc.text(`Patient ID: ${patient.id}`);
        doc.text(`Name: ${patient.name}`);
        if (patient.age) doc.text(`Age: ${patient.age} years`);
        if (patient.gestationalAge) doc.text(`Gestational Age: ${patient.gestationalAge} weeks`);
        if (patient.room) doc.text(`Room: ${patient.room}`);
        if (patient.attendingDoctor) doc.text(`Attending Physician: ${patient.attendingDoctor}`);
    } else {
        doc.text(`Patient ID: ${report.patientId}`);
    }
    doc.moveDown();

    // Risk Assessment Section
    doc.fontSize(14).font('Helvetica-Bold').text('AI Risk Assessment');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');

    const riskColor = report.riskLevel === 'high' ? 'red' : report.riskLevel === 'suspect' ? 'orange' : 'green';
    doc.fillColor(riskColor).text(`Classification: ${report.riskLevel.toUpperCase()}`, { continued: false });
    doc.fillColor('black');

    doc.text(`Model Used: ${report.modelVersion}`);
    doc.text(`Clinician: ${report.clinician}`);
    doc.text(`Status: ${report.status}`);
    doc.moveDown();

    // CTG Features Section (from uploaded data)
    doc.fontSize(14).font('Helvetica-Bold').text('CTG Analysis Features');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');

    const features = report.features || patient?.ctgFeatures || {};
    if (Object.keys(features).length > 0) {
        doc.text(`Baseline FHR (LB): ${features.LB || 'N/A'} bpm`);
        doc.text(`Accelerations (AC): ${features.AC || 'N/A'}`);
        doc.text(`Fetal Movements (FM): ${features.FM || 'N/A'}`);
        doc.text(`Uterine Contractions (UC): ${features.UC || 'N/A'}`);
        doc.text(`ASTV (Abnormal Short Term Variability): ${features.ASTV || 'N/A'}%`);
        doc.text(`MSTV (Mean Short Term Variability): ${features.MSTV || 'N/A'}`);
        doc.text(`ALTV (Abnormal Long Term Variability): ${features.ALTV || 'N/A'}%`);
        doc.text(`MLTV (Mean Long Term Variability): ${features.MLTV || 'N/A'}`);
        doc.text(`Light Decelerations (DL): ${features.DL || 'N/A'}`);
        doc.text(`Severe Decelerations (DS): ${features.DS || 'N/A'}`);
        doc.text(`Prolonged Decelerations (DP): ${features.DP || 'N/A'}`);
        doc.text(`NSP Classification: ${features.NSP || 'N/A'} (1=Normal, 2=Suspect, 3=Pathologic)`);
    } else {
        doc.text('CTG feature data not available');
    }
    doc.moveDown();

    // Recommendations Section
    doc.fontSize(14).font('Helvetica-Bold').text('Clinical Recommendations');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');

    if (report.riskLevel === 'high') {
        doc.text('• Immediate physician review required');
        doc.text('• Consider continuous monitoring');
        doc.text('• Prepare for potential intervention');
        doc.text('• Document all observations');
    } else if (report.riskLevel === 'suspect') {
        doc.text('• Increased monitoring recommended');
        doc.text('• Re-evaluate within 30 minutes');
        doc.text('• Consider position change');
        doc.text('• Ensure adequate hydration');
    } else {
        doc.text('• Continue routine monitoring');
        doc.text('• No immediate concerns identified');
        doc.text('• Follow standard protocols');
    }
    doc.moveDown(2);

    // Footer
    doc.fontSize(9).fillColor('gray');
    doc.text('This report is generated by CTG Insight AI System for clinical decision support purposes only.', { align: 'center' });
    doc.text('Final clinical decisions should be made by qualified healthcare professionals.', { align: 'center' });
    doc.moveDown();
    doc.text(`Generated: ${new Date().toISOString()}`, { align: 'center' });

    // Finalize PDF
    doc.end();

    // Log the action
    if (req.user) {
        logAction(req.user.id, req.user.email, 'Report Downloaded', `Downloaded PDF for ${report.id}`, report.patientId, req.ip);
    }
});

module.exports = router;
