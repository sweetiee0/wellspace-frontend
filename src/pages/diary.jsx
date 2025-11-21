// src/pages/diary.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Diary = () => {
    const [content, setContent] = useState('');
    const [mood, setMood] = useState('Happy'); // Assumed mood from previous screen (e.g., Happy)
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Call createEntry API here (Final API connection)
        console.log('Final Entry:', content, 'Mood:', mood);
        alert(`Diary Saved with Mood: ${mood}`);
        // After successful save, navigate back to the dashboard or menu
        navigate('/dashboard'); 
    };

    return (
        <div className="diary-container container-style">
            <header className="diary-visual-header">
                {/* Image of the girl with flowers in her head */}
                <div className="diary-image-wrapper">
                    <img 
                        src="/mood-flower-girl.png" // Assuming this file exists in /public/
                        alt="Wellness Illustration" 
                        className="diary-hero-image"
                    />
                </div>
            </header>
            
            <form onSubmit={handleSubmit} className="diary-form-style">
                
                {/* Quote Block */}
                <div className="diary-quote-block">
                    <p className="quote-text">“Each thought you write is a step toward peace”</p>
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
                
                {/* Save Button (Pink/Magenta color as per wireframe) */}
                <button type="submit" className="btn-primary-feature diary-save-btn">Save</button>
            </form>
        </div>
    );
};

export default Diary;