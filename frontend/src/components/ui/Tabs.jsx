import { useState } from 'react';
import './Tabs.css';

const Tabs = ({
    tabs = [],
    defaultTab,
    onChange,
    className = '',
}) => {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        onChange?.(tabId);
    };

    const activeContent = tabs.find(tab => tab.id === activeTab)?.content;

    return (
        <div className={`tabs-container ${className}`}>
            <div className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => handleTabClick(tab.id)}
                        disabled={tab.disabled}
                    >
                        {tab.icon && <span className="tab-icon">{tab.icon}</span>}
                        {tab.label}
                        {tab.badge && <span className="tab-badge">{tab.badge}</span>}
                    </button>
                ))}
            </div>
            <div className="tab-content">
                {activeContent}
            </div>
        </div>
    );
};

export default Tabs;
