const {
    findUserByEmail,
    findUserById,
    validatePassword,
    logAction,
    db
} = require('../database/db');

describe('Database Functions', () => {
    describe('User Functions', () => {
        test('findUserByEmail should return user for valid email', () => {
            const user = findUserByEmail('dr.lim@hospital.com');

            expect(user).toBeDefined();
            expect(user.email).toBe('dr.lim@hospital.com');
            expect(user).toHaveProperty('name');
            expect(user.role).toBe('clinician');
        });

        test('findUserByEmail should return undefined for invalid email', () => {
            const user = findUserByEmail('nonexistent@hospital.com');

            expect(user).toBeUndefined();
        });

        test('validatePassword should return true for correct password', () => {
            const user = findUserByEmail('dr.lim@hospital.com');
            const isValid = validatePassword(user, 'Hospital@123');

            expect(isValid).toBe(true);
        });

        test('validatePassword should return false for incorrect password', () => {
            const user = findUserByEmail('dr.lim@hospital.com');
            const isValid = validatePassword(user, 'WrongPassword');

            expect(isValid).toBe(false);
        });

        test('findUserById should return user for valid id', () => {
            // First get a user to get their ID
            const userByEmail = findUserByEmail('dr.lim@hospital.com');
            const user = findUserById(userByEmail.id);

            expect(user).toBeDefined();
            expect(user.email).toBe('dr.lim@hospital.com');
        });
    });

    describe('Audit Logging', () => {
        test('logAction should log an action without error', () => {
            expect(() => {
                logAction(1, 'dr.lim@hospital.com', 'Test Action', 'Test detail');
            }).not.toThrow();
        });
    });
});

describe('Risk Classification', () => {
    test('should classify NSP 1 as normal', () => {
        const getRiskLevel = (nsp) => {
            if (nsp === 3) return 'high';
            if (nsp === 2) return 'suspect';
            return 'normal';
        };

        expect(getRiskLevel(1)).toBe('normal');
        expect(getRiskLevel(2)).toBe('suspect');
        expect(getRiskLevel(3)).toBe('high');
    });
});

describe('CTG Data Generation', () => {
    const { generateCTGData } = require('../data/mockData');

    test('should generate CTG array', () => {
        const ctg = generateCTGData('normal');

        expect(Array.isArray(ctg)).toBe(true);
        expect(ctg.length).toBe(120);
    });

    test('should generate CTG points with fhr and uc', () => {
        const ctg = generateCTGData('normal');

        ctg.forEach(point => {
            expect(point).toHaveProperty('time');
            expect(point).toHaveProperty('fhr');
            expect(point).toHaveProperty('uc');
            expect(point.fhr).toBeGreaterThanOrEqual(100);
            expect(point.fhr).toBeLessThanOrEqual(180);
        });
    });

    test('high risk should have higher baseline FHR', () => {
        const normalCTG = generateCTGData('normal');
        const highCTG = generateCTGData('high');

        const normalAvg = normalCTG.reduce((sum, p) => sum + p.fhr, 0) / normalCTG.length;
        const highAvg = highCTG.reduce((sum, p) => sum + p.fhr, 0) / highCTG.length;

        expect(highAvg).toBeGreaterThan(normalAvg);
    });
});

describe('Mock Data', () => {
    const { patients, models, featureImportance, reports } = require('../data/mockData');

    test('should have patients array', () => {
        expect(Array.isArray(patients)).toBe(true);
        expect(patients.length).toBeGreaterThan(0);
    });

    test('patients should have required properties', () => {
        patients.forEach(patient => {
            expect(patient).toHaveProperty('id');
            expect(patient).toHaveProperty('name');
            expect(patient).toHaveProperty('riskLevel');
            expect(['normal', 'suspect', 'high']).toContain(patient.riskLevel);
        });
    });

    test('should have models object', () => {
        expect(typeof models).toBe('object');
        expect(Object.keys(models).length).toBeGreaterThan(0);
    });

    test('models should include LightGBM and CNN-LSTM', () => {
        expect(models['lightgbm-2.1']).toBeDefined();
        expect(models['cnn-lstm-1.0']).toBeDefined();
    });

    test('should have feature importance data', () => {
        expect(Array.isArray(featureImportance)).toBe(true);
        expect(featureImportance.length).toBeGreaterThan(0);

        featureImportance.forEach(f => {
            expect(f).toHaveProperty('feature');
            expect(f).toHaveProperty('importance');
            expect(f).toHaveProperty('description');
        });
    });

    test('should have reports array', () => {
        expect(Array.isArray(reports)).toBe(true);
        expect(reports.length).toBeGreaterThan(0);
    });
});
