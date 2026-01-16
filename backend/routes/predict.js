const express = require('express');
const router = express.Router();

const { spawn } = require('child_process');
const path = require('path');

// Real ML Prediction via Python
const getPrediction = (features) => {
    return new Promise((resolve, reject) => {
        const pythonScriptPath = path.join(__dirname, '../ml_engine/predict.py');
        const inputData = JSON.stringify(features);

        // Spawn Python process
        // Ensure 'python3' is in the PATH or config
        const pythonProcess = spawn('python3', [pythonScriptPath, inputData]);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                console.error(`Python stderr: ${errorString}`);
                // Fallback to mock if python fails (graceful degradation)
                console.log('Falling back to simulated prediction due to Python error');
                resolve(getMockPrediction(features));
            } else {
                try {
                    // Python prints the JSON result to stdout
                    const result = JSON.parse(dataString);
                    if (result.error) {
                        console.error('Python Script Error:', result.error);
                        resolve(getMockPrediction(features));
                    } else {
                        resolve(result);
                    }
                } catch (e) {
                    console.error('Failed to parse Python output:', e);
                    resolve(getMockPrediction(features));
                }
            }
        });
    });
};

// Fallback Mock Logic (Moved from original)
const getMockPrediction = (features) => {
    const { ASTV = 30, DS = 0, DP = 0, LB = 140 } = features;
    let normalProb = 0.7, suspectProb = 0.2, pathologicProb = 0.1;

    if (ASTV > 50) { normalProb -= 0.3; pathologicProb += 0.2; suspectProb += 0.1; }
    if (DS > 2) { normalProb -= 0.3; pathologicProb += 0.3; }
    if (DP > 1) { normalProb -= 0.2; pathologicProb += 0.2; }
    if (LB > 160 || LB < 110) { normalProb -= 0.15; suspectProb += 0.1; pathologicProb += 0.05; }

    const total = normalProb + suspectProb + pathologicProb;
    normalProb = Math.max(0, normalProb / total);
    suspectProb = Math.max(0, suspectProb / total);
    pathologicProb = Math.max(0, pathologicProb / total);

    let classification = 'Normal', riskScore = normalProb;
    if (pathologicProb > normalProb && pathologicProb > suspectProb) {
        classification = 'Pathologic'; riskScore = pathologicProb;
    } else if (suspectProb > normalProb) {
        classification = 'Suspect'; riskScore = suspectProb;
    }

    return {
        classification,
        riskScore: Math.round(riskScore * 100) / 100,
        probabilities: {
            Normal: Math.round(normalProb * 100) / 100,
            Suspect: Math.round(suspectProb * 100) / 100,
            Pathologic: Math.round(pathologicProb * 100) / 100,
        },
        modelVersion: 'Review Needed (Simulation)',
        timestamp: new Date().toISOString(),
    };
};

// POST prediction
router.post('/', async (req, res) => {
    const features = req.body;
    const prediction = await getPrediction(features);
    res.json(prediction);
});

module.exports = router;
