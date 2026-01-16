import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    ReferenceArea,
} from 'recharts';
import './CTGChart.css';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    return (
        <div className="ctg-tooltip">
            <div className="tooltip-time">Time: {label}s</div>
            {payload.map((entry, index) => (
                <div key={index} className="tooltip-row" style={{ color: entry.color }}>
                    <span className="tooltip-name">{entry.name}:</span>
                    <span className="tooltip-value">
                        {entry.value} {entry.name === 'FHR' ? 'bpm' : 'mmHg'}
                    </span>
                </div>
            ))}
        </div>
    );
};

const CTGChart = ({
    data = [],
    showDecelerations = true,
    showAccelerations = true,
    height = 300,
}) => {
    // Find deceleration and acceleration events
    const decelerationEvents = data.filter(d => d.hasDeceleration);
    const accelerationEvents = data.filter(d => d.hasAcceleration);

    return (
        <div className="ctg-chart-container">
            {/* Fetal Heart Rate Chart */}
            <div className="chart-section">
                <div className="chart-label">
                    <span className="label-text">Fetal Heart Rate (FHR)</span>
                    <span className="label-unit">bpm</span>
                </div>
                <ResponsiveContainer width="100%" height={height}>
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis
                            dataKey="time"
                            stroke="var(--color-text-muted)"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => `${value}s`}
                        />
                        <YAxis
                            domain={[80, 200]}
                            stroke="var(--color-text-muted)"
                            tick={{ fontSize: 11 }}
                            ticks={[80, 100, 120, 140, 160, 180, 200]}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {/* Normal range reference area */}
                        <ReferenceArea y1={110} y2={160} fill="rgba(16, 185, 129, 0.1)" />

                        {/* Reference lines for normal range */}
                        <ReferenceLine y={110} stroke="var(--color-success)" strokeDasharray="5 5" />
                        <ReferenceLine y={160} stroke="var(--color-success)" strokeDasharray="5 5" />

                        {/* Deceleration markers */}
                        {showDecelerations && decelerationEvents.map((event, i) => (
                            <ReferenceLine
                                key={`dec-${i}`}
                                x={event.time}
                                stroke="var(--color-danger)"
                                strokeWidth={2}
                                strokeOpacity={0.5}
                            />
                        ))}

                        {/* Acceleration markers */}
                        {showAccelerations && accelerationEvents.map((event, i) => (
                            <ReferenceLine
                                key={`acc-${i}`}
                                x={event.time}
                                stroke="var(--color-success)"
                                strokeWidth={2}
                                strokeOpacity={0.5}
                            />
                        ))}

                        <Line
                            type="monotone"
                            dataKey="fhr"
                            name="FHR"
                            stroke="var(--color-accent-primary)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: 'var(--color-accent-primary)' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Uterine Contractions Chart */}
            <div className="chart-section">
                <div className="chart-label">
                    <span className="label-text">Uterine Contractions (UC)</span>
                    <span className="label-unit">mmHg</span>
                </div>
                <ResponsiveContainer width="100%" height={height * 0.6}>
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis
                            dataKey="time"
                            stroke="var(--color-text-muted)"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => `${value}s`}
                        />
                        <YAxis
                            domain={[0, 100]}
                            stroke="var(--color-text-muted)"
                            tick={{ fontSize: 11 }}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        <Line
                            type="monotone"
                            dataKey="uc"
                            name="UC"
                            stroke="#f472b6"
                            strokeWidth={2}
                            dot={false}
                            fill="rgba(244, 114, 182, 0.2)"
                            activeDot={{ r: 4, fill: '#f472b6' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="chart-legend">
                <div className="legend-item">
                    <div className="legend-line" style={{ backgroundColor: 'var(--color-accent-primary)' }} />
                    <span>Fetal Heart Rate</span>
                </div>
                <div className="legend-item">
                    <div className="legend-line" style={{ backgroundColor: '#f472b6' }} />
                    <span>Uterine Contractions</span>
                </div>
                <div className="legend-item">
                    <div className="legend-area" style={{ backgroundColor: 'rgba(16, 185, 129, 0.3)' }} />
                    <span>Normal Range (110-160 bpm)</span>
                </div>
                {showAccelerations && (
                    <div className="legend-item">
                        <div className="legend-marker" style={{ backgroundColor: 'var(--color-success)' }} />
                        <span>Acceleration</span>
                    </div>
                )}
                {showDecelerations && (
                    <div className="legend-item">
                        <div className="legend-marker" style={{ backgroundColor: 'var(--color-danger)' }} />
                        <span>Deceleration</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CTGChart;
