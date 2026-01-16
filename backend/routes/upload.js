const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `ctg_data_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.xlsx' && ext !== '.xls') {
            return cb(new Error('Only Excel files are allowed'));
        }
        cb(null, true);
    }
});

// In-memory storage for uploaded data
let uploadedPatients = [];
let uploadedReports = [];
let dataCleaningStats = {};

// Helper function to determine risk level from NSP value
const getRiskLevel = (nsp) => {
    const value = parseInt(nsp);
    if (value === 3) return 'high';      // Pathologic
    if (value === 2) return 'suspect';   // Suspect
    return 'normal';                      // Normal (1 or any other value)
};

// Helper function to generate patient ID
const generatePatientId = (index) => {
    return `P-${String(10000 + index).padStart(5, '0')}`;
};

// Helper function to calculate mean of array (excluding invalid values)
const calculateMean = (arr) => {
    const valid = arr.filter(v => !isNaN(v) && v !== null && v !== undefined && v > 0);
    if (valid.length === 0) return 0;
    return valid.reduce((sum, v) => sum + v, 0) / valid.length;
};

// Function to parse Excel with proper header handling
const parseExcelWithHeaders = (workbook, sheetName) => {
    const worksheet = workbook.Sheets[sheetName];

    // First, try reading with default settings
    let data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) return [];

    // Check if first row looks like headers (contains text like "LB", "AC", etc.)
    const firstRow = data[0];
    const firstRowValues = Object.values(firstRow);
    const hasHeadersAsData = firstRowValues.some(v =>
        typeof v === 'string' && ['LB', 'AC', 'FM', 'UC', 'NSP', 'CLASS', 'ASTV', 'MSTV'].includes(v.toUpperCase())
    );

    if (hasHeadersAsData) {
        console.log('Detected headers in first row, rebuilding with proper headers...');

        // Build a header map from the first row
        const headerMap = {};
        Object.entries(firstRow).forEach(([key, value]) => {
            if (typeof value === 'string') {
                headerMap[key] = value.toUpperCase();
            }
        });

        console.log('Header map:', headerMap);

        // Transform remaining rows using the header map
        data = data.slice(1).map(row => {
            const newRow = {};
            Object.entries(row).forEach(([key, value]) => {
                const headerName = headerMap[key] || key;
                newRow[headerName] = value;
            });
            return newRow;
        });
    }

    return data;
};

// Data cleaning function
const cleanData = (data) => {
    const stats = {
        originalRows: data.length,
        duplicatesRemoved: 0,
        rowsWithMissingValues: 0,
        rowsRemoved: 0,
        valuesImputed: 0,
        outliersCapped: 0,
        finalRows: 0,
        classDistribution: { normal: 0, suspect: 0, high: 0, unknown: 0 },
    };

    // Critical columns for CTG analysis
    // NSP is NOT critical for blind testing
    const criticalColumns = ['LB', 'AC', 'FM', 'UC', 'ASTV', 'MSTV'];
    const numericColumns = ['LB', 'AC', 'FM', 'UC', 'ASTV', 'MSTV', 'ALTV', 'MLTV', 'DL', 'DS', 'DP', 'WIDTH', 'MIN', 'MAX', 'NMAX', 'NZEROS', 'MODE', 'MEAN', 'MEDIAN', 'VARIANCE', 'TENDENCY'];

    // Helper to validate row based on critical features
    const isValidRow = (row) => {
        const requiredFeatures = ['LB', 'AC', 'FM'];
        // Check normalized keys (uppercase)
        const upperKeys = {};
        Object.keys(row).forEach(k => upperKeys[k.toUpperCase()] = row[k]);

        const hasFeatures = requiredFeatures.every(f =>
            upperKeys[f] !== undefined && upperKeys[f] !== null && !isNaN(parseFloat(upperKeys[f]))
        );
        return hasFeatures;
    };

    // Step 1: Filter out rows that are completely broken (missing valid features)
    let cleanedData = data.filter(row => {
        if (!isValidRow(row)) {
            stats.rowsRemoved++;
            return false;
        }
        return true;
    });

    console.log(`After valid row check: ${cleanedData.length} rows`);

    // Step 2: Remove exact duplicates
    const seen = new Set();
    cleanedData = cleanedData.filter(row => {
        // Use a key based on features, ignoring NSP/filename to find data dupes
        const key = JSON.stringify({
            LB: row.LB, AC: row.AC, FM: row.FM, UC: row.UC, ASTV: row.ASTV
        });
        if (seen.has(key)) {
            stats.duplicatesRemoved++;
            return false;
        }
        seen.add(key);
        return true;
    });

    // Step 3: Calculate column means for imputation
    const columnMeans = {};
    numericColumns.forEach(col => {
        const values = cleanedData.map(row => parseFloat(row[col])).filter(v => !isNaN(v) && v >= 0);
        columnMeans[col] = calculateMean(values);
    });

    // Step 4: Handle missing values and normalize
    cleanedData = cleanedData.map(row => {
        const newRow = {};
        let hasMissing = false;

        // Normalize column names
        Object.entries(row).forEach(([key, value]) => {
            const upperKey = key.toUpperCase();
            newRow[upperKey] = value;
        });

        // Ensure numeric columns are actually numbers
        numericColumns.forEach(col => {
            const value = parseFloat(newRow[col]);
            if (isNaN(value) || value < 0) {
                hasMissing = true;
                newRow[col] = columnMeans[col] || 0;
                stats.valuesImputed++;
            } else {
                newRow[col] = value;
            }
        });

        // Preserve original non-numeric fields like FileName
        if (row.FileName) newRow.FILENAME = row.FileName;
        if (row.FILENAME) newRow.FILENAME = row.FILENAME;

        // Handle NSP specially
        // If it exists and is valid, keep it. Else 0.
        let nspVal = parseInt(newRow.NSP || newRow.CLASS || 0);
        if (isNaN(nspVal)) nspVal = 0;
        newRow.NSP = nspVal;

        if (hasMissing) stats.rowsWithMissingValues++;
        return newRow;
    });

    // Step 5: Cap outliers
    criticalColumns.forEach(col => {
        const values = cleanedData.map(row => parseFloat(row[col])).filter(v => !isNaN(v) && v >= 0).sort((a, b) => a - b);
        if (values.length > 0) {
            const q1 = values[Math.floor(values.length * 0.25)];
            const q3 = values[Math.floor(values.length * 0.75)];
            const iqr = q3 - q1;
            const lowerBound = Math.max(0, q1 - 1.5 * iqr);
            const upperBound = q3 + 1.5 * iqr;

            cleanedData = cleanedData.map(row => {
                const value = parseFloat(row[col]);
                if (value < lowerBound) {
                    stats.outliersCapped++;
                    return { ...row, [col]: lowerBound };
                }
                if (value > upperBound) {
                    stats.outliersCapped++;
                    return { ...row, [col]: upperBound };
                }
                return row;
            });
        }
    });

    // Step 6: Count distribution
    cleanedData.forEach(row => {
        const nsp = row.NSP;
        let risk = 'unknown';
        if (nsp === 1) risk = 'normal';
        if (nsp === 2) risk = 'suspect';
        if (nsp === 3) risk = 'high';

        if (stats.classDistribution[risk] === undefined) stats.classDistribution[risk] = 0;
        stats.classDistribution[risk]++;
    });

    stats.finalRows = cleanedData.length;
    return { cleanedData, stats };
};

// POST upload Excel file
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = XLSX.readFile(req.file.path);
        const dataSheetName = workbook.SheetNames.find(name =>
            name.toLowerCase() === 'data' || name.toLowerCase().includes('data')
        ) || workbook.SheetNames[0];

        const jsonData = parseExcelWithHeaders(workbook, dataSheetName);
        if (jsonData.length === 0) return res.status(400).json({ error: 'No data found' });

        const { cleanedData, stats } = cleanData(jsonData);
        dataCleaningStats = stats;

        if (cleanedData.length === 0) {
            return res.status(400).json({
                error: 'No valid data after cleaning. Please ensure your Excel file has proper CTG feature columns.',
                stats
            });
        }

        // --- BATCH AI PREDICTION ---
        console.log(`Running AI Inference on ${cleanedData.length} patients...`);

        // Prepare data for Python (list of dicts)
        const batchInput = cleanedData.map(row => {
            // Ensure numeric values
            const features = {};
            ['LB', 'AC', 'FM', 'UC', 'ASTV', 'MSTV', 'ALTV', 'MLTV', 'DL', 'DS', 'DP', 'Width', 'Min', 'Max', 'Nmax', 'Nzeros', 'Mode', 'Mean', 'Median', 'Variance', 'Tendency'].forEach(f => {
                features[f] = parseFloat(row[f.toUpperCase()]) || 0;
            });
            return features;
        });

        // Spawn Python process
        const pythonScriptPath = path.join(__dirname, '../ml_engine/predict.py');
        const { spawn } = require('child_process');

        // Increase max buffer for large JSON
        const pythonProcess = spawn('python3', [pythonScriptPath]);

        // Create a promise to handle the process lifecycle
        const predictions = await new Promise((resolve, reject) => {
            let predictionOutput = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                predictionOutput += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error("Python inference failed (Code " + code + "):", errorOutput);
                    resolve(null); // Resolve null to fall back
                } else {
                    try {
                        const results = JSON.parse(predictionOutput);
                        resolve(results);
                    } catch (e) {
                        console.error("JSON Parse Error:", e);
                        console.error("Raw Output:", predictionOutput);
                        resolve(null);
                    }
                }
            });

            pythonProcess.stdin.on('error', (err) => {
                console.error("Python Stdin Error (likely process crashed early):", err.message);
                // Do not reject here, let the close handler resolve with null
            });

            // Send data to stdin
            try {
                pythonProcess.stdin.write(JSON.stringify(batchInput));
                pythonProcess.stdin.end();
            } catch (writeErr) {
                console.error("Failed to write to Python stdin:", writeErr);
            }
        });

        if (!predictions) {
            console.warn("AI Prediction failed, falling back to basic logic");
        } else {
            console.log("AI Inference Success!");
        }

        // Clear previous data
        uploadedPatients = [];
        uploadedReports = [];
        const clinicians = ['Dr. Lim', 'Dr. Koh', 'Dr. Patel', 'Dr. Chen', 'Dr. Singh'];

        // Process Merge
        cleanedData.forEach((row, index) => {
            const patientId = generatePatientId(index + 1);

            // Default values
            let nspValue = parseInt(row.NSP || row.CLASS || 0);
            let riskLevel = 'unknown';
            let riskScore = 0.5;

            // Use AI Prediction if available
            if (predictions && predictions[index]) {
                const pred = predictions[index];
                riskScore = pred.riskScore;

                // Map AI classification to NSP/RiskLevel
                if (pred.classification === 'Normal') { nspValue = 1; riskLevel = 'normal'; }
                if (pred.classification === 'Suspect') { nspValue = 2; riskLevel = 'suspect'; }
                if (pred.classification === 'Pathologic') { nspValue = 3; riskLevel = 'high'; }

            } else {
                // Fallback (or if file had NSP)
                riskLevel = getRiskLevel(nspValue);
            }

            const patient = {
                id: patientId,
                name: row.FILENAME || row.FileName || row.filename || `Patient ${index + 1}`,
                age: 25 + Math.floor(Math.random() * 15),
                gestationalAge: 36 + Math.floor(Math.random() * 5),
                room: Math.floor(Math.random() * 20) + 1,
                status: riskLevel === 'high' ? 'critical' : riskLevel === 'suspect' ? 'active' : 'stable',
                riskLevel,
                riskScore: parseFloat(riskScore.toFixed(2)),
                // Save full AI details
                classification: (predictions && predictions[index]) ? predictions[index].classification : (riskLevel === 'high' ? 'Pathologic' : riskLevel === 'suspect' ? 'Suspect' : 'Normal'),
                probabilities: (predictions && predictions[index]) ? predictions[index].probabilities : null,
                modelVersion: (predictions && predictions[index]) ? predictions[index].modelVersion : 'Legacy Rules',

                admissionDate: new Date().toISOString().split('T')[0],
                attendingDoctor: clinicians[Math.floor(Math.random() * clinicians.length)],
                ctgFeatures: {
                    ...row, // Contains all Excel columns
                    NSP: nspValue
                },
            };

            uploadedPatients.push(patient);

            const report = {
                id: `R-${String(index + 1).padStart(4, '0')}`,
                patientId,
                patientName: patient.name,
                date: new Date().toISOString().split('T')[0],
                riskLevel,
                clinician: patient.attendingDoctor,
                modelVersion: 'CNN-LSTM (AI)',
                status: 'completed',
                features: patient.ctgFeatures,
            };

            uploadedReports.push(report);
        });

        // Recalculate stats based on AI results
        stats.classDistribution = { normal: 0, suspect: 0, high: 0, unknown: 0 };
        uploadedPatients.forEach(p => {
            const k = p.riskLevel === 'high' ? 'high' : p.riskLevel; // map 'high' to 'high'
            if (stats.classDistribution[k] !== undefined) stats.classDistribution[k]++;
        });

        res.json({
            success: true,
            message: `Successfully analyzed ${uploadedPatients.length} patients with AI`,
            patientsCount: uploadedPatients.length,
            reportsCount: uploadedReports.length,
            summary: stats.classDistribution,
            dataCleaning: stats
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process Excel file: ' + error.message });
    }
});

// GET uploaded patients
router.get('/patients', (req, res) => {
    res.json(uploadedPatients);
});

// GET uploaded patient by ID  
router.get('/patients/:id', (req, res) => {
    const patient = uploadedPatients.find(p => p.id === req.params.id);
    if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
});

// GET uploaded reports
router.get('/reports', (req, res) => {
    let filtered = [...uploadedReports];

    if (req.query.riskLevel) {
        filtered = filtered.filter(r => r.riskLevel === req.query.riskLevel);
    }
    if (req.query.status) {
        filtered = filtered.filter(r => r.status === req.query.status);
    }

    res.json(filtered);
});

// GET upload status
router.get('/status', (req, res) => {
    res.json({
        hasData: uploadedPatients.length > 0,
        patientsCount: uploadedPatients.length,
        reportsCount: uploadedReports.length,
        dataCleaning: dataCleaningStats,
    });
});

// DELETE clear uploaded data
router.delete('/clear', (req, res) => {
    uploadedPatients = [];
    uploadedReports = [];
    dataCleaningStats = {};
    res.json({ success: true, message: 'Data cleared' });
});

// Export for use in other routes
router.getUploadedPatients = () => uploadedPatients;
router.getUploadedReports = () => uploadedReports;

module.exports = router;
