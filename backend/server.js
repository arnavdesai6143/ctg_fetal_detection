const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const PORT = process.env.PORT || 5001;

// Create HTTP server and Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());

// Import routes
const patientsRouter = require('./routes/patients');
const predictRouter = require('./routes/predict');
const modelsRouter = require('./routes/models');
const reportsRouter = require('./routes/reports');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const uploadRouter = require('./routes/upload');

// Auth middleware
const { authenticateToken } = authRouter;

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/patients', patientsRouter);
app.use('/api/predict', predictRouter);
app.use('/api/models', modelsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'CTG Insight API',
        version: '2.1',
        endpoints: [
            '/api/patients',
            '/api/predict',
            '/api/models',
            '/api/reports',
            '/api/auth',
            '/api/admin',
            '/api/health'
        ]
    });
});

// ==========================================
// WebSocket - Real-time CTG Streaming
// ==========================================
const { generateCTGData } = require('./data/mockData');

// Store active patient streams
const activeStreams = new Map();

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Subscribe to patient CTG stream
    socket.on('subscribe-patient', (patientId) => {
        console.log(`Client ${socket.id} subscribed to patient ${patientId}`);
        socket.join(`patient-${patientId}`);

        // Start streaming if not already active
        if (!activeStreams.has(patientId)) {
            const interval = setInterval(() => {
                const ctgPoint = generateRealtimeCTGPoint(patientId);
                io.to(`patient-${patientId}`).emit('ctg-update', ctgPoint);
            }, 1000); // Send update every second

            activeStreams.set(patientId, interval);
        }
    });

    // Unsubscribe from patient
    socket.on('unsubscribe-patient', (patientId) => {
        socket.leave(`patient-${patientId}`);

        // Check if any clients still subscribed
        const room = io.sockets.adapter.rooms.get(`patient-${patientId}`);
        if (!room || room.size === 0) {
            clearInterval(activeStreams.get(patientId));
            activeStreams.delete(patientId);
        }
    });

    // Patient status alert
    socket.on('patient-alert', (data) => {
        io.emit('alert', {
            type: 'patient',
            patientId: data.patientId,
            message: data.message,
            severity: data.severity,
            timestamp: new Date().toISOString(),
        });
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Generate real-time CTG point
let timeCounter = {};
function generateRealtimeCTGPoint(patientId) {
    if (!timeCounter[patientId]) timeCounter[patientId] = 0;
    const time = timeCounter[patientId]++;

    // Get patient risk level
    const { patients } = require('./data/mockData');
    const patient = patients.find(p => p.id === patientId);
    const riskLevel = patient?.riskLevel || 'normal';

    const baseHR = riskLevel === 'high' ? 170 : riskLevel === 'suspect' ? 155 : 140;
    const variability = riskLevel === 'high' ? 5 : riskLevel === 'suspect' ? 12 : 20;
    const noise = (Math.random() - 0.5) * variability;

    let acceleration = 0, deceleration = 0;
    if (riskLevel !== 'high' && Math.random() > 0.92) acceleration = Math.random() * 15 + 10;
    if (riskLevel !== 'normal' && Math.random() > 0.95) deceleration = Math.random() * 20 + 15;

    const fhr = Math.max(100, Math.min(180, baseHR + noise + acceleration - deceleration));
    const contractionPhase = (time % 30) / 30;
    const uc = 20 + Math.sin(contractionPhase * Math.PI * 2) * 40 + (Math.random() - 0.5) * 10;

    return {
        time,
        fhr: Math.round(fhr),
        uc: Math.round(Math.max(0, uc)),
        hasAcceleration: acceleration > 0,
        hasDeceleration: deceleration > 0,
        timestamp: new Date().toISOString(),
    };
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(PORT, () => {
    console.log(`CTG Insight API running on http://localhost:${PORT}`);
    console.log(`WebSocket server ready for connections`);
});
