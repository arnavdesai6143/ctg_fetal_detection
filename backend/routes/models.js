const express = require('express');
const router = express.Router();
const { models, featureImportance, driftData } = require('../data/mockData');

// GET all models
router.get('/', (req, res) => {
    const modelList = Object.values(models).map(m => ({
        id: m.id,
        name: m.name,
        type: m.type,
        version: m.version,
        date: m.date,
        balancedAccuracy: m.balancedAccuracy,
        macroF1: m.macroF1,
        auc: m.auc,
        status: m.status,
        description: m.description,
    }));
    res.json(modelList);
});

// GET active models only
router.get('/active', (req, res) => {
    const activeModels = Object.values(models).filter(m => m.status === 'active');
    res.json(activeModels);
});

// GET model by ID
router.get('/:id', (req, res) => {
    const model = models[req.params.id];
    if (!model) {
        return res.status(404).json({ error: 'Model not found' });
    }
    res.json(model);
});

// GET model metrics with confusion matrix
router.get('/:id/metrics', (req, res) => {
    const model = models[req.params.id];
    if (!model) {
        return res.status(404).json({ error: 'Model not found' });
    }

    // Generate confusion matrix based on model accuracy
    const baseNormal = Math.round(892 * model.balancedAccuracy);
    const baseSuspect = Math.round(412 * model.balancedAccuracy);
    const basePathologic = Math.round(189 * model.balancedAccuracy);

    res.json({
        ...model,
        confusionMatrix: {
            normal: {
                normal: baseNormal,
                suspect: Math.round((892 - baseNormal) * 0.7),
                pathologic: Math.round((892 - baseNormal) * 0.3)
            },
            suspect: {
                normal: Math.round((478 - baseSuspect) * 0.6),
                suspect: baseSuspect,
                pathologic: Math.round((478 - baseSuspect) * 0.4)
            },
            pathologic: {
                normal: Math.round((219 - basePathologic) * 0.3),
                suspect: Math.round((219 - basePathologic) * 0.7),
                pathologic: basePathologic
            },
        },
        featureImportance: featureImportance,
        driftData: driftData,
        trainingHistory: {
            epochs: model.type === 'Deep Learning' ? 100 : null,
            finalLoss: model.type === 'Deep Learning' ? 0.12 : null,
            validationLoss: model.type === 'Deep Learning' ? 0.15 : null,
        },
    });
});

// GET feature importance
router.get('/:id/features', (req, res) => {
    const model = models[req.params.id];
    if (!model) {
        return res.status(404).json({ error: 'Model not found' });
    }
    res.json(featureImportance);
});

// GET drift data
router.get('/:id/drift', (req, res) => {
    const model = models[req.params.id];
    if (!model) {
        return res.status(404).json({ error: 'Model not found' });
    }
    res.json(driftData);
});

// PATCH update model status
router.patch('/:id', (req, res) => {
    const model = models[req.params.id];
    if (!model) {
        return res.status(404).json({ error: 'Model not found' });
    }

    if (req.body.status) {
        model.status = req.body.status;
    }

    res.json({ success: true, model });
});

// GET model comparison
router.get('/compare/all', (req, res) => {
    const comparison = Object.values(models).map(m => ({
        name: m.name,
        version: m.version,
        type: m.type,
        balancedAccuracy: m.balancedAccuracy,
        macroF1: m.macroF1,
        auc: m.auc,
        precision: m.precision,
        recall: m.recall,
        specificity: m.specificity,
        status: m.status,
    }));
    res.json(comparison);
});

module.exports = router;
