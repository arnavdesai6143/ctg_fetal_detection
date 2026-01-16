import './Input.css';

const Input = ({
    label,
    error,
    helper,
    icon,
    type = 'text',
    className = '',
    ...props
}) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                </label>
            )}
            <div className="input-wrapper">
                {icon && <span className="input-icon">{icon}</span>}
                <input
                    id={inputId}
                    type={type}
                    className={`input ${icon ? 'input-with-icon' : ''}`}
                    {...props}
                />
            </div>
            {error && <span className="input-error-message">{error}</span>}
            {helper && !error && <span className="input-helper">{helper}</span>}
        </div>
    );
};

export const TextArea = ({
    label,
    error,
    helper,
    className = '',
    rows = 4,
    ...props
}) => {
    const inputId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                </label>
            )}
            <textarea
                id={inputId}
                className="input textarea"
                rows={rows}
                {...props}
            />
            {error && <span className="input-error-message">{error}</span>}
            {helper && !error && <span className="input-helper">{helper}</span>}
        </div>
    );
};

export const Select = ({
    label,
    error,
    options = [],
    placeholder = 'Select...',
    className = '',
    ...props
}) => {
    const inputId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                </label>
            )}
            <select id={inputId} className="input select" {...props}>
                <option value="" disabled>{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <span className="input-error-message">{error}</span>}
        </div>
    );
};

export default Input;
