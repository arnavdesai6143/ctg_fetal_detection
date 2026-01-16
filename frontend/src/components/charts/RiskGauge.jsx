import './RiskGauge.css';

const RiskGauge = ({
    score = 0,
    classification = 'Normal',
    probabilities = {},
    size = 'md',
}) => {
    // Score should be 0-1, convert to percentage
    const percentage = Math.round(score * 100);

    // Determine color based on classification
    const getColor = () => {
        switch (classification.toLowerCase()) {
            case 'pathologic':
            case 'high':
                return 'var(--color-danger)';
            case 'suspect':
                return 'var(--color-warning)';
            default:
                return 'var(--color-success)';
        }
    };

    // Calculate the arc for the gauge
    const radius = 70;
    const circumference = Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className={`risk-gauge risk-gauge-${size}`}>
            <div className="gauge-visual">
                <svg viewBox="0 0 160 90" className="gauge-svg">
                    {/* Background arc */}
                    <path
                        d="M 10 80 A 70 70 0 0 1 150 80"
                        fill="none"
                        stroke="var(--color-bg-tertiary)"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />
                    {/* Value arc */}
                    <path
                        d="M 10 80 A 70 70 0 0 1 150 80"
                        fill="none"
                        stroke={getColor()}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="gauge-value-arc"
                    />
                    {/* Center label */}
                    <text x="80" y="65" textAnchor="middle" className="gauge-score">
                        {percentage}%
                    </text>
                    <text x="80" y="82" textAnchor="middle" className="gauge-label">
                        Risk Score
                    </text>
                </svg>
            </div>

            <div className="gauge-classification" style={{ color: getColor() }}>
                {classification === 'Pathologic' ? 'HIGH RISK' : classification.toUpperCase()}
            </div>

            {probabilities && Object.keys(probabilities).length > 0 && (
                <div className="gauge-probabilities">
                    <div className="prob-title">Probability Breakdown</div>
                    <div className="prob-bars">
                        {Object.entries(probabilities).map(([label, value]) => (
                            <div key={label} className="prob-item">
                                <div className="prob-label">
                                    <span>{label}</span>
                                    <span>{(value * 100).toFixed(0)}%</span>
                                </div>
                                <div className="prob-bar-bg">
                                    <div
                                        className={`prob-bar prob-bar-${label.toLowerCase()}`}
                                        style={{ width: `${value * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskGauge;
