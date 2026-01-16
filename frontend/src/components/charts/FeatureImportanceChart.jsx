import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import './FeatureImportanceChart.css';

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    return (
        <div className="feature-tooltip">
            <div className="tooltip-feature">{data.feature}</div>
            <div className="tooltip-desc">{data.description}</div>
            <div className="tooltip-importance">
                Importance: <strong>{(data.importance * 100).toFixed(1)}%</strong>
            </div>
        </div>
    );
};

const FeatureImportanceChart = ({
    data = [],
    height = 300,
    showLabels = true,
    title = 'Feature Importance',
}) => {
    // Sort by importance descending
    const sortedData = [...data].sort((a, b) => b.importance - a.importance);

    // Color gradient based on importance
    const getColor = (importance) => {
        if (importance >= 0.2) return 'var(--color-danger)';
        if (importance >= 0.1) return 'var(--color-warning)';
        return 'var(--color-accent-primary)';
    };

    return (
        <div className="feature-chart-container">
            {title && <h4 className="feature-chart-title">{title}</h4>}

            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={sortedData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
                >
                    <XAxis
                        type="number"
                        domain={[0, 0.35]}
                        stroke="var(--color-text-muted)"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    />
                    <YAxis
                        type="category"
                        dataKey="feature"
                        stroke="var(--color-text-muted)"
                        tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                        width={70}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />

                    <Bar
                        dataKey="importance"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={24}
                    >
                        {sortedData.map((entry, index) => (
                            <Cell key={index} fill={getColor(entry.importance)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {showLabels && (
                <div className="feature-legend">
                    <div className="legend-item">
                        <div className="legend-bar high" />
                        <span>High Impact (≥20%)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-bar medium" />
                        <span>Medium Impact (10-20%)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-bar low" />
                        <span>Low Impact (&lt;10%)</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeatureImportanceChart;
