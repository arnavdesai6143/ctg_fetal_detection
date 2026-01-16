import Navbar from './Navbar';
import './Layout.css';

const Layout = ({ children, showNavbar = true }) => {
    return (
        <div className="layout">
            {showNavbar && <Navbar />}
            <main className="layout-main">
                {children}
            </main>
        </div>
    );
};

export default Layout;
