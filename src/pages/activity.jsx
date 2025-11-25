// src/pages/activity.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Activity = () => {
    const [formData, setFormData] = useState({
        type: '',
        duration: '', // in minutes
        distance: '', // in km
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submissionData = { ...formData, date: new Date().toISOString().split('T')[0] };
        
        console.log('Logging Activity:', submissionData);
        alert('Activity Logged! Navigating to Report...');
        
        // Navigate to the new report page, passing the submitted data via state
        navigate('/activity-report', { state: { report: submissionData } }); 
    };

    return (
        <div className="activity-container"> {/* <-- Uses the new floating card style */}
            <header className="header-style">
                <h1 className="title-style">🏋️ Activity Log</h1>
            </header>
            
            <form onSubmit={handleSubmit} className="form-style">
                {/* Type Selector */}
                <div className="input-group-style">
                    <label htmlFor="activity-type" className="label-style">Type of Activity:</label>
                    <select id="activity-type" name="type" value={formData.type} onChange={handleChange} required className="input-style">
                        <option value="">-- Select --</option>
                        <option value="run">Run / Walk</option>
                        <option value="step">Step Count</option>
                        <option value="gym">Gym / Strength</option>
                    </select>
                </div>
                
                {/* Duration Input */}
                <div className="input-group-style">
                    <label htmlFor="activity-duration" className="label-style">Duration (minutes):</label>
                    <input 
                        type="number" 
                        id="activity-duration" 
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        placeholder="e.g., 30" 
                        required 
                        className="input-style"
                    />
                </div>
                
                {/* Distance Input */}
                <div className="input-group-style">
                    <label htmlFor="activity-distance" className="label-style">Distance (km, optional):</label>
                    <input 
                        type="number" 
                        id="activity-distance" 
                        name="distance"
                        value={formData.distance}
                        onChange={handleChange}
                        placeholder="e.g., 5.2" 
                        className="input-style"
                    />
                </div>
                
                <button type="submit" className="btn-primary-feature">Log Activity</button>
            </form>
        </div>
    );
};

export default Activity;