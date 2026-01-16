const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, 'users.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'clinician',
    department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reset_token TEXT,
    reset_token_expires DATETIME
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_email TEXT,
    action TEXT NOT NULL,
    detail TEXT,
    patient_id TEXT,
    ip_address TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed default users if table is empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();

if (userCount.count === 0) {
    const defaultUsers = [
        { email: 'dr.lim@hospital.com', name: 'Dr. Lim', password: 'Hospital@123', role: 'clinician', department: 'Obstetrics' },
        { email: 'dr.koh@hospital.com', name: 'Dr. Koh', password: 'Hospital@123', role: 'clinician', department: 'Obstetrics' },
        { email: 'dr.patel@hospital.com', name: 'Dr. Patel', password: 'Hospital@123', role: 'clinician', department: 'Obstetrics' },
        { email: 'admin@hospital.com', name: 'Admin User', password: 'Admin@123', role: 'admin', department: 'IT' },
    ];

    const insertUser = db.prepare(`
    INSERT INTO users (email, name, password_hash, role, department)
    VALUES (?, ?, ?, ?, ?)
  `);

    for (const user of defaultUsers) {
        const hash = bcrypt.hashSync(user.password, 10);
        insertUser.run(user.email, user.name, hash, user.role, user.department);
    }

    console.log('Default users seeded successfully');
}

// User functions
const findUserByEmail = (email) => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
};

const findUserById = (id) => {
    return db.prepare('SELECT id, email, name, role, department, created_at FROM users WHERE id = ?').get(id);
};

const validatePassword = (user, password) => {
    return bcrypt.compareSync(password, user.password_hash);
};

const updatePassword = (userId, newPassword) => {
    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, userId);
};

const setResetToken = (email, token, expiresAt) => {
    db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?').run(token, expiresAt, email.toLowerCase());
};

const findByResetToken = (token) => {
    return db.prepare('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > datetime("now")').get(token);
};

const clearResetToken = (userId) => {
    db.prepare('UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?').run(userId);
};

const getAllUsers = () => {
    return db.prepare('SELECT id, email, name, role, department, created_at FROM users').all();
};

const createUser = (email, name, password, role, department) => {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (email, name, password_hash, role, department) VALUES (?, ?, ?, ?, ?)').run(email.toLowerCase(), name, hash, role, department);
    return result.lastInsertRowid;
};

const updateUser = (id, data) => {
    const { name, role, department } = data;
    db.prepare('UPDATE users SET name = ?, role = ?, department = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, role, department, id);
};

const deleteUser = (id) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
};

// Audit log functions
const logAction = (userId, userEmail, action, detail, patientId = null, ipAddress = null) => {
    db.prepare('INSERT INTO audit_logs (user_id, user_email, action, detail, patient_id, ip_address) VALUES (?, ?, ?, ?, ?, ?)').run(userId, userEmail, action, detail, patientId, ipAddress);
};

const getAuditLogs = (limit = 100, filters = {}) => {
    let query = 'SELECT * FROM audit_logs';
    const params = [];
    const conditions = [];

    if (filters.action) {
        conditions.push('action = ?');
        params.push(filters.action);
    }
    if (filters.user_email) {
        conditions.push('user_email = ?');
        params.push(filters.user_email);
    }
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    return db.prepare(query).all(...params);
};

// Session functions
const createSession = (userId, token, expiresAt) => {
    db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(userId, token, expiresAt);
};

const findSession = (token) => {
    return db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")').get(token);
};

const deleteSession = (token) => {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
};

const deleteUserSessions = (userId) => {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
};

module.exports = {
    db,
    findUserByEmail,
    findUserById,
    validatePassword,
    updatePassword,
    setResetToken,
    findByResetToken,
    clearResetToken,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    logAction,
    getAuditLogs,
    createSession,
    findSession,
    deleteSession,
    deleteUserSessions,
};
