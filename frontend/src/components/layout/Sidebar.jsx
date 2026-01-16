import { useState } from 'react';
import { getRiskBadge } from '../ui/Badge';
import './Sidebar.css';

const Sidebar = ({
    patients = [],
    selectedPatient,
    onSelectPatient,
    loading = false,
    riskFilter = null,
    onRiskFilterChange = null,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter by risk level first (from URL params), then by search
    let filteredPatients = riskFilter
        ? patients.filter(patient => patient.riskLevel === riskFilter)
        : patients;

    filteredPatients = filteredPatients.filter(patient =>
        patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusIndicator = (status, riskLevel) => {
        if (riskLevel === 'high' || status === 'critical') return 'status-critical';
        if (status === 'active') return 'status-active';
        return 'status-stable';
    };

    const riskCounts = {
        all: patients.length,
        high: patients.filter(p => p.riskLevel === 'high').length,
        suspect: patients.filter(p => p.riskLevel === 'suspect').length,
        normal: patients.filter(p => p.riskLevel === 'normal').length,
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h3 className="sidebar-title">Patients</h3>
                <span className="sidebar-count">{filteredPatients.length}</span>
            </div>

            {/* Risk Filter Tabs */}
            {onRiskFilterChange && (
                <div className="risk-filter-tabs">
                    <button
                        className={`filter-tab ${!riskFilter ? 'active' : ''}`}
                        onClick={() => onRiskFilterChange(null)}
                    >
                        All ({riskCounts.all})
                    </button>
                    <button
                        className={`filter-tab filter-high ${riskFilter === 'high' ? 'active' : ''}`}
                        onClick={() => onRiskFilterChange('high')}
                    >
                        High ({riskCounts.high})
                    </button>
                    <button
                        className={`filter-tab filter-suspect ${riskFilter === 'suspect' ? 'active' : ''}`}
                        onClick={() => onRiskFilterChange('suspect')}
                    >
                        Suspect ({riskCounts.suspect})
                    </button>
                    <button
                        className={`filter-tab filter-normal ${riskFilter === 'normal' ? 'active' : ''}`}
                        onClick={() => onRiskFilterChange('normal')}
                    >
                        Normal ({riskCounts.normal})
                    </button>
                </div>
            )}

            <div className="sidebar-search">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="sidebar-list">
                {loading ? (
                    <div className="sidebar-loading">
                        <div className="loading-spinner" />
                        <span>Loading patients...</span>
                    </div>
                ) : filteredPatients.length === 0 ? (
                    <div className="sidebar-empty">
                        No patients found
                    </div>
                ) : (
                    filteredPatients.map((patient) => (
                        <div
                            key={patient.id}
                            className={`patient-item ${selectedPatient?.id === patient.id ? 'selected' : ''}`}
                            onClick={() => onSelectPatient(patient)}
                        >
                            <div className={`status-dot ${getStatusIndicator(patient.status, patient.riskLevel)}`} />

                            <div className="patient-info">
                                <div className="patient-id">{patient.id}</div>
                                <div className="patient-meta">
                                    <span className="patient-status">{patient.status}</span>
                                    <span className="separator">|</span>
                                    <span className="patient-room">Room {patient.room}</span>
                                </div>
                            </div>

                            <div className="patient-risk">
                                {getRiskBadge(patient.riskLevel)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
