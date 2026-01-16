import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { Select } from '../components/ui/Input';
import { getRiskBadge } from '../components/ui/Badge';
import { reportsAPI, patientAPI } from '../services/api';
import './ReportsPage.css';

const ReportsPage = () => {
    const [reports, setReports] = useState([]);
    const [patients, setPatients] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showGenerate, setShowGenerate] = useState(false);
    const [riskFilter, setRiskFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [generateForm, setGenerateForm] = useState({ patientId: '', modelVersion: 'LightGBM v2.1' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadReports();
    }, [riskFilter, statusFilter]);

    const loadData = async () => {
        try {
            const [reportsRes, patientsRes] = await Promise.all([
                reportsAPI.getAll(),
                patientAPI.getAll(),
            ]);
            setReports(reportsRes.data);
            setPatients(patientsRes.data);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadReports = async () => {
        try {
            const filters = {};
            if (riskFilter) filters.riskLevel = riskFilter;
            if (statusFilter) filters.status = statusFilter;
            const response = await reportsAPI.getAll(filters);
            setReports(response.data);
        } catch (err) {
            console.error('Failed to filter reports:', err);
        }
    };

    const handleGenerateReport = async () => {
        try {
            await reportsAPI.generate(generateForm.patientId, generateForm.modelVersion);
            setShowGenerate(false);
            setGenerateForm({ patientId: '', modelVersion: 'LightGBM v2.1' });
            loadData();
        } catch (err) {
            alert('Failed to generate report');
        }
    };

    const handleDownloadPDF = async (reportId) => {
        try {
            const response = await reportsAPI.download(reportId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CTG_Report_${reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            alert('Failed to download PDF');
        }
    };

    const columns = [
        {
            key: 'patientId',
            label: 'Patient',
            render: (value) => <span className="patient-link">{value}</span>
        },
        { key: 'date', label: 'Date' },
        {
            key: 'riskLevel',
            label: 'Risk',
            render: (value) => getRiskBadge(value)
        },
        { key: 'clinician', label: 'Clinician' },
        {
            key: 'status',
            label: 'Status',
            render: (value) => (
                <span className={`status-pill status-${value}`}>
                    {value}
                </span>
            )
        },
        {
            key: 'id',
            label: 'Actions',
            render: (_, row) => (
                <div className="report-actions">
                    <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(row);
                            setShowPreview(true);
                        }}
                    >
                        Preview
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPDF(row.id);
                        }}
                    >
                        📥 PDF
                    </Button>
                </div>
            )
        },
    ];

    return (
        <Layout>
            <div className="page reports-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Reports</h1>
                        <p className="page-subtitle">View and generate clinical reports</p>
                    </div>
                    <Button variant="primary" onClick={() => setShowGenerate(true)}>
                        Generate Report
                    </Button>
                </div>

                {/* Filters */}
                <Card className="filters-card">
                    <div className="filters-row">
                        <Select
                            label="Risk Level"
                            placeholder="All levels"
                            value={riskFilter}
                            onChange={(e) => setRiskFilter(e.target.value)}
                            options={[
                                { value: '', label: 'All Levels' },
                                { value: 'high', label: 'High Risk' },
                                { value: 'suspect', label: 'Suspect' },
                                { value: 'normal', label: 'Normal' },
                            ]}
                        />
                        <Select
                            label="Status"
                            placeholder="All statuses"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: '', label: 'All Statuses' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'pending', label: 'Pending' },
                            ]}
                        />
                    </div>
                </Card>

                {/* Reports Table */}
                <Table
                    columns={columns}
                    data={reports}
                    loading={loading}
                    onRowClick={(row) => {
                        setSelectedReport(row);
                        setShowPreview(true);
                    }}
                    emptyMessage="No reports found matching the filters"
                />

                {/* Generate Report Modal */}
                <Modal
                    isOpen={showGenerate}
                    onClose={() => setShowGenerate(false)}
                    title="Generate New Report"
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setShowGenerate(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleGenerateReport}
                                disabled={!generateForm.patientId}
                            >
                                Generate
                            </Button>
                        </>
                    }
                >
                    <div className="generate-form">
                        <Select
                            label="Patient"
                            value={generateForm.patientId}
                            onChange={(e) => setGenerateForm({ ...generateForm, patientId: e.target.value })}
                            options={patients.map(p => ({ value: p.id, label: `${p.id} - ${p.name}` }))}
                            placeholder="Select a patient"
                        />
                        <Select
                            label="Model Version"
                            value={generateForm.modelVersion}
                            onChange={(e) => setGenerateForm({ ...generateForm, modelVersion: e.target.value })}
                            options={[
                                { value: 'LightGBM v2.1', label: 'LightGBM v2.1' },
                                { value: 'CNN-LSTM v1.0', label: 'CNN-LSTM v1.0' },
                                { value: 'XGBoost v1.4', label: 'XGBoost v1.4' },
                            ]}
                        />
                    </div>
                </Modal>

                {/* Report Preview Modal */}
                <Modal
                    isOpen={showPreview}
                    onClose={() => setShowPreview(false)}
                    title="Report Preview"
                    size="lg"
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setShowPreview(false)}>
                                Close
                            </Button>
                            <Button variant="primary" onClick={() => handleDownloadPDF(selectedReport?.id)}>
                                Download PDF
                            </Button>
                        </>
                    }
                >
                    {selectedReport && (
                        <div className="report-preview">
                            <div className="preview-header">
                                <h3>CTG Analysis Report</h3>
                                <p>Report ID: {selectedReport.id}</p>
                                <p>Generated: {selectedReport.date}</p>
                            </div>

                            <div className="preview-section">
                                <h4>Patient Information</h4>
                                <p>Patient ID: {selectedReport.patientId}</p>
                            </div>

                            <div className="preview-section">
                                <h4>Risk Assessment</h4>
                                <div className="preview-risk">
                                    {getRiskBadge(selectedReport.riskLevel)}
                                    <span>Classification: {selectedReport.riskLevel?.toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="preview-section">
                                <h4>Model Information</h4>
                                <p>Model: {selectedReport.modelVersion}</p>
                                <p>Clinician: {selectedReport.clinician}</p>
                                <p>Status: {selectedReport.status}</p>
                            </div>

                            <div className="preview-footer">
                                <p>This report is generated for clinical decision support purposes only.</p>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </Layout>
    );
};

export default ReportsPage;
