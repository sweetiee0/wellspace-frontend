// src/pages/welcome.jsx
import React from 'react'; 
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
    const navigate = useNavigate();
    const mainRed = '#D50000'; 

    const handleSkip = () => {
        navigate('/login'); 
    };

    return (
        <div className="welcome-container">
            
            {/* Status Bar Placeholder */}
            <div style={{ height: '30px', width: '100%', marginBottom: '20px' }}></div>

            {/* Logo and Header Text */}
            <h1 className="welcome-title">
                WellSpace
            </h1>
            <h2 className="welcome-header">
                Your Daily Habit Companion
            </h2>

            {/* Main Image - (Assumes /public/welcome.png is correct) */}
            <div className="welcome-image-area">
                <img 
                    src="/welcome.png" 
                    alt="Person working at a desk" 
                    className="welcome-image" 
                />
            </div>

            {/* Footer Quote/Text */}
            <div className="welcome-text-block">
                <p className="big-text">
                    Small Your Day, big changes.
                </p>
                <p className="small-text">
                    Log meals, Hydrate & You've got this!
                </p>
            </div>

            {/* Skip/Navigation Footer (Fixed to Bottom) */}
            <div className="welcome-footer">
                {/* Dots */}
                <div className="nav-dots">
                    <div className="dot inactive-dot"></div>
                    <div className="dot active-dot"></div>
                </div>
                
                {/* Skip Button (Functional) */}
                <button onClick={handleSkip} className="skip-btn-wrapper">
                    <span className="skip-text">
                        Skip
                    </span>
                    {/* Arrow Icon */}
                    <div className="arrow-circle">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M10 17l5-5-5-5v10z"/></svg>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default WelcomePage;