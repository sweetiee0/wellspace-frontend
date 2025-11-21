// src/pages/weeklyprogress.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const WeeklyProgress = () => {
    const navigate = useNavigate();
    
    // Fungsi untuk kembali ke menu
    const handleBack = () => { navigate('/menu'); }; 

    return (
        <div className="menu-container-page" style={{textAlign: 'center', padding: '40px'}}>
            <header className="menu-header-style" style={{justifyContent: 'flex-start', marginBottom: '40px'}}>
                <button onClick={handleBack} className="menu-icon-btn">
                    {/* Back Arrow Icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </button>
                <h1 className="health-title" style={{marginLeft: '20px'}}>WEEKLY PROGRESS</h1>
            </header>
            
            <main>
                <p style={{fontSize: '1.4rem', color: '#5e35b1', fontWeight: 'bold'}}>
                    This page will display your final circular progress report.
                </p>
                <p style={{marginTop: '15px'}}>
                    Data is loaded from your backend Activity and Diary logs.
                </p>
                <p style={{marginTop: '15px', color: '#D32F2F', fontWeight: '700'}}>
                    (You can design the progress rings here!)
                </p>
            </main>
        </div>
    );
};

export default WeeklyProgress;