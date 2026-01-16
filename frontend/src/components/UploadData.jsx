import { useState, useRef } from 'react';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { uploadAPI } from '../services/api';
import './UploadData.css';

const UploadData = ({ onUploadComplete }) => {
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const handleFileUpload = async (file) => {
        // Validate file type
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'xlsx' && ext !== 'xls') {
            setError('Please upload an Excel file (.xlsx or .xls)');
            return;
        }

        setUploading(true);
        setError(null);
        setResult(null);

        try {
            const response = await uploadAPI.uploadExcel(file);
            setResult(response.data);
            if (onUploadComplete) {
                onUploadComplete(response.data);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleClearData = async () => {
        try {
            await uploadAPI.clearData();
            setResult(null);
            if (onUploadComplete) {
                onUploadComplete(null);
            }
        } catch (err) {
            setError('Failed to clear data');
        }
    };

    return (
        <>
            <Button variant="secondary" onClick={() => setShowModal(true)}>
                📤 Upload CTG Data
            </Button>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Upload CTG Data"
                size="md"
            >
                <div className="upload-content">
                    <p className="text-gray-400 mb-6 font-light text-sm text-center max-w-lg mx-auto leading-relaxed">
                        Upload an Excel file containing CTG data. The file should have a data sheet with columns
                        including: FileName, LB, AC, FM, UC, ASTV, MSTV, ALTV, MLTV, DL, DS, DP.
                    </p>

                    <div
                        className={`upload-dropzone ${dragActive ? 'active' : ''} ${uploading ? 'disabled' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {uploading ? (
                            <div className="upload-loading">
                                <div className="spinner" />
                                <span>Processing file...</span>
                            </div>
                        ) : (
                            <>
                                <div className="upload-icon">📁</div>
                                <div className="upload-text">
                                    <strong>Click to upload</strong> or drag and drop
                                </div>
                                <div className="upload-hint">Excel files only (.xlsx, .xls)</div>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="upload-error">{error}</div>
                    )}

                    {result && (
                        <div className="upload-result">
                            <div className="result-header">
                                <span className="result-icon">✅</span>
                                <span>{result.message}</span>
                            </div>
                            <div className="result-stats">
                                <div className="result-stat">
                                    <span className="stat-value">{result.patientsCount}</span>
                                    <span className="stat-label">Patients</span>
                                </div>
                                <div className="result-stat">
                                    <span className="stat-value">{result.reportsCount}</span>
                                    <span className="stat-label">Reports</span>
                                </div>
                                <div className="result-stat high">
                                    <span className="stat-value">{result.summary?.high || 0}</span>
                                    <span className="stat-label">High Risk</span>
                                </div>
                                <div className="result-stat suspect">
                                    <span className="stat-value">{result.summary?.suspect || 0}</span>
                                    <span className="stat-label">Suspect</span>
                                </div>
                                <div className="result-stat normal">
                                    <span className="stat-value">{result.summary?.normal || 0}</span>
                                    <span className="stat-label">Normal</span>
                                </div>
                            </div>

                            {result.dataCleaning && (
                                <div className="cleaning-stats">
                                    <div className="cleaning-title">Data Cleaning Summary</div>
                                    <div className="cleaning-details">
                                        <span>Original: {result.dataCleaning.originalRows} rows</span>
                                        <span>Duplicates removed: {result.dataCleaning.duplicatesRemoved}</span>
                                        <span>Missing values imputed: {result.dataCleaning.valuesImputed}</span>
                                        <span>Outliers capped: {result.dataCleaning.outliersCapped}</span>
                                        {result.dataCleaning.detectedNspColumn && (
                                            <span>Classification column: {result.dataCleaning.detectedNspColumn}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <Button variant="ghost" size="sm" onClick={handleClearData}>
                                Clear Uploaded Data
                            </Button>
                        </div>
                    )}

                    <div className="upload-footer">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default UploadData;
