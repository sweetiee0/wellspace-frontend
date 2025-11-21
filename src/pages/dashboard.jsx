// src/pages/dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();

    // Mock data for the cards, based on the inspiration image
    const weeklyMetrics = [
        { title: 'Run Distance', progress: 75, comparison: 'Last week: 60%' },
        { title: 'Water Intake', progress: 92, comparison: 'Last week: 90%' },
        { title: 'Step Count', progress: 50, comparison: 'Last week: 50%' },
        { title: 'Sleep Hours', progress: 82, comparison: 'Last week: 80%' },
    ];

    const goToMenu = () => { navigate('/menu'); }; 
    const goToLogin = () => { navigate('/login'); }; 

    // Reusable Progress Ring Component (Placeholder CSS structure)
    const ProgressRing = ({ percentage, color }) => (
        <div className="progress-ring-container" style={{ 
            borderColor: color + '30', 
            borderLeftColor: color, 
            borderTopColor: color, 
            borderRightColor: color,
            /* Dynamic sizing is simplified for prototype */
            width: '65px', 
            height: '65px' 
        }}>
            <span className="progress-ring-value" style={{ color: color }}>{percentage}%</span>
        </div>
    );

    return (
        <div className="dashboard-page-container">
            {/* --- Top Header (Includes Menu Button) --- */}
            <header className="dashboard-header-style">
                {/* Back Arrow */}
                <div className="header-icon-wrapper">
                    <svg onClick={goToLogin} className="icon-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </div>
                <h1 className="header-title-style">HEALTH</h1>
                {/* Hamburger Icon */}
                <button onClick={goToMenu} className="menu-icon-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
            </header>

            {/* --- Main Content --- */}
            <main className="dashboard-main-content">
                <h2 className="dashboard-main-title" style={{color: '#333', textAlign: 'left', marginBottom: '40px'}}>Weekly Progress</h2>
                
                {/* --- Stacked Progress Cards (The display) --- */}
                <div className="stacked-cards">
                    {weeklyMetrics.map((metric, index) => (
                        <div key={index} className="progress-card-wrapper">
                            
                            {/* Left Side: Ring */}
                            <ProgressRing 
                                percentage={metric.progress} 
                                color={index % 2 === 0 ? '#E91E63' : '#5E35B1'} /* Pink and Purple colors */
                            />

                            {/* Right Side: Info */}
                            <div className="progress-info">
                                <p className="progress-metric-title">{metric.title}</p>
                                <p className="progress-metric-comparison">{metric.comparison}</p>
                            </div>
                            
                            {/* Arrow Indicator */}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;