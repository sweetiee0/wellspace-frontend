// src/pages/history.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const HistoryPage = () => {
    const navigate = useNavigate();
    
    // Mock data based on combined logs
    const recentLogs = [
        { type: 'Diary', entry: 'Felt calm and productive.', date: '2025-11-20', color: '#8A2BE2' },
        { type: 'Activity', entry: 'Logged 30 minutes run.', date: '2025-11-20', color: '#E91E63' },
        { type: 'Nutrition', entry: 'Logged 450 kcal lunch.', date: '2025-11-19', color: '#FFD700' },
        { type: 'Diary', entry: 'Growth often follows storms.', date: '2025-11-19', color: '#8A2BE2' },
    ];
    
    const handleBack = () => { navigate('/menu'); }; 

    return (
        <div className="history-page-container container-style">
            <header className="header-style">
                <button onClick={handleBack} className="menu-icon-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </button>
                <h1 className="title-style" style={{marginLeft: '20px'}}>Unified History</h1>
            </header>

            <main className="history-main-content">
                <h2 style={{color: '#333', textAlign: 'left', marginBottom: '20px'}}>Recent Logs</h2>
                
                <div className="logs-list-wrapper">
                    {recentLogs.map((log, index) => (
                        <div key={index} className="log-card" style={{borderColor: log.color}}>
                            <span className="log-type" style={{color: log.color}}>{log.type}</span>
                            <p className="log-entry">{log.entry}</p>
                            <span className="log-date">{log.date}</span>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default HistoryPage;