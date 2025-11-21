// src/pages/weeklyprogress.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const WeeklyProgress = () => {
    const navigate = useNavigate();

    // Mock data for the cards, based on the design (Run, Water, Step, Sleep)
    const weeklyMetrics = [
        { title: 'Run Distance', progress: 75, comparison: 'Last week: 60%', color: '#E91E63' },
        { title: 'Water Intake', progress: 92, comparison: 'Last week: 90%', color: '#5E35B1' },
        { title: 'Step Count', progress: 50, comparison: 'Last week: 50%', color: '#E91E63' },
        { title: 'Sleep Hours', progress: 82, comparison: 'Last week: 80%', color: '#5E35B1' },
    ];

    // Reusable Progress Ring Component (Relies on App.css styling)
    const ProgressRing = ({ percentage, color }) => (
        <div className="progress-ring-container" style={{ 
            borderColor: color + '30', 
            borderLeftColor: color, 
            borderTopColor: color, 
            borderRightColor: color,
            width: '65px', 
            height: '65px' 
        }}>
            <span className="progress-ring-value" style={{ color: color }}>{percentage}%</span>
        </div>
    );

    const handleBack = () => { navigate('/menu'); }; 

    return (
        <div className="dashboard-page-container">
            {/* --- Top Header --- */}
            <header className="dashboard-header-style">
                <button onClick={handleBack} className="menu-icon-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </button>
                <h1 className="header-title-style" style={{marginLeft: '20px'}}>Weekly Progress</h1>
                {/* Search/Menu Icon Placeholder */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </header>

            {/* --- Main Content --- */}
            <main className="dashboard-main-content">
                <h2 className="dashboard-main-title" style={{color: '#333', textAlign: 'left', marginBottom: '40px'}}>Progress Snapshot</h2>
                
                {/* --- Stacked Progress Cards (The Display) --- */}
                <div className="stacked-cards">
                    {weeklyMetrics.map((metric, index) => (
                        <div key={index} className="progress-card-wrapper">
                            
                            {/* Left Side: Ring */}
                            <ProgressRing 
                                percentage={metric.progress} 
                                color={index % 2 === 0 ? '#E91E63' : '#5E35B1'}
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

export default WeeklyProgress;