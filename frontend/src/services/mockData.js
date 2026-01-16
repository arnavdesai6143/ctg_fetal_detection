// Mock Data for CTG Insight Application

// Sample patients data
export const mockPatients = [
    {
        id: 'P-09342',
        name: 'Sarah Johnson',
        age: 32,
        gestationalAge: 38,
        room: 3,
        status: 'active',
        riskLevel: 'high',
        riskScore: 0.91,
        admissionDate: '2025-10-28',
        attendingDoctor: 'Dr. Lim',
    },
    {
        id: 'P-09343',
        name: 'Emily Chen',
        age: 28,
        gestationalAge: 36,
        room: 2,
        status: 'stable',
        riskLevel: 'normal',
        riskScore: 0.15,
        admissionDate: '2025-10-29',
        attendingDoctor: 'Dr. Koh',
    },
    {
        id: 'P-09344',
        name: 'Maria Garcia',
        age: 35,
        gestationalAge: 40,
        room: 'OR1',
        status: 'critical',
        riskLevel: 'high',
        riskScore: 0.87,
        admissionDate: '2025-10-29',
        attendingDoctor: 'Dr. Lim',
    },
    {
        id: 'P-09345',
        name: 'Jessica Williams',
        age: 29,
        gestationalAge: 37,
        room: 5,
        status: 'stable',
        riskLevel: 'suspect',
        riskScore: 0.45,
        admissionDate: '2025-10-30',
        attendingDoctor: 'Dr. Patel',
    },
    {
        id: 'P-09346',
        name: 'Amanda Brown',
        age: 31,
        gestationalAge: 39,
        room: 7,
        status: 'active',
        riskLevel: 'normal',
        riskScore: 0.12,
        admissionDate: '2025-10-30',
        attendingDoctor: 'Dr. Koh',
    },
];

// Generate CTG time series data
export const generateCTGData = (patientId, riskLevel = 'normal') => {
    const data = [];
    const baseHR = riskLevel === 'high' ? 170 : riskLevel === 'suspect' ? 155 : 140;
    const variability = riskLevel === 'high' ? 5 : riskLevel === 'suspect' ? 12 : 20;

    for (let i = 0; i < 120; i++) {
        const time = i;
        const noise = (Math.random() - 0.5) * variability;

        // Simulate accelerations and decelerations
        let acceleration = 0;
        let deceleration = 0;

        if (riskLevel !== 'high' && Math.random() > 0.92) {
            acceleration = Math.random() * 15 + 10;
        }

        if (riskLevel !== 'normal' && Math.random() > 0.95) {
            deceleration = Math.random() * 20 + 15;
        }

        const fhr = Math.max(100, Math.min(180, baseHR + noise + acceleration - deceleration));

        // Uterine contractions - periodic waves
        const contractionPhase = (i % 30) / 30;
        const uc = 20 + Math.sin(contractionPhase * Math.PI * 2) * 40 + (Math.random() - 0.5) * 10;

        data.push({
            time,
            fhr: Math.round(fhr),
            uc: Math.round(Math.max(0, uc)),
            hasAcceleration: acceleration > 0,
            hasDeceleration: deceleration > 0,
        });
    }

    return data;
};

// CTG Features for a patient
export const generateCTGFeatures = (riskLevel = 'normal') => {
    const isHigh = riskLevel === 'high';
    const isSuspect = riskLevel === 'suspect';

    return {
        LB: isHigh ? 172 : isSuspect ? 158 : 140,  // Baseline heart rate
        AC: isHigh ? 0 : isSuspect ? 2 : 8,         // Accelerations
        FM: isHigh ? 2 : isSuspect ? 5 : 15,        // Fetal movements
        UC: 4,                                        // Uterine contractions
        DL: isHigh ? 0 : isSuspect ? 2 : 4,         // Light decelerations
        DS: isHigh ? 5 : isSuspect ? 2 : 0,         // Severe decelerations
        DP: isHigh ? 3 : isSuspect ? 1 : 0,         // Prolonged decelerations
        ASTV: isHigh ? 78 : isSuspect ? 55 : 32,    // Abnormal short-term variability %
        MSTV: isHigh ? 0.4 : isSuspect ? 0.9 : 1.5, // Mean short-term variability
        ALTV: isHigh ? 65 : isSuspect ? 40 : 12,    // Abnormal long-term variability %
        MLTV: isHigh ? 3.2 : isSuspect ? 7.5 : 12.8,// Mean long-term variability
        Width: isHigh ? 45 : isSuspect ? 85 : 130,  // Histogram width
        Min: isHigh ? 98 : isSuspect ? 110 : 125,   // Histogram min
        Max: isHigh ? 168 : isSuspect ? 172 : 160,  // Histogram max
        Nmax: isHigh ? 2 : isSuspect ? 4 : 7,       // Number of histogram peaks
        Nzeros: isHigh ? 1 : isSuspect ? 0 : 0,     // Number of histogram zeros
        Mode: isHigh ? 135 : isSuspect ? 142 : 140, // Histogram mode
        Mean: isHigh ? 138 : isSuspect ? 145 : 142, // Histogram mean
        Median: isHigh ? 137 : isSuspect ? 143 : 141, // Histogram median
        Variance: isHigh ? 4.2 : isSuspect ? 8.5 : 12.3, // Histogram variance
        Tendency: isHigh ? -1 : isSuspect ? 0 : 1,  // Histogram tendency
    };
};

// Feature importance / SHAP values
export const featureImportance = [
    { feature: 'ASTV', importance: 0.28, description: 'Abnormal Short-Term Variability' },
    { feature: 'DS', importance: 0.22, description: 'Severe Decelerations' },
    { feature: 'ALTV', importance: 0.15, description: 'Abnormal Long-Term Variability' },
    { feature: 'DP', importance: 0.12, description: 'Prolonged Decelerations' },
    { feature: 'LB', importance: 0.08, description: 'Baseline Heart Rate' },
    { feature: 'AC', importance: 0.06, description: 'Accelerations' },
    { feature: 'FM', importance: 0.04, description: 'Fetal Movements' },
    { feature: 'Variance', importance: 0.03, description: 'Heart Rate Variance' },
    { feature: 'Width', importance: 0.02, description: 'Histogram Width' },
];

// Model performance metrics
export const modelMetrics = {
    'LightGBM v2.1': {
        version: 'v2.1',
        date: '2025-10-25',
        balancedAccuracy: 0.89,
        macroF1: 0.88,
        auc: 0.94,
        status: 'active',
        confusionMatrix: {
            normal: { normal: 892, suspect: 45, pathologic: 12 },
            suspect: { normal: 38, suspect: 412, pathologic: 28 },
            pathologic: { normal: 8, suspect: 22, pathologic: 189 },
        },
    },
    'XGBoost v1.4': {
        version: 'v1.4',
        date: '2025-10-20',
        balancedAccuracy: 0.86,
        macroF1: 0.85,
        auc: 0.91,
        status: 'archived',
        confusionMatrix: {
            normal: { normal: 878, suspect: 52, pathologic: 19 },
            suspect: { normal: 45, suspect: 398, pathologic: 35 },
            pathologic: { normal: 12, suspect: 28, pathologic: 179 },
        },
    },
    'CNN-LSTM v1.0': {
        version: 'v1.0',
        date: '2025-10-10',
        balancedAccuracy: 0.85,
        macroF1: 0.84,
        auc: 0.90,
        status: 'archived',
        confusionMatrix: {
            normal: { normal: 865, suspect: 58, pathologic: 26 },
            suspect: { normal: 52, suspect: 385, pathologic: 41 },
            pathologic: { normal: 15, suspect: 32, pathologic: 172 },
        },
    },
};

// Drift monitoring data
export const driftData = [
    { date: '2025-10-01', accuracy: 0.91, predictions: 245 },
    { date: '2025-10-05', accuracy: 0.90, predictions: 312 },
    { date: '2025-10-10', accuracy: 0.89, predictions: 287 },
    { date: '2025-10-15', accuracy: 0.88, predictions: 356 },
    { date: '2025-10-20', accuracy: 0.89, predictions: 298 },
    { date: '2025-10-25', accuracy: 0.90, predictions: 334 },
    { date: '2025-10-30', accuracy: 0.89, predictions: 278 },
];

// Reports data
export const mockReports = [
    {
        id: 'R-001',
        patientId: 'P-09342',
        date: '2025-10-29',
        riskLevel: 'high',
        clinician: 'Dr. Lim',
        modelVersion: 'LightGBM v2.1',
        status: 'completed',
    },
    {
        id: 'R-002',
        patientId: 'P-09343',
        date: '2025-10-29',
        riskLevel: 'normal',
        clinician: 'Dr. Koh',
        modelVersion: 'LightGBM v2.1',
        status: 'completed',
    },
    {
        id: 'R-003',
        patientId: 'P-09344',
        date: '2025-10-28',
        riskLevel: 'high',
        clinician: 'Dr. Lim',
        modelVersion: 'LightGBM v2.1',
        status: 'pending',
    },
    {
        id: 'R-004',
        patientId: 'P-09345',
        date: '2025-10-28',
        riskLevel: 'suspect',
        clinician: 'Dr. Patel',
        modelVersion: 'XGBoost v1.4',
        status: 'completed',
    },
];

// Audit logs
export const auditLogs = [
    {
        timestamp: '2025-10-30 12:04',
        action: 'Predict',
        user: 'Dr. Lim',
        detail: 'Risk=High (Model v2.1)',
        patientId: 'P-09342',
    },
    {
        timestamp: '2025-10-30 11:45',
        action: 'View',
        user: 'Dr. Koh',
        detail: 'Accessed patient record',
        patientId: 'P-09343',
    },
    {
        timestamp: '2025-10-30 10:30',
        action: 'Export',
        user: 'Dr. Lim',
        detail: 'Generated PDF report',
        patientId: 'P-09342',
    },
    {
        timestamp: '2025-10-29 16:22',
        action: 'Login',
        user: 'Dr. Patel',
        detail: 'Successful authentication',
        patientId: null,
    },
    {
        timestamp: '2025-10-29 15:10',
        action: 'Model Update',
        user: 'Admin',
        detail: 'Activated LightGBM v2.1',
        patientId: null,
    },
];

// Prediction function (simulated)
export const getPrediction = (features) => {
    const { ASTV, DS, DP, LB } = features;

    let normalProb = 0.7;
    let suspectProb = 0.2;
    let pathologicProb = 0.1;

    // Adjust based on features
    if (ASTV > 50) {
        normalProb -= 0.3;
        pathologicProb += 0.2;
        suspectProb += 0.1;
    }

    if (DS > 2) {
        normalProb -= 0.3;
        pathologicProb += 0.3;
    }

    if (DP > 1) {
        normalProb -= 0.2;
        pathologicProb += 0.2;
    }

    if (LB > 160 || LB < 110) {
        normalProb -= 0.15;
        suspectProb += 0.1;
        pathologicProb += 0.05;
    }

    // Normalize
    const total = normalProb + suspectProb + pathologicProb;
    normalProb = Math.max(0, normalProb / total);
    suspectProb = Math.max(0, suspectProb / total);
    pathologicProb = Math.max(0, pathologicProb / total);

    // Determine classification
    let classification = 'Normal';
    let riskScore = normalProb;

    if (pathologicProb > normalProb && pathologicProb > suspectProb) {
        classification = 'Pathologic';
        riskScore = pathologicProb;
    } else if (suspectProb > normalProb) {
        classification = 'Suspect';
        riskScore = suspectProb;
    }

    return {
        classification,
        riskScore: Math.round(riskScore * 100) / 100,
        probabilities: {
            Normal: Math.round(normalProb * 100) / 100,
            Suspect: Math.round(suspectProb * 100) / 100,
            Pathologic: Math.round(pathologicProb * 100) / 100,
        },
    };
};
