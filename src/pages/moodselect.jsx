// src/pages/moodselect.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MoodSelect = () => {
    const [selectedMood, setSelectedMood] = useState(null);
    const navigate = useNavigate();

    // Options based on the sun/clouds wireframe
    const moodOptions = [
        { key: 'Happy', label: 'Happy', icon: '☀️' }, 
        { key: 'Angry', label: 'Angry', icon: '⛈️' },
        { key: 'Calm', label: 'Calm', icon: '☁️' },
        { key: 'Sad', label: 'Sad', icon: '🌧️' },
    ];

    const handleMoodSelect = (moodKey) => {
        setSelectedMood(moodKey);
        // Navigate immediately to the entry page, passing the mood state
        navigate('/diary-entry', { state: { mood: moodKey } });
    };

    // Reusable component for each mood card
    const MoodCard = ({ option }) => (
        <button 
            key={option.key}
            type="button" 
            className={`new-mood-card ${selectedMood === option.key ? 'selected-mood-new' : ''}`}
            onClick={() => handleMoodSelect(option.key)} 
        >
            <span className="mood-emoji-new">{option.icon}</span>
            <span className="mood-label-new">{option.label}</span>
        </button>
    );

    return (
        // MENGGUNAKAN CLASS LOGIN-CONTAINER UNTUK FLOATING EFFECT
        <div className="login-container" style={{ height: 'auto', flexGrow: 'unset', justifyContent: 'flex-start', margin: '40px auto' }}>
            <header className="header-style" style={{textAlign: 'center'}}>
                <h1 className="title-style">💭 Mood & Wellness Diary</h1>
            </header>
            
            <div className="mood-header-text">
                <p>How do you feel today?</p>
            </div>
            
            {/* Display the cute main emoji/icon placeholder */}
            <div className="main-mood-visual" style={{marginBottom: '30px'}}>
                 <span className="cute-emoji">😊</span> 
            </div>

            {/* The 2x2 Selection Grid */}
            <div className="new-mood-selection-grid">
                {moodOptions.map((option) => (
                    <MoodCard key={option.key} option={option} />
                ))}
            </div>
            
            {/* Spacer at the bottom */}
            <div style={{height: '30px'}}></div> 
        </div>
    );
};

export default MoodSelect;