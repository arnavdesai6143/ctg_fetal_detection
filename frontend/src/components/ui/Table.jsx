import './Table.css';

const Table = ({
    columns = [],
    data = [],
    onRowClick,
    loading = false,
    emptyMessage = 'No data available',
    className = '',
}) => {
    if (loading) {
        return (
            <div className="table-loading">
                <div className="table-spinner" />
                <span>Loading...</span>
            </div>
        );
    }

    return (
        <div className={`table-container ${className}`}>
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                style={{ width: col.width, textAlign: col.align || 'left' }}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="table-empty">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, index) => (
                            <tr
                                key={row.id || index}
                                onClick={() => onRowClick?.(row)}
                                className={onRowClick ? 'table-row-clickable' : ''}
                            >
                                {columns.map((col) => (
                                    <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
