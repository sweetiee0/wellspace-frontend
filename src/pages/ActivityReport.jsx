// src/pages/ActivityReport.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ActivityReport = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const reportData = location.state?.report; // Terima data yang dihantar dari Activity Log

    if (!reportData) {
        return (
            <div className="report-container-style" style={{textAlign: 'center', marginTop: '50px'}}>
                <h1>No Data Found</h1>
                <p>Please log an activity first.</p>
                <button onClick={() => navigate('/activity')} className="btn-primary-feature" style={{marginTop: '20px'}}>Go to Activity Log</button>
            </div>
        );
    }

    // Pengiraan untuk paparan
    const totalTimeHours = (reportData.duration / 60).toFixed(2);
    const activityName = reportData.type.toUpperCase();
    const distanceDisplay = reportData.distance ? `${reportData.distance} km` : 'N/A';

    return (
        <div className="daily-report-container">
            <header className="report-header">
                <button onClick={() => navigate('/menu')} className="back-btn">
                    {/* Back Arrow Icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </button>
                <h1 className="report-title">Daily Report</h1>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </header>
            
            <main className="report-main">
                {/* --- Circular Infographic (Placeholder) --- */}
                <div className="infographic-ring-wrapper">
                    <div className="infographic-center-text">
                        <p className="infographic-time">{totalTimeHours} hrs</p>
                        <p className="infographic-date">{reportData.date}</p>
                    </div>
                    <div className="circular-ring-placeholder"></div>
                </div>

                {/* --- Activity Details List --- */}
                <h2 className="details-header">Activity Details</h2>
                <div className="details-list">
                    {/* Example Detail Card (Focus on logged activity) */}
                    <div className="detail-card">
                        <span className="detail-icon">🏃</span>
                        <div className="detail-info">
                            <p className="detail-name">{activityName}</p>
                            <div className="progress-bar-placeholder"></div>
                            <p className="detail-yesterday">Duration: {reportData.duration} min</p>
                        </div>
                        <span className="detail-time">Distance: {distanceDisplay}</span>
                    </div>
                    
                    <p className="placeholder-note" style={{fontSize: '0.9rem', color: '#666', marginTop: '15px'}}>
                        Other metrics (Sleep, Commute, etc.) would be loaded here from a full API call.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default ActivityReport;