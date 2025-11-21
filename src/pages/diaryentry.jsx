// src/pages/diaryentry.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DiaryEntry = () => {
    // Retrieve the mood selected from the previous page's state
    const location = useLocation();
    const navigate = useNavigate();
    const mood = location.state?.mood || 'Neutral'; 

    const [content, setContent] = useState('');
    
    // 1. Data Structure: Map of Quotes by Mood
    const MOOD_QUOTES = {
        Happy: "Your energy is contagious; keep shining bright!",
        Angry: "A moment of patience in a moment of anger prevents a hundred moments of regret.",
        Calm: "Peace begins when expectation ends.",
        Sad: "Remember, growth often follows the quietest storms.",
        Neutral: "Write a little, smile a lot. Every word helps.", 
    };

    // Get the dynamic quote based on the selected mood
    const currentQuote = MOOD_QUOTES[mood] || MOOD_QUOTES.Neutral;

    const handleSubmit = (e) => {
        e.preventDefault();
        // The final API call will use both the 'mood' (from state) and 'content' (from form)
        console.log('Final Entry:', content, 'Mood:', mood);
        // TODO: Call createEntry API here
        alert(`Diary Saved! Mood: ${mood}`);
        navigate('/dashboard'); 
    };

    return (
        <div className="diary-entry-container container-style">
            <header className="diary-visual-header">
                {/* Image of the girl with flowers in her head (Visual from wireframe) */}
                <div className="diary-image-wrapper">
                    <img 
                        src="/mood-flower-girl.png" // Assumed asset from previous turns
                        alt="Wellness Illustration" 
                        className="diary-hero-image"
                    />
                </div>
            </header>
            
            <form onSubmit={handleSubmit} className="form-style entry-form">
                
                {/* Quote Block (NOW DYNAMIC) */}
                <div className="diary-quote-block">
                    {/* Display the quote based on the MOOD state */}
                    <p className="quote-text">“{currentQuote}”</p> 
                    <p style={{fontSize: '0.85rem', color: '#8A2BE2', marginTop: '5px'}}>— Current Mood: {mood}</p>
                </div>
                
                {/* Text Area Input */}
                <textarea
                    placeholder="Type your feelings..."
                    rows="8"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className="diary-textarea input-style"
                />
                
                {/* Save Button */}
                <button type="submit" className="btn-primary-feature diary-save-btn">Save</button>
            </form>
        </div>
    );
};

export default DiaryEntry;