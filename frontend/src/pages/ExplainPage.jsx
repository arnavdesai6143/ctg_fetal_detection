import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import FeatureImportanceChart from '../components/charts/FeatureImportanceChart';
import RiskGauge from '../components/charts/RiskGauge';
import { mockPatients, featureImportance, generateCTGFeatures, getPrediction } from '../services/mockData';
import './ExplainPage.css';

const ExplainPage = () => {
    const [searchParams] = useSearchParams();
    const patientId = searchParams.get('patient') || mockPatients[0].id;
    const patient = mockPatients.find(p => p.id === patientId) || mockPatients[0];

    const features = generateCTGFeatures(patient.riskLevel);
    const prediction = getPrediction(features);

    // Generate local explanation (SHAP values for this patient)
    const localExplanation = featureImportance.map(f => ({
        ...f,
        localValue: features[f.feature] || 0,
        contribution: f.importance * (patient.riskLevel === 'high' ? 1.5 : patient.riskLevel === 'suspect' ? 1.1 : 0.7),
    }));

    return (
        <Layout>
            <div className="page explain-page">
                {/* Header */}
                <div className="explain-header">
                    <div className="header-info">
                        <span className="header-patient">Patient ID #{patient.id}</span>
                        <span className="header-date">Date: {new Date().toISOString().split('T')[0]}</span>
                    </div>
                    <div className="header-model">
                        Model: <strong>LightGBM v2.1</strong>
                    </div>
                </div>

                <div className="explain-grid">
                    {/* Left Column - Prediction */}
                    <div className="explain-left">
                        <Card title="AI Prediction">
                            <RiskGauge
                                score={prediction.riskScore}
                                classification={prediction.classification}
                                probabilities={prediction.probabilities}
                                size="lg"
                            />
                        </Card>
                    </div>

                    {/* Right Column - Explanations */}
                    <div className="explain-right">
                        {/* Global Feature Importance */}
                        <Card title="Global Feature Importance">
                            <p className="explain-description">
                                These features are most influential across all predictions made by the model.
                            </p>
                            <FeatureImportanceChart
                                data={featureImportance}
                                height={250}
                                showLabels={false}
                            />
                        </Card>

                        {/* Local Patient Explanation */}
                        <Card title="Local Patient Explanation">
                            <div className="local-explanation">
                                <div className="shap-force">
                                    <div className="force-header">
                                        <span className="force-label">SHAP Force Plot</span>
                                        <span className="force-result">
                                            Prediction: <strong className={`text-${patient.riskLevel === 'high' ? 'danger' : patient.riskLevel === 'suspect' ? 'warning' : 'success'}`}>
                                                {prediction.classification}
                                            </strong>
                                        </span>
                                    </div>

                                    <div className="force-visualization">
                                        {localExplanation.slice(0, 5).map((f, i) => (
                                            <div
                                                key={f.feature}
                                                className={`force-bar ${f.contribution > 0.15 ? 'high' : f.contribution > 0.08 ? 'medium' : 'low'}`}
                                                style={{ width: `${Math.min(100, f.contribution * 400)}%` }}
                                            >
                                                <span className="force-feature">{f.feature}</span>
                                                <span className="force-value">{f.localValue}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="explanation-text">
                                    <p>
                                        &quot;{patient.riskLevel === 'high'
                                            ? 'High ASTV and DS resulted in a high-risk classification.'
                                            : patient.riskLevel === 'suspect'
                                                ? 'Elevated ALTV and baseline contributed to suspect status.'
                                                : 'Normal variability and accelerations indicate healthy fetal state.'}
                                        &quot;
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Interpretation Guide */}
                <Card title="Interpretation Guide" className="interpretation-card">
                    <div className="guide-grid">
                        <div className="guide-item">
                            <div className="guide-feature">ASTV ↑</div>
                            <div className="guide-meaning">Erratic variability - may indicate fetal distress or CNS issues</div>
                        </div>
                        <div className="guide-item">
                            <div className="guide-feature">DS ↑</div>
                            <div className="guide-meaning">Frequent severe decelerations - reduced oxygen supply</div>
                        </div>
                        <div className="guide-item">
                            <div className="guide-feature">DP ↑</div>
                            <div className="guide-meaning">Prolonged heart rate drops - requires immediate attention</div>
                        </div>
                        <div className="guide-item">
                            <div className="guide-feature">AC ↓</div>
                            <div className="guide-meaning">Few accelerations - possible reduced fetal activity</div>
                        </div>
                        <div className="guide-item">
                            <div className="guide-feature">LB out of range</div>
                            <div className="guide-meaning">Bradycardia (&lt;110) or Tachycardia (&gt;160) baseline</div>
                        </div>
                        <div className="guide-item">
                            <div className="guide-feature">Low Variability</div>
                            <div className="guide-meaning">Flat heart rate pattern - potential distress signal</div>
                        </div>
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

export default ExplainPage;
