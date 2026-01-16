const request = require('supertest');
const express = require('express');

// Create a test app instance
const createTestApp = () => {
    const app = express();
    app.use(express.json());

    // Import routes
    const patientsRouter = require('../routes/patients');
    const modelsRouter = require('../routes/models');
    const authRouter = require('../routes/auth');

    app.use('/api/patients', patientsRouter);
    app.use('/api/models', modelsRouter);
    app.use('/api/auth', authRouter);

    return app;
};

describe('Patients API', () => {
    let app;

    beforeAll(() => {
        app = createTestApp();
    });

    test('GET /api/patients should return array of patients', async () => {
        const response = await request(app).get('/api/patients');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });

    test('GET /api/patients/:id should return a patient', async () => {
        const response = await request(app).get('/api/patients/P-09342');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', 'P-09342');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('riskLevel');
    });

    test('GET /api/patients/:id should return 404 for non-existent patient', async () => {
        const response = await request(app).get('/api/patients/P-99999');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
    });

    test('GET /api/patients/:id/ctg should return CTG data', async () => {
        const response = await request(app).get('/api/patients/P-09342/ctg');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('fhr');
        expect(response.body[0]).toHaveProperty('uc');
    });
});

describe('Models API', () => {
    let app;

    beforeAll(() => {
        app = createTestApp();
    });

    test('GET /api/models should return array of models', async () => {
        const response = await request(app).get('/api/models');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });

    test('GET /api/models should include LightGBM model', async () => {
        const response = await request(app).get('/api/models');

        const lightgbm = response.body.find(m => m.name === 'LightGBM');
        expect(lightgbm).toBeDefined();
        expect(lightgbm).toHaveProperty('balancedAccuracy');
        expect(lightgbm).toHaveProperty('auc');
    });

    test('GET /api/models/active should return only active models', async () => {
        const response = await request(app).get('/api/models/active');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach(model => {
            expect(model.status).toBe('active');
        });
    });

    test('GET /api/models/:id should return a specific model', async () => {
        const response = await request(app).get('/api/models/lightgbm-2.1');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('name', 'LightGBM');
        expect(response.body).toHaveProperty('version', 'v2.1');
    });

    test('GET /api/models/:id/metrics should return model metrics', async () => {
        const response = await request(app).get('/api/models/lightgbm-2.1/metrics');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('confusionMatrix');
        expect(response.body).toHaveProperty('featureImportance');
        expect(response.body).toHaveProperty('driftData');
    });
});

describe('Auth API', () => {
    let app;

    beforeAll(() => {
        app = createTestApp();
    });

    test('POST /api/auth/login with valid credentials should return token', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'dr.lim@hospital.com', password: 'Hospital@123' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('email', 'dr.lim@hospital.com');
    });

    test('POST /api/auth/login with invalid credentials should return 401', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'dr.lim@hospital.com', password: 'wrongpassword' });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
    });

    test('POST /api/auth/login with non-existent user should return 401', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@hospital.com', password: 'Password@123' });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
    });
});
