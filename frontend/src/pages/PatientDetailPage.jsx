import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import { TextArea } from '../components/ui/Input';
import { getRiskBadge } from '../components/ui/Badge';
import CTGChart from '../components/charts/CTGChart';
import RiskGauge from '../components/charts/RiskGauge';
import FeatureImportanceChart from '../components/charts/FeatureImportanceChart';
import {
    mockPatients,
    generateCTGData,
    generateCTGFeatures,
    getPrediction,
    featureImportance,
} from '../services/mockData';
import './PatientDetailPage.css';

const PatientDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [ctgData, setCTGData] = useState([]);
    const [features, setFeatures] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const foundPatient = mockPatients.find(p => p.id === id);
        if (foundPatient) {
            setPatient(foundPatient);
            setCTGData(generateCTGData(foundPatient.id, foundPatient.riskLevel));
            const feats = generateCTGFeatures(foundPatient.riskLevel);
            setFeatures(feats);
            setPrediction(getPrediction(feats));
        }
    }, [id]);

    if (!patient) {
        return (
            <Layout>
                <div className="page">
                    <Card>
                        <div className="no-patient">Patient not found</div>
                    </Card>
                </div>
            </Layout>
        );
    }

    const tabs = [
        {
            id: 'ctg',
            label: 'CTG Trends',
            content: (
                <div className="tab-ctg">
                    <CTGChart data={ctgData} height={300} />

                    <div className="ctg-events">
                        <h4>Event Summary</h4>
                        <div className="events-grid">
                            <div className="event-item">
                                <span className="event-count">{ctgData.filter(d => d.hasAcceleration).length}</span>
                                <span className="event-label">Accelerations</span>
                            </div>
                            <div className="event-item">
                                <span className="event-count danger">{ctgData.filter(d => d.hasDeceleration).length}</span>
                                <span className="event-label">Decelerations</span>
                            </div>
                            <div className="event-item">
                                <span className="event-count">{features?.LB || '--'}</span>
                                <span className="event-label">Baseline (bpm)</span>
                            </div>
                            <div className="event-item">
                                <span className="event-count">{features?.ASTV || '--'}%</span>
                                <span className="event-label">ASTV</span>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'ai',
            label: 'AI Risk Analysis',
            content: (
                <div className="tab-ai">
                    <div className="ai-grid">
                        <div className="ai-gauge">
                            {prediction && (
                                <RiskGauge
                                    score={prediction.riskScore}
                                    classification={prediction.classification}
                                    probabilities={prediction.probabilities}
                                    size="lg"
                                />
                            )}
                        </div>

                        <div className="ai-features">
                            <FeatureImportanceChart
                                data={featureImportance}
                                height={280}
                                title="SHAP Feature Importance"
                            />
                        </div>
                    </div>

                    <Card className="ai-interpretation">
                        <h4>Interpretation Guide</h4>
                        <ul className="interpretation-list">
                            <li><strong>ASTV ↑</strong> - Erratic short-term variability may indicate fetal distress</li>
                            <li><strong>DS ↑</strong> - Frequent severe decelerations are a warning sign</li>
                            <li><strong>DP ↑</strong> - Prolonged decelerations require immediate attention</li>
                            <li><strong>Low AC</strong> - Absence of accelerations may indicate reduced fetal activity</li>
                        </ul>
                    </Card>
                </div>
            ),
        },
        {
            id: 'notes',
            label: 'Clinical Notes',
            content: (
                <div className="tab-notes">
                    <TextArea
                        label="Clinical Notes"
                        placeholder="Enter clinical observations, notes, and recommendations..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={10}
                    />
                    <div className="notes-actions">
                        <Button variant="primary" onClick={() => alert('Notes saved!')}>
                            Save Notes
                        </Button>
                        <Button variant="secondary">
                            Export to PDF
                        </Button>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <Layout>
            <div className="page patient-detail-page">
                {/* Patient Header */}
                <div className="patient-header">
                    <div className="header-left">
                        <button className="back-button" onClick={() => navigate(-1)}>
                            ← Back
                        </button>
                        <div className="header-info">
                            <h1>Patient {patient.id}</h1>
                            <div className="header-meta">
                                <span>Age: {patient.age}</span>
                                <span>GA: {patient.gestationalAge}w</span>
                                <span>Room {patient.room}</span>
                                {getRiskBadge(patient.riskLevel)}
                            </div>
                        </div>
                    </div>
                    <div className="header-actions">
                        <Button variant="secondary">Export PDF</Button>
                        <Button variant="primary" onClick={() => navigate('/explain')}>
                            View Explainability
                        </Button>
                    </div>
                </div>

                {/* Tabs Content */}
                <Tabs tabs={tabs} defaultTab="ctg" />
            </div>
        </Layout>
    );
};

export default PatientDetailPage;
