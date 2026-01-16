import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';
import { adminAPI, predictionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AdminPage.css';

const AdminPage = () => {
    const { user, isAdmin } = useAuth();
    const [models, setModels] = useState([]);
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({ email: '', name: '', password: '', role: 'clinician', department: '' });

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        try {
            const [modelsRes, usersRes, logsRes, statsRes] = await Promise.all([
                predictionAPI.getModels(),
                adminAPI.getUsers(),
                adminAPI.getAuditLogs(),
                adminAPI.getStats(),
            ]);

            setModels(modelsRes.data);
            setUsers(usersRes.data);
            setAuditLogs(logsRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Failed to load admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        try {
            await adminAPI.createUser(userForm);
            setShowUserModal(false);
            setUserForm({ email: '', name: '', password: '', role: 'clinician', department: '' });
            loadAdminData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create user');
        }
    };

    const handleUpdateUser = async () => {
        try {
            await adminAPI.updateUser(editingUser.id, userForm);
            setShowUserModal(false);
            setEditingUser(null);
            loadAdminData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await adminAPI.deleteUser(userId);
            loadAdminData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete user');
        }
    };

    const handleModelStatusChange = async (modelId, newStatus) => {
        try {
            await adminAPI.updateModelStatus(modelId, newStatus);
            loadAdminData();
        } catch (err) {
            alert('Failed to update model status');
        }
    };

    const openEditModal = (userToEdit) => {
        setEditingUser(userToEdit);
        setUserForm({
            email: userToEdit.email,
            name: userToEdit.name,
            password: '',
            role: userToEdit.role,
            department: userToEdit.department || '',
        });
        setShowUserModal(true);
    };

    const modelColumns = [
        { key: 'name', label: 'Model' },
        { key: 'type', label: 'Type' },
        { key: 'version', label: 'Version' },
        { key: 'balancedAccuracy', label: 'Accuracy', render: (v) => `${(v * 100).toFixed(1)}%` },
        { key: 'auc', label: 'AUC', render: (v) => `${(v * 100).toFixed(1)}%` },
        {
            key: 'status', label: 'Status', render: (v) => (
                <span className={`status-badge status-${v}`}>{v}</span>
            )
        },
        {
            key: 'actions', label: '', render: (_, row) => (
                <div className="action-buttons">
                    {row.status === 'active' ? (
                        <Button variant="ghost" size="sm" onClick={() => handleModelStatusChange(row.id, 'archived')}>
                            Deactivate
                        </Button>
                    ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleModelStatusChange(row.id, 'active')}>
                            Activate
                        </Button>
                    )}
                </div>
            )
        },
    ];

    const userColumns = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        {
            key: 'role', label: 'Role', render: (v) => (
                <span className={`role-badge role-${v}`}>{v}</span>
            )
        },
        { key: 'department', label: 'Department' },
        {
            key: 'actions', label: '', render: (_, row) => (
                <div className="action-buttons">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(row.id)}>Delete</Button>
                </div>
            )
        },
    ];

    const logColumns = [
        { key: 'timestamp', label: 'Time' },
        {
            key: 'action', label: 'Action', render: (v) => (
                <span className={`action-tag action-${v.toLowerCase().replace(' ', '-')}`}>{v}</span>
            )
        },
        { key: 'user_email', label: 'User' },
        { key: 'detail', label: 'Detail' },
        { key: 'patient_id', label: 'Patient', render: (v) => v || '-' },
    ];

    const tabs = [
        {
            id: 'overview',
            label: 'Overview',
            content: (
                <div className="admin-overview">
                    <div className="overview-stats">
                        <Card className="overview-stat">
                            <div className="stat-value">{stats.totalUsers || 0}</div>
                            <div className="stat-label">Total Users</div>
                        </Card>
                        <Card className="overview-stat">
                            <div className="stat-value">{stats.clinicianCount || 0}</div>
                            <div className="stat-label">Clinicians</div>
                        </Card>
                        <Card className="overview-stat">
                            <div className="stat-value">{stats.adminCount || 0}</div>
                            <div className="stat-label">Admins</div>
                        </Card>
                        <Card className="overview-stat">
                            <div className="stat-value">{stats.totalActions || 0}</div>
                            <div className="stat-label">Total Actions</div>
                        </Card>
                        <Card className="overview-stat">
                            <div className="stat-value">{stats.predictionCount || 0}</div>
                            <div className="stat-label">Predictions</div>
                        </Card>
                        <Card className="overview-stat">
                            <div className="stat-value">{models.filter(m => m.status === 'active').length}</div>
                            <div className="stat-label">Active Models</div>
                        </Card>
                    </div>
                </div>
            ),
        },
        {
            id: 'models',
            label: 'Model Registry',
            content: (
                <div className="tab-models">
                    <div className="section-header">
                        <h3>Registered Models</h3>
                    </div>
                    <Table columns={modelColumns} data={models} loading={loading} />
                </div>
            ),
        },
        {
            id: 'users',
            label: 'User Management',
            content: (
                <div className="tab-users">
                    <div className="section-header">
                        <h3>System Users</h3>
                        <Button variant="primary" size="sm" onClick={() => {
                            setEditingUser(null);
                            setUserForm({ email: '', name: '', password: '', role: 'clinician', department: '' });
                            setShowUserModal(true);
                        }}>
                            Add User
                        </Button>
                    </div>
                    <Table columns={userColumns} data={users} loading={loading} />
                </div>
            ),
        },
        {
            id: 'audit',
            label: 'Audit Logs',
            content: (
                <div className="tab-audit">
                    <div className="section-header">
                        <h3>System Activity</h3>
                        <Button variant="secondary" size="sm">Export Logs</Button>
                    </div>
                    <Table columns={logColumns} data={auditLogs} loading={loading} />
                </div>
            ),
        },
        {
            id: 'settings',
            label: 'Settings',
            content: (
                <div className="tab-settings">
                    <Card title="System Configuration">
                        <div className="settings-list">
                            <div className="setting-item">
                                <div className="setting-info">
                                    <div className="setting-name">Auto-prediction threshold</div>
                                    <div className="setting-desc">Minimum confidence score for alerts</div>
                                </div>
                                <div className="setting-value">0.85</div>
                            </div>
                            <div className="setting-item">
                                <div className="setting-info">
                                    <div className="setting-name">Session timeout</div>
                                    <div className="setting-desc">Time before inactive logout</div>
                                </div>
                                <div className="setting-value">24 hours</div>
                            </div>
                            <div className="setting-item">
                                <div className="setting-info">
                                    <div className="setting-name">Data retention</div>
                                    <div className="setting-desc">CTG data storage period</div>
                                </div>
                                <div className="setting-value">90 days</div>
                            </div>
                        </div>
                    </Card>
                </div>
            ),
        },
    ];

    return (
        <Layout>
            <div className="page admin-page">
                <div className="page-header">
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="page-subtitle">System administration and compliance</p>
                </div>

                <Tabs tabs={tabs} defaultTab="overview" />

                {/* User Modal */}
                <Modal
                    isOpen={showUserModal}
                    onClose={() => setShowUserModal(false)}
                    title={editingUser ? 'Edit User' : 'Add New User'}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setShowUserModal(false)}>Cancel</Button>
                            <Button variant="primary" onClick={editingUser ? handleUpdateUser : handleCreateUser}>
                                {editingUser ? 'Update' : 'Create'}
                            </Button>
                        </>
                    }
                >
                    <div className="user-form">
                        <Input
                            label="Email"
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                            disabled={!!editingUser}
                        />
                        <Input
                            label="Name"
                            value={userForm.name}
                            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        />
                        {!editingUser && (
                            <Input
                                label="Password"
                                type="password"
                                value={userForm.password}
                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            />
                        )}
                        <Select
                            label="Role"
                            value={userForm.role}
                            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                            options={[
                                { value: 'clinician', label: 'Clinician' },
                                { value: 'admin', label: 'Administrator' },
                            ]}
                        />
                        <Input
                            label="Department"
                            value={userForm.department}
                            onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                        />
                    </div>
                </Modal>
            </div>
        </Layout>
    );
};

export default AdminPage;
