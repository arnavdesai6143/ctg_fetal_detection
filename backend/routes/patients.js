const express = require('express');
const router = express.Router();
const { patients, generateCTGData } = require('../data/mockData');

// Helper to get patients from upload if available
const getPatients = () => {
    try {
        const uploadRouter = require('./upload');
        const uploadedPatients = uploadRouter.getUploadedPatients();
        if (uploadedPatients && uploadedPatients.length > 0) {
            return uploadedPatients;
        }
    } catch (e) { }
    // return patients; <--- OLD MOCK DATA (Disabled)
    return []; // Start empty
};

// GET all patients
router.get('/', (req, res) => {
    res.json(getPatients());
});

// GET patient by ID
router.get('/:id', (req, res) => {
    const allPatients = getPatients();
    const patient = allPatients.find(p => p.id === req.params.id);
    if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
});

// GET patient CTG data
router.get('/:id/ctg', (req, res) => {
    const allPatients = getPatients();
    const patient = allPatients.find(p => p.id === req.params.id);
    if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    const ctgData = generateCTGData(patient.riskLevel);
    res.json(ctgData);
});

// PATCH update patient notes
router.patch('/:id/notes', (req, res) => {
    const allPatients = getPatients();
    const patient = allPatients.find(p => p.id === req.params.id);
    if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    patient.notes = req.body.notes;
    res.json({ success: true, patient });
});

module.exports = router;
