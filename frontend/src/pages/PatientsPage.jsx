import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import CTGChart from '../components/charts/CTGChart';
import RiskGauge from '../components/charts/RiskGauge';
import { patientAPI, predictionAPI } from '../services/api';
import { useRealtimeCTG } from '../hooks/useSocket';
import './PatientsPage.css';

const PatientsPage = () => {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [useRealtime, setUseRealtime] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // Get risk filter from URL
    const riskFilter = searchParams.get('risk');

    // Real-time CTG data
    const { ctgData: realtimeData, isConnected } = useRealtimeCTG(
        useRealtime ? selectedPatient?.id : null
    );

    // Static CTG data for non-realtime mode
    const [staticCTGData, setStaticCTGData] = useState([]);

    useEffect(() => {
        loadPatients();
    }, []);

    useEffect(() => {
        // Select first patient matching filter when patients load or filter changes
        if (patients.length > 0) {
            const filtered = riskFilter
                ? patients.filter(p => p.riskLevel === riskFilter)
                : patients;
            if (filtered.length > 0 && (!selectedPatient || (riskFilter && selectedPatient.riskLevel !== riskFilter))) {
                setSelectedPatient(filtered[0]);
            }
        }
    }, [riskFilter, patients]);

    useEffect(() => {
        if (selectedPatient && !useRealtime) {
            loadPatientCTG(selectedPatient.id);
        }
    }, [selectedPatient, useRealtime]);

    const loadPatients = async () => {
        try {
            const response = await patientAPI.getAll();
            setPatients(response.data);
            if (response.data.length > 0 && !riskFilter) {
                setSelectedPatient(response.data[0]);
            }
        } catch (err) {
            console.error('Failed to load patients:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadPatientCTG = async (patientId) => {
        try {
            const response = await patientAPI.getCTG(patientId);
            setStaticCTGData(response.data);

            // Use stored prediction from patient object (populated during upload)
            if (selectedPatient) {
                setPrediction({
                    riskScore: selectedPatient.riskScore,
                    classification: selectedPatient.classification || (selectedPatient.riskLevel === 'high' ? 'Pathologic' : selectedPatient.riskLevel === 'suspect' ? 'Suspect' : 'Normal'),
                    probabilities: selectedPatient.probabilities || {
                        Normal: selectedPatient.riskLevel === 'normal' ? 0.9 : 0.1,
                        Suspect: selectedPatient.riskLevel === 'suspect' ? 0.8 : 0.1,
                        Pathologic: selectedPatient.riskLevel === 'high' ? 0.9 : 0.0
                    },
                    modelVersion: selectedPatient.modelVersion || 'Rule-Based'
                });
            }
        } catch (err) {
            console.error('Failed to load CTG data:', err);
        }
    };

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        setUseRealtime(false);
    };

    const handleRiskFilterChange = (newFilter) => {
        if (newFilter) {
            setSearchParams({ risk: newFilter });
        } else {
            setSearchParams({});
        }
    };

    const ctgData = useRealtime ? realtimeData : staticCTGData;

    return (
        <Layout>
            <div className="patients-layout">
                <Sidebar
                    patients={patients}
                    selectedPatient={selectedPatient}
                    onSelectPatient={handlePatientSelect}
                    loading={loading}
                    riskFilter={riskFilter}
                    onRiskFilterChange={handleRiskFilterChange}
                />

                <div className="patients-content">
                    {selectedPatient ? (
                        <>
                            {/* CTG Monitor */}
                            <Card
                                title="CTG Monitor View"
                                subtitle={`Patient ${selectedPatient.id} - Room ${selectedPatient.room}`}
                                headerAction={
                                    <div className="monitor-actions">
                                        <Button
                                            variant={useRealtime ? 'primary' : 'secondary'}
                                            size="sm"
                                            onClick={() => setUseRealtime(!useRealtime)}
                                        >
                                            {useRealtime ? '🔴 Live' : '⏸️ Static'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => navigate(`/patients/${selectedPatient.id}`)}
                                        >
                                            Details →
                                        </Button>
                                    </div>
                                }
                            >
                                {useRealtime && (
                                    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                                        {isConnected ? '● Connected' : '○ Disconnected'}
                                    </div>
                                )}
                                {ctgData.length > 0 ? (
                                    <CTGChart data={ctgData} height={280} />
                                ) : (
                                    <div className="no-data">Loading CTG data...</div>
                                )}
                            </Card>

                            {/* Patient Info & Risk */}
                            <div className="patient-panels">
                                <Card title="Patient Information">
                                    <div className="patient-details">
                                        <DetailRow label="Patient ID" value={selectedPatient.id} />
                                        <DetailRow label="Name" value={selectedPatient.name} />
                                        <DetailRow label="Age" value={`${selectedPatient.age} years`} />
                                        <DetailRow label="Gestational Age" value={`${selectedPatient.gestationalAge} weeks`} />
                                        <DetailRow label="Room" value={`Room ${selectedPatient.room}`} />
                                        <DetailRow label="Attending" value={selectedPatient.attendingDoctor} />
                                        <DetailRow label="Status" value={selectedPatient.status} capitalize />
                                    </div>
                                </Card>

                                <Card title="AI Risk Assessment" subtitle={`Model: ${prediction?.modelVersion || 'Unknown Model'}`}>
                                    {prediction && (
                                        <div className="risk-panel">
                                            <RiskGauge
                                                score={prediction.riskScore}
                                                classification={prediction.classification}
                                                probabilities={prediction.probabilities}
                                                size="md"
                                            />
                                            <div className="risk-actions">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => navigate(`/explain?patient=${selectedPatient.id}`)}
                                                >
                                                    View Explainability
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => navigate('/reports')}
                                                >
                                                    Generate Report
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </>
                    ) : (
                        <Card>
                            <div className="no-patient">Select a patient from the sidebar</div>
                        </Card>
                    )}
                </div>
            </div>
        </Layout>
    );
};

const DetailRow = ({ label, value, capitalize }) => (
    <div className="detail-row">
        <span className="detail-label">{label}</span>
        <span className={`detail-value ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
);

export default PatientsPage;
