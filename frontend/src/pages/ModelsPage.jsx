import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import Table from '../components/ui/Table';
import FeatureImportanceChart from '../components/charts/FeatureImportanceChart';
import { DriftChart, PredictionVolumeChart, MetricCard } from '../components/charts/ModelMetricsChart';
import { predictionAPI } from '../services/api';
import './ModelsPage.css';

const ModelsPage = () => {
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [modelMetrics, setModelMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadModels();
    }, []);

    useEffect(() => {
        if (selectedModel) {
            loadModelMetrics(selectedModel.id);
        }
    }, [selectedModel]);

    const loadModels = async () => {
        try {
            const response = await predictionAPI.getModels();
            setModels(response.data);
            // Select first active model by default
            const activeModel = response.data.find(m => m.status === 'active') || response.data[0];
            setSelectedModel(activeModel);
        } catch (err) {
            console.error('Failed to load models:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadModelMetrics = async (modelId) => {
        try {
            const response = await predictionAPI.getModelMetrics(modelId);
            setModelMetrics(response.data);
        } catch (err) {
            console.error('Failed to load model metrics:', err);
        }
    };

    const modelColumns = [
        { key: 'name', label: 'Model' },
        { key: 'type', label: 'Type' },
        { key: 'version', label: 'Version' },
        { key: 'balancedAccuracy', label: 'Accuracy', render: (v) => `${(v * 100).toFixed(1)}%` },
        { key: 'macroF1', label: 'F1 Score', render: (v) => `${(v * 100).toFixed(1)}%` },
        { key: 'auc', label: 'AUC', render: (v) => `${(v * 100).toFixed(1)}%` },
        {
            key: 'status', label: 'Status', render: (v) => (
                <span className={`status-badge status-${v}`}>{v}</span>
            )
        },
    ];

    const tabs = [
        {
            id: 'summary',
            label: 'Summary',
            content: (
                <div className="models-summary">
                    <div className="models-grid">
                        {models.map((model) => (
                            <Card
                                key={model.id}
                                className={`model-card ${selectedModel?.id === model.id ? 'selected' : ''}`}
                                onClick={() => setSelectedModel(model)}
                            >
                                <div className="model-header">
                                    <span className="model-name">{model.name}</span>
                                    <span className={`model-status ${model.status}`}>{model.status}</span>
                                </div>
                                <div className="model-type">{model.type}</div>
                                <div className="model-version">{model.version}</div>
                                <div className="model-metrics">
                                    <div className="metric">
                                        <span className="metric-value">{(model.balancedAccuracy * 100).toFixed(0)}%</span>
                                        <span className="metric-label">Accuracy</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-value">{(model.auc * 100).toFixed(0)}%</span>
                                        <span className="metric-label">AUC</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-value">{(model.macroF1 * 100).toFixed(0)}%</span>
                                        <span className="metric-label">F1</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            id: 'comparison',
            label: 'Comparison',
            content: (
                <div className="models-comparison">
                    {/* Comparison Metrics Chart */}
                    <Card title="Model Performance Comparison" className="comparison-chart-card">
                        <div className="comparison-chart">
                            <ResponsiveContainer width="100%" height={550}>
                                <BarChart
                                    data={models.map(m => ({
                                        name: m.name,
                                        Accuracy: (m.balancedAccuracy * 100).toFixed(1),
                                        AUC: (m.auc * 100).toFixed(1),
                                        F1: (m.macroF1 * 100).toFixed(1),
                                    }))}
                                    layout="vertical"
                                    margin={{ top: 20, right: 40, left: 120, bottom: 20 }}
                                    barCategoryGap="50%"
                                    barGap={2}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        domain={[60, 100]}
                                        tick={{ fill: '#888', fontSize: 12 }}
                                        tickCount={9}
                                        axisLine={{ stroke: '#444' }}
                                    />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tick={{ fill: '#fff', fontSize: 13, fontWeight: 500 }}
                                        width={110}
                                        axisLine={{ stroke: '#444' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1a1a2e',
                                            border: '1px solid #444',
                                            borderRadius: '8px',
                                            padding: '12px'
                                        }}
                                        labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}
                                        formatter={(value) => [`${value}%`, '']}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        iconType="circle"
                                    />
                                    <Bar
                                        dataKey="Accuracy"
                                        fill="#06b6d4"
                                        radius={[0, 6, 6, 0]}
                                        barSize={18}
                                    />
                                    <Bar
                                        dataKey="AUC"
                                        fill="#22c55e"
                                        radius={[0, 6, 6, 0]}
                                        barSize={18}
                                    />
                                    <Bar
                                        dataKey="F1"
                                        fill="#f59e0b"
                                        radius={[0, 6, 6, 0]}
                                        barSize={18}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Comparison Table */}
                    <Card title="Detailed Metrics Table">
                        <Table
                            columns={modelColumns}
                            data={models}
                            loading={loading}
                            onRowClick={(row) => setSelectedModel(row)}
                        />
                    </Card>

                    {/* SHAP Explainability Section */}
                    <Card title="SHAP Explainability" subtitle="Model interpretability using SHapley Additive exPlanations">
                        <div className="shap-section">
                            <div className="shap-info">
                                <div className="shap-icon">🔍</div>
                                <div className="shap-description">
                                    <h4>Understanding Model Predictions</h4>
                                    <p>
                                        SHAP values explain how each feature contributes to the model's risk prediction.
                                        Features pushing towards higher risk are shown in <span className="shap-red">red</span>,
                                        while those reducing risk appear in <span className="shap-blue">blue</span>.
                                    </p>
                                </div>
                            </div>
                            <div className="shap-features">
                                <div className="shap-feature">
                                    <span className="feature-name">ASTV (Abnormal STV)</span>
                                    <div className="shap-bar-container">
                                        <div className="shap-bar shap-positive" style={{ width: '85%' }}></div>
                                    </div>
                                    <span className="shap-value">+0.28</span>
                                </div>
                                <div className="shap-feature">
                                    <span className="feature-name">DS (Severe Decelerations)</span>
                                    <div className="shap-bar-container">
                                        <div className="shap-bar shap-positive" style={{ width: '70%' }}></div>
                                    </div>
                                    <span className="shap-value">+0.22</span>
                                </div>
                                <div className="shap-feature">
                                    <span className="feature-name">LB (Baseline FHR)</span>
                                    <div className="shap-bar-container">
                                        <div className="shap-bar shap-negative" style={{ width: '40%' }}></div>
                                    </div>
                                    <span className="shap-value">-0.08</span>
                                </div>
                                <div className="shap-feature">
                                    <span className="feature-name">AC (Accelerations)</span>
                                    <div className="shap-bar-container">
                                        <div className="shap-bar shap-negative" style={{ width: '50%' }}></div>
                                    </div>
                                    <span className="shap-value">-0.12</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            ),
        },
        {
            id: 'features',
            label: 'Feature Importance',
            content: (
                <div className="models-features">
                    {modelMetrics?.featureImportance && (
                        <>
                            <Card title={`Feature Importance - ${selectedModel?.name}`}>
                                <FeatureImportanceChart
                                    data={modelMetrics.featureImportance}
                                    height={400}
                                />
                            </Card>
                            <Card title="Feature Descriptions" className="feature-descriptions">
                                <div className="features-list">
                                    {modelMetrics.featureImportance.map((f) => (
                                        <div key={f.feature} className="feature-item">
                                            <span className="feature-name">{f.feature}</span>
                                            <span className="feature-desc">{f.description}</span>
                                            <span className="feature-importance">{(f.importance * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            ),
        },
        {
            id: 'drift',
            label: 'Drift Monitoring',
            content: (
                <div className="models-drift">
                    {modelMetrics?.driftData && (
                        <>
                            <div className="drift-metrics">
                                <MetricCard
                                    label="Current Accuracy"
                                    value={(modelMetrics.balancedAccuracy * 100).toFixed(1)}
                                    unit="%"
                                    trend="up"
                                />
                                <MetricCard
                                    label="Predictions Today"
                                    value="42"
                                    trend="neutral"
                                />
                                <MetricCard
                                    label="Data Drift Score"
                                    value="0.12"
                                    trend="neutral"
                                />
                                <MetricCard
                                    label="Model Age"
                                    value="5"
                                    unit=" days"
                                    trend="neutral"
                                />
                            </div>
                            <div className="drift-charts">
                                <Card title="Accuracy Trend (7 Days)">
                                    <DriftChart data={modelMetrics.driftData} height={200} />
                                </Card>
                                <Card title="Prediction Volume">
                                    <PredictionVolumeChart data={modelMetrics.driftData} height={200} />
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <Layout>
            <div className="page models-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">AI Model Analytics</h1>
                        <p className="page-subtitle">Monitor and compare machine learning models</p>
                    </div>
                </div>

                <Tabs tabs={tabs} defaultTab="summary" />
            </div>
        </Layout>
    );
};

export default ModelsPage;
