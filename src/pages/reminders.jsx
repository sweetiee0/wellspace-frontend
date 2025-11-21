// src/pages/reminders.jsx
import React, { useState } from 'react';

const Reminders = () => {
    const [alerts, setAlerts] = useState({
        breakfast: true, 
        activity: false,
        water: true,
        lunch: false,
    });

    const handleChange = (e) => {
        setAlerts({ ...alerts, [e.target.name]: e.target.checked });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Saving Reminders:', alerts);
        alert('Reminders Saved!');
    };

    const IconMapping = {
        // Placeholder icons from previous context
        breakfast: () => <span style={{fontSize: '1.5rem'}}>🍽️</span>,
        activity: () => <span style={{fontSize: '1.5rem'}}>🏃</span>,
        water: () => <span style={{fontSize: '1.5rem'}}>💧</span>,
        lunch: () => <span style={{fontSize: '1.5rem'}}>⏰</span>,
    };

    const ReminderToggle = ({ name, label }) => {
        const Icon = IconMapping[name];
        return (
            <div className="reminder-toggle-item">
                <div className="icon-label-wrapper">
                    <Icon className="reminder-icon" />
                    <span className="metric-label">{label}</span>
                </div>
                {/* Custom Toggle Switch (relies on App.css styles) */}
                <label className="switch">
                    <input type="checkbox" name={name} checked={alerts[name]} onChange={handleChange} />
                    <span className="slider round"></span> 
                </label>
            </div>
        );
    };

    return (
        <div className="reminders-container container-style">
            <header className="header-style">
                <h1 className="title-style">🔔 Set Reminders</h1>
            </header>

            <form onSubmit={handleSubmit} className="form-style toggle-form">
                <ReminderToggle name="breakfast" label="Breakfast Alert" />
                <ReminderToggle name="lunch" label="Lunch Alert" />
                <ReminderToggle name="water" label="Hourly Water Reminder" />
                <ReminderToggle name="activity" label="Activity Alert" />
                
                <button type="submit" className="btn-primary-feature save-btn">Save Reminders</button>
            </form>
            
        </div>
    );
};

export default Reminders;