import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import './ModelMetricsChart.css';

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    return (
        <div className="metrics-tooltip">
            <div className="tooltip-date">{data.date}</div>
            <div className="tooltip-value">
                Accuracy: <strong>{(data.accuracy * 100).toFixed(1)}%</strong>
            </div>
            {data.predictions && (
                <div className="tooltip-predictions">
                    Predictions: {data.predictions}
                </div>
            )}
        </div>
    );
};

export const DriftChart = ({ data = [], height = 200 }) => {
    return (
        <div className="metrics-chart-container">
            <h4 className="metrics-chart-title">Accuracy Trend Over Time</h4>
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                        dataKey="date"
                        stroke="var(--color-text-muted)"
                        tick={{ fontSize: 11 }}
                    />
                    <YAxis
                        domain={[0.8, 1]}
                        stroke="var(--color-text-muted)"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="var(--color-accent-primary)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--color-accent-primary)', r: 4 }}
                        activeDot={{ r: 6, fill: 'var(--color-accent-secondary)' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export const PredictionVolumeChart = ({ data = [], height = 200 }) => {
    return (
        <div className="metrics-chart-container">
            <h4 className="metrics-chart-title">Prediction Volume</h4>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                        dataKey="date"
                        stroke="var(--color-text-muted)"
                        tick={{ fontSize: 11 }}
                    />
                    <YAxis
                        stroke="var(--color-text-muted)"
                        tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                        dataKey="predictions"
                        fill="var(--color-accent-primary)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const MetricCard = ({ label, value, unit = '', trend, className = '' }) => {
    return (
        <div className={`metric-card ${className}`}>
            <div className="metric-label">{label}</div>
            <div className="metric-value">
                {typeof value === 'number' ? value.toFixed(2) : value}
                {unit && <span className="metric-unit">{unit}</span>}
            </div>
            {trend !== undefined && (
                <div className={`metric-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
                </div>
            )}
        </div>
    );
};

const ModelMetricsChart = { DriftChart, PredictionVolumeChart, MetricCard };

export default ModelMetricsChart;
