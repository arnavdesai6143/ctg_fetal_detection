// Mock Data for CTG Insight Backend

const patients = [
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
const generateCTGData = (riskLevel = 'normal') => {
    const data = [];
    const baseHR = riskLevel === 'high' ? 170 : riskLevel === 'suspect' ? 155 : 140;
    const variability = riskLevel === 'high' ? 5 : riskLevel === 'suspect' ? 12 : 20;

    for (let i = 0; i < 120; i++) {
        const noise = (Math.random() - 0.5) * variability;
        let acceleration = 0, deceleration = 0;

        if (riskLevel !== 'high' && Math.random() > 0.92) acceleration = Math.random() * 15 + 10;
        if (riskLevel !== 'normal' && Math.random() > 0.95) deceleration = Math.random() * 20 + 15;

        const fhr = Math.max(100, Math.min(180, baseHR + noise + acceleration - deceleration));
        const contractionPhase = (i % 30) / 30;
        const uc = 20 + Math.sin(contractionPhase * Math.PI * 2) * 40 + (Math.random() - 0.5) * 10;

        data.push({
            time: i,
            fhr: Math.round(fhr),
            uc: Math.round(Math.max(0, uc)),
            hasAcceleration: acceleration > 0,
            hasDeceleration: deceleration > 0,
        });
    }
    return data;
};

// Extended ML Models Registry
const models = {
    'lightgbm-2.1': {
        id: 'lightgbm-2.1',
        name: 'LightGBM',
        type: 'Gradient Boosting',
        version: 'v2.1',
        date: '2025-10-25',
        balancedAccuracy: 0.89,
        macroF1: 0.88,
        auc: 0.94,
        precision: 0.87,
        recall: 0.88,
        specificity: 0.91,
        status: 'evaluation',
        description: 'High-performance gradient boosting model optimized for CTG analysis',
        trainingSize: 2126,
        features: ['LB', 'AC', 'FM', 'UC', 'ASTV', 'MSTV', 'ALTV', 'MLTV', 'DL', 'DS', 'DP'],
    },
    'xgboost-1.4': {
        id: 'xgboost-1.4',
        name: 'XGBoost',
        type: 'Gradient Boosting',
        version: 'v1.4',
        date: '2025-10-20',
        balancedAccuracy: 0.86,
        macroF1: 0.85,
        auc: 0.91,
        precision: 0.84,
        recall: 0.85,
        specificity: 0.88,
        status: 'archived',
        description: 'Extreme gradient boosting classifier with regularization',
        trainingSize: 2126,
        features: ['LB', 'AC', 'FM', 'UC', 'ASTV', 'MSTV', 'ALTV', 'MLTV', 'DL', 'DS', 'DP'],
    },
    'random-forest-1.0': {
        id: 'random-forest-1.0',
        name: 'Random Forest',
        type: 'Ensemble Learning',
        version: 'v1.0',
        date: '2025-10-15',
        balancedAccuracy: 0.84,
        macroF1: 0.83,
        auc: 0.89,
        precision: 0.82,
        recall: 0.83,
        specificity: 0.86,
        status: 'archived',
        description: 'Ensemble of decision trees for robust classification',
        trainingSize: 2126,
        features: ['LB', 'AC', 'FM', 'UC', 'ASTV', 'MSTV', 'ALTV', 'MLTV', 'DL', 'DS', 'DP'],
    },
    'gradient-boosting-1.0': {
        id: 'gradient-boosting-1.0',
        name: 'Gradient Boosting',
        type: 'Gradient Boosting',
        version: 'v1.0',
        date: '2025-10-10',
        balancedAccuracy: 0.85,
        macroF1: 0.84,
        auc: 0.90,
        precision: 0.83,
        recall: 0.84,
        specificity: 0.87,
        status: 'archived',
        description: 'Standard gradient boosting classifier',
        trainingSize: 2126,
        features: ['LB', 'AC', 'FM', 'UC', 'ASTV', 'MSTV', 'ALTV', 'MLTV', 'DL', 'DS', 'DP'],
    },
    'cnn-lstm-1.0': {
        id: 'cnn-lstm-1.0',
        name: 'CNN-LSTM',
        type: 'Deep Learning',
        version: 'v1.0',
        date: '2025-10-28',
        balancedAccuracy: 0.91,
        macroF1: 0.90,
        auc: 0.96,
        precision: 0.89,
        recall: 0.90,
        specificity: 0.93,
        status: 'active',
        description: 'Deep learning model combining CNN for feature extraction and LSTM for temporal patterns',
        trainingSize: 2126,
        features: ['Raw CTG Signal', 'LB', 'Variability', 'Accelerations', 'Decelerations'],
    },
    'logistic-regression-1.0': {
        id: 'logistic-regression-1.0',
        name: 'Logistic Regression',
        type: 'Linear Model',
        version: 'v1.0',
        date: '2025-09-01',
        balancedAccuracy: 0.78,
        macroF1: 0.76,
        auc: 0.82,
        precision: 0.75,
        recall: 0.76,
        specificity: 0.80,
        status: 'archived',
        description: 'Baseline linear classifier for interpretability',
        trainingSize: 2126,
        features: ['LB', 'AC', 'FM', 'UC', 'ASTV', 'MSTV', 'ALTV', 'MLTV', 'DL', 'DS', 'DP'],
    },
    'svm-1.0': {
        id: 'svm-1.0',
        name: 'Support Vector Machine',
        type: 'Kernel Method',
        version: 'v1.0',
        date: '2025-09-15',
        balancedAccuracy: 0.82,
        macroF1: 0.81,
        auc: 0.87,
        precision: 0.80,
        recall: 0.81,
        specificity: 0.84,
        status: 'archived',
        description: 'SVM with RBF kernel for non-linear classification',
        trainingSize: 2126,
        features: ['LB', 'AC', 'FM', 'UC', 'ASTV', 'MSTV', 'ALTV', 'MLTV', 'DL', 'DS', 'DP'],
    },
};

// Feature importance data
const featureImportance = [
    { feature: 'ASTV', importance: 0.28, description: 'Abnormal Short Term Variability' },
    { feature: 'DS', importance: 0.22, description: 'Number of Severe Decelerations' },
    { feature: 'ALTV', importance: 0.15, description: 'Abnormal Long Term Variability' },
    { feature: 'DP', importance: 0.12, description: 'Number of Prolonged Decelerations' },
    { feature: 'LB', importance: 0.08, description: 'Baseline Fetal Heart Rate' },
    { feature: 'AC', importance: 0.06, description: 'Number of Accelerations' },
    { feature: 'DL', importance: 0.04, description: 'Number of Light Decelerations' },
    { feature: 'MSTV', importance: 0.03, description: 'Mean Short Term Variability' },
    { feature: 'MLTV', importance: 0.015, description: 'Mean Long Term Variability' },
    { feature: 'UC', importance: 0.005, description: 'Uterine Contractions' },
];

// Drift monitoring data
const driftData = [
    { date: '2025-10-24', accuracy: 0.88, predictions: 45 },
    { date: '2025-10-25', accuracy: 0.89, predictions: 52 },
    { date: '2025-10-26', accuracy: 0.87, predictions: 38 },
    { date: '2025-10-27', accuracy: 0.90, predictions: 61 },
    { date: '2025-10-28', accuracy: 0.89, predictions: 55 },
    { date: '2025-10-29', accuracy: 0.91, predictions: 48 },
    { date: '2025-10-30', accuracy: 0.88, predictions: 42 },
];

const reports = [
    { id: 'R-001', patientId: 'P-09342', date: '2025-10-29', riskLevel: 'high', clinician: 'Dr. Lim', modelVersion: 'LightGBM v2.1', status: 'completed' },
    { id: 'R-002', patientId: 'P-09343', date: '2025-10-29', riskLevel: 'normal', clinician: 'Dr. Koh', modelVersion: 'LightGBM v2.1', status: 'completed' },
    { id: 'R-003', patientId: 'P-09344', date: '2025-10-28', riskLevel: 'high', clinician: 'Dr. Lim', modelVersion: 'LightGBM v2.1', status: 'pending' },
    { id: 'R-004', patientId: 'P-09345', date: '2025-10-30', riskLevel: 'suspect', clinician: 'Dr. Patel', modelVersion: 'CNN-LSTM v1.0', status: 'completed' },
    { id: 'R-005', patientId: 'P-09346', date: '2025-10-30', riskLevel: 'normal', clinician: 'Dr. Koh', modelVersion: 'LightGBM v2.1', status: 'completed' },
];

module.exports = { patients, generateCTGData, models, featureImportance, driftData, reports };
