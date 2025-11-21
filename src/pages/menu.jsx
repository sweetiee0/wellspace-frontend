// src/pages/menu.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const MenuPage = () => {
    const navigate = useNavigate();
    
    // Function to handle navigating back (Placeholder, typically links to Dashboard)
    const handleBack = () => { navigate('/dashboard'); }; 
    
    return (
        <div className="menu-page-container">
            <header className="menu-header-style">
                {/* Back Arrow (Visual Placeholder) */}
                <button onClick={handleBack} className="menu-icon-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </button>
                
                <h1 className="health-title">HEALTH</h1>
                
                {/* Hamburger Icon */}
                <button className="menu-icon-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
            </header>

            <main className="menu-main-content-wrapper">
                {/* Search Bar */}
                <div className="search-wrapper">
                    <input type="search" placeholder="Search..." className="search-bar-input" />
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position: 'absolute', right: '15px', top: '15px'}}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                
                {/* Menu Buttons (Linking to the core features) */}
                <div className="menu-button-group">
                    <Link to="/activity" className="menu-btn-large">ACTIVITY</Link>
                    <Link to="/nutrition" className="menu-btn-large">NUTRITION LOG</Link>
                    <Link to="/reminders" className="menu-btn-large">REMINDERS</Link>
                    <Link to="/diary" className="menu-btn-large">MOOD & WELLNESS DIARY</Link>
                    <Link to="/weekly-progress" className="menu-btn-large">WEEKLY PROGRESS</Link> {/* <-- NEW BUTTON ADDED */}
                </div>
            </main>
            
            {/* Arrows for bottom navigation (Visual Placeholder) */}
            <div className="menu-bottom-nav-arrows">
                <span className="arrow-left">←</span>
                <span className="arrow-right">→</span>
            </div>
        </div>
    );
};

export default MenuPage;