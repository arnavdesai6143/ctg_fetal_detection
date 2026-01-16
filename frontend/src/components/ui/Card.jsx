import './Card.css';

const Card = ({
    children,
    title,
    subtitle,
    headerAction,
    className = '',
    padding = true,
    hover = false,
    ...props
}) => {
    const classes = [
        'card',
        hover && 'card-hover',
        !padding && 'card-no-padding',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            {(title || headerAction) && (
                <div className="card-header">
                    <div className="card-header-content">
                        {title && <h3 className="card-title">{title}</h3>}
                        {subtitle && <p className="card-subtitle">{subtitle}</p>}
                    </div>
                    {headerAction && <div className="card-header-action">{headerAction}</div>}
                </div>
            )}
            <div className="card-body">
                {children}
            </div>
        </div>
    );
};

export default Card;
