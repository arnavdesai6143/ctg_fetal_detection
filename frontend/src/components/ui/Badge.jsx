import './Badge.css';

const Badge = ({
    children,
    variant = 'default',
    size = 'md',
    dot = false,
    className = '',
    ...props
}) => {
    const classes = [
        'badge',
        `badge-${variant}`,
        `badge-${size}`,
        dot && 'badge-dot',
        className,
    ].filter(Boolean).join(' ');

    return (
        <span className={classes} {...props}>
            {dot && <span className="badge-dot-indicator" />}
            {children}
        </span>
    );
};

// Convenience components for status badges
export const NormalBadge = ({ children = 'Normal', ...props }) => (
    <Badge variant="normal" {...props}>{children}</Badge>
);

export const SuspectBadge = ({ children = 'Suspect', ...props }) => (
    <Badge variant="suspect" {...props}>{children}</Badge>
);

export const PathologicBadge = ({ children = 'Pathologic', ...props }) => (
    <Badge variant="pathologic" {...props}>{children}</Badge>
);

export const getRiskBadge = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
        case 'normal':
            return <NormalBadge />;
        case 'suspect':
            return <SuspectBadge />;
        case 'pathologic':
        case 'high':
            return <PathologicBadge>High Risk</PathologicBadge>;
        default:
            return <Badge>{riskLevel}</Badge>;
    }
};

export default Badge;
