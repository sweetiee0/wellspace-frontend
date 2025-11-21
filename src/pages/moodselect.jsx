// src/pages/moodselect.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MoodSelect = () => {
    const [selectedMood, setSelectedMood] = useState(null);
    const navigate = useNavigate();

    // Options based on the sun/clouds wireframe
    const moodOptions = [
        { key: 'Happy', emoji: '☀️' },
        { key: 'Angry', emoji: '⛈️' },
        { key: 'Calm', emoji: '☁️' },
        { key: 'Sad', emoji: '🌧️' },
    ];

    // CRITICAL: Auto-Navigation function
    const handleMoodSelect = (moodKey) => {
        // 1. Set the mood state locally
        setSelectedMood(moodKey);
        
        // 2. Navigate immediately to the entry page, passing the mood state via location state
        navigate('/diary-entry', { state: { mood: moodKey } });
    };

    // Reusable component for each mood card (uses App.css .mood-card styles)
    const MoodCard = ({ option }) => (
        <button 
            key={option.key}
            type="button" 
            className={`mood-card ${selectedMood === option.key ? 'selected-mood' : ''}`}
            onClick={() => handleMoodSelect(option.key)} // <-- Auto-Navigates on click
        >
            <span className="mood-emoji">{option.emoji}</span>
            <span className="mood-label">{option.key}</span>
        </button>
    );

    return (
        <div className="diary-container container-style">
            <header className="header-style">
                <h1 className="title-style">💭 Mood & Wellness Diary</h1>
            </header>
            
            <div className="diary-header-quote">
                <p>How do you feel today?</p>
            </div>
            
            {/* Grid for Mood Cards */}
            <div className="mood-selection-grid-container">
                <div className="mood-selection-grid">
                    {moodOptions.map((option) => (
                        <MoodCard key={option.key} option={option} />
                    ))}
                </div>
            </div>
            
            {/* Display the Sun/Emoji image placeholder */}
            <div className="mood-sun-image-wrapper" style={{marginTop: '40px'}}>
                 <img src="/sun-happy.png" alt="Happy Sun" className="sun-image" style={{maxWidth: '150px'}} />
            </div>
        </div>
    );
};

export default MoodSelect;