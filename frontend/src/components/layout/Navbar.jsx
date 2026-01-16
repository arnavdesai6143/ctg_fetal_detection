import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const location = useLocation();

    const navLinks = [
        { path: '/dashboard', label: 'CTG Insight™', isLogo: true },
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/patients', label: 'Patients' },
        { path: '/reports', label: 'Reports' },
        { path: '/models', label: 'Models' },
        ...(isAdmin ? [{ path: '/admin', label: 'Admin' }] : []),
    ];

    const isActive = (path) => {
        if (path === '/dashboard' && location.pathname === '/dashboard') return true;
        if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-left">
                    {navLinks.map((link, index) => (
                        link.isLogo ? (
                            <Link key={index} to={link.path} className="navbar-logo">
                                <span className="logo-icon">🏥</span>
                                <span className="logo-text">{link.label}</span>
                            </Link>
                        ) : (
                            <Link
                                key={index}
                                to={link.path}
                                className={`navbar-link ${isActive(link.path) ? 'active' : ''}`}
                            >
                                {link.label}
                            </Link>
                        )
                    ))}
                </div>

                <div className="navbar-right">
                    <Link to="/about" className="navbar-link">
                        About
                    </Link>

                    {user && (
                        <div className="navbar-user">
                            <div className="user-avatar">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user.name}</span>
                                <span className="user-role">{user.role}</span>
                            </div>
                            <button className="navbar-logout" onClick={logout}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
