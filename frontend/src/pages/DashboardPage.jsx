import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getRiskBadge } from '../components/ui/Badge';
import UploadData from '../components/UploadData';
import { patientAPI, predictionAPI, adminAPI } from '../services/api';
import { useAlerts } from '../hooks/useSocket';
import './DashboardPage.css';

const DashboardPage = () => {
    const [stats, setStats] = useState({
        totalPatients: 0,
        highRisk: 0,
        suspect: 0,
        normal: 0,
    });
    const [recentPatients, setRecentPatients] = useState([]);
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const { alerts } = useAlerts();
    const navigate = useNavigate();

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load patients
            const patientsRes = await patientAPI.getAll();
            const patients = patientsRes.data;

            // Calculate stats
            setStats({
                totalPatients: patients.length,
                highRisk: patients.filter(p => p.riskLevel === 'high').length,
                suspect: patients.filter(p => p.riskLevel === 'suspect').length,
                normal: patients.filter(p => p.riskLevel === 'normal').length,
            });

            // Recent patients (last 5)
            setRecentPatients(patients.slice(0, 5));

            // Load models
            const modelsRes = await predictionAPI.getModels();
            setModels(modelsRes.data);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const activeModel = models.find(m => m.status === 'active');

    return (
        <Layout>
            <div className="page dashboard-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Clinical Dashboard</h1>
                        <p className="page-subtitle">Real-time overview of patient monitoring</p>
                    </div>
                    <div className="header-actions">
                        <UploadData onUploadComplete={loadDashboardData} />
                        <Button variant="primary" onClick={() => navigate('/patients')}>
                            View All Patients →
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <Card className="stat-card" onClick={() => navigate('/patients')}>
                        <div className="stat-content">
                            <div className="stat-icon-wrapper total">
                                <span className="stat-icon">👥</span>
                            </div>
                            <div className="stat-value">{stats.totalPatients}</div>
                            <div className="stat-label">Total Patients</div>
                        </div>
                    </Card>
                    <Card className="stat-card stat-critical" onClick={() => navigate('/patients?risk=high')}>
                        <div className="stat-content">
                            <div className="stat-icon-wrapper critical">
                                <span className="stat-icon">⚠️</span>
                            </div>
                            <div className="stat-value">{stats.highRisk}</div>
                            <div className="stat-label">High Risk</div>
                        </div>
                    </Card>
                    <Card className="stat-card stat-warning" onClick={() => navigate('/patients?risk=suspect')}>
                        <div className="stat-content">
                            <div className="stat-icon-wrapper warning">
                                <span className="stat-icon">⚡</span>
                            </div>
                            <div className="stat-value">{stats.suspect}</div>
                            <div className="stat-label">Suspect</div>
                        </div>
                    </Card>
                    <Card className="stat-card stat-success" onClick={() => navigate('/patients?risk=normal')}>
                        <div className="stat-content">
                            <div className="stat-icon-wrapper success">
                                <span className="stat-icon">✓</span>
                            </div>
                            <div className="stat-value">{stats.normal}</div>
                            <div className="stat-label">Normal</div>
                        </div>
                    </Card>
                </div>

                <div className="dashboard-grid">
                    {/* Recent Alerts */}
                    <Card title="Recent Alerts" className="alerts-card">
                        {alerts.length > 0 ? (
                            <div className="alerts-list">
                                {alerts.slice(0, 5).map((alert, i) => (
                                    <div key={i} className={`alert-item alert-${alert.severity}`}>
                                        <span className="alert-time">
                                            {new Date(alert.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className="alert-message">{alert.message}</span>
                                        {alert.patientId && (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => navigate(`/patients/${alert.patientId}`)}
                                            >
                                                View →
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-alerts">
                                <span className="no-alerts-icon">✓</span>
                                <span>No active alerts</span>
                            </div>
                        )}
                    </Card>

                    {/* Recent Patients */}
                    <Card title="Recent Patients" headerAction={
                        <Button variant="link" size="sm" onClick={() => navigate('/patients')}>
                            View All
                        </Button>
                    }>
                        <div className="recent-patients">
                            {recentPatients.map(patient => (
                                <div
                                    key={patient.id}
                                    className="patient-row"
                                    onClick={() => navigate(`/patients/${patient.id}`)}
                                >
                                    <div className="patient-info">
                                        <span className="patient-id">{patient.id}</span>
                                        <span className="patient-name">{patient.name}</span>
                                    </div>
                                    <div className="patient-meta">
                                        <span className="patient-room">Room {patient.room}</span>
                                        {getRiskBadge(patient.riskLevel)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Active Model */}
                    <Card title="Active AI Model">
                        {activeModel ? (
                            <div className="model-info">
                                <div className="model-header">
                                    <span className="model-name">{activeModel.name}</span>
                                    <span className="model-version">{activeModel.version}</span>
                                </div>
                                <div className="model-type">{activeModel.type}</div>
                                <div className="model-metrics">
                                    <div className="metric">
                                        <span className="metric-value">{(activeModel.balancedAccuracy * 100).toFixed(0)}%</span>
                                        <span className="metric-label">Accuracy</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-value">{(activeModel.auc * 100).toFixed(0)}%</span>
                                        <span className="metric-label">AUC</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-value">{(activeModel.macroF1 * 100).toFixed(0)}%</span>
                                        <span className="metric-label">F1</span>
                                    </div>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => navigate('/models')}
                                    className="model-link"
                                >
                                    View All Models
                                </Button>
                            </div>
                        ) : (
                            <div className="no-model">No active model</div>
                        )}
                    </Card>

                    {/* Quick Actions */}
                    <Card title="Quick Actions">
                        <div className="quick-actions">
                            <Button variant="secondary" onClick={() => navigate('/patients')}>
                                📋 Patient List
                            </Button>
                            <Button variant="secondary" onClick={() => navigate('/reports')}>
                                📄 Generate Report
                            </Button>
                            <Button variant="secondary" onClick={() => navigate('/models')}>
                                🤖 Model Analytics
                            </Button>
                            <Button variant="secondary" onClick={() => navigate('/explain')}>
                                🔍 Explainability
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default DashboardPage;
