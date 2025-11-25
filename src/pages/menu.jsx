import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Komponen Card Kecil yang Boleh Digunakan Semula
const FeatureCard = ({ title, description, icon, bgColor, linkTo }) => (
    <Link to={linkTo} className="feature-card" style={{ backgroundColor: bgColor }}>
        <div className="card-header-icon">
            {icon}
            <span className="card-title">{title}</span>
        </div>
        <p className="card-description">{description}</p>
        <div className="check-link">
            CHECK 
            {/* Ikon panah kanan */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </div>
    </Link>
);

const MenuPage = () => {
    const navigate = useNavigate();

    // Data Mock untuk Butiran Nutrisi (Boleh diganti dengan data sebenar)
    const nutritionData = {
        meal: "Breakfast",
        calories: 340,
        proteins: 62.5,
        fats: 23.1,
        carbs: 53.6,
        rdc: 12,
    };

    const cardData = [
        {
            title: "ACTIVITY GOAL",
            description: "Track your runs and steps. Stay active, keep focused.",
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
            ),
            bgColor: "#FFECEC", // Light Red/Pink
            linkTo: "/activity",
        },
        {
            title: "HYDRATION & SLEEP",
            description: "Check your rest and water intake. Boost focus and energy.",
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            ),
            bgColor: "#FFF7EB", // Light Yellow
            linkTo: "/nutrition", // Menggunakan nutrition route untuk Hydration/Sleep buat masa ini
        },
        {
            title: "REMINDERS & SCHEDULE",
            description: "Don't skip meals! Manage your busy schedule.",
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            ),
            bgColor: "#E8F5E9", // Light Green
            linkTo: "/reminders",
        },
        {
            title: "WELLNESS DIARY / MOOD CHECK",
            description: "Log your feelings and manage daily stress. Enjoy life to the fullest.",
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00BCD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"></path><line x1="12" y1="17" x2="12" y2="17"></line><line x1="12" y1="11" x2="12" y2="15"></line></svg>
            ),
            bgColor: "#E0F7FA", // Light Cyan
            linkTo: "/diary",
        },
    ];

    // Butang navigasi bawah, seperti dalam gambar yang anda berikan
    const NavPill = () => (
        <div className="nav-pill-wrapper">
            {/* Aktiviti/Senaman */}
            <Link to="/activity" className="nav-pill-icon active">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 17.5a2.5 2.5 0 0 1-5 0c0-1.5 2.5-3.5 2.5-3.5s2.5 2 2.5 3.5z"></path><path d="M15.5 14v-2c0-1.7-1.3-3-3-3s-3 1.3-3 3v2"></path><path d="M12 6l-1 5 3 3"></path><path d="M15 17.5l-3 3"></path></svg>
            </Link>
            {/* Laporan/Progress (Ganti Menu lama) */}
            <Link to="/weekly-progress" className="nav-pill-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            </Link>
            {/* Home/Dashboard (Pusat) */}
            <Link to="/dashboard" className="nav-pill-icon is-home">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path></svg>
            </Link>
            {/* Notifikasi/Reminder */}
            <Link to="/reminders" className="nav-pill-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </Link>
            {/* Profil */}
            <Link to="/login" className="nav-pill-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </Link>
        </div>
    );

    return (
        <div className="new-menu-page-container">
            {/* Header Atas */}
            <header className="new-menu-header">
                <div className="profile-greeting">
                    {/* Ikon Kucing/Mascot (Contoh SVG Mudah) */}
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle><path d="M8 10s1.5 2 4 2 4-2 4-2"></path><path d="M10 8V9"></path><path d="M14 8V9"></path>
                    </svg>
                    <h1 className="welcome-text">WELCOME WENDY !</h1>
                </div>
                <div className="header-actions">
                    {/* Ikon Carian */}
                    <Link to="/menu" className="action-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </Link>
                    {/* Ikon Notifikasi (History lama) */}
                    <Link to="/history" className="action-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    </Link>
                </div>
            </header>

            {/* Kad Nutrisi Utama */}
            <div className="nutrition-card">
                <div className="nutrition-header-row">
                    <span className="meal-name">{nutritionData.meal}</span>
                    <span className="calories">{nutritionData.calories} calories</span>
                    <div className="action-icons-right">
                        <button className="icon-btn-small">+</button>
                        <button className="icon-btn-small">
                            {/* Ikon sunting */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                    </div>
                </div>

                <div className="nutrition-details-grid">
                    <div>
                        <span className="detail-label">Proteins</span>
                        <p className="detail-value">{nutritionData.proteins}</p>
                    </div>
                    <div>
                        <span className="detail-label">Fats</span>
                        <p className="detail-value">{nutritionData.fats}</p>
                    </div>
                    <div>
                        <span className="detail-label">Carbs</span>
                        <p className="detail-value">{nutritionData.carbs}</p>
                    </div>
                    <div>
                        <span className="detail-label">RDC</span>
                        <p className="detail-value rdc-value">{nutritionData.rdc}%</p>
                    </div>
                </div>

                <div className="nutrition-footer-row">
                    <p className="today-dropdown">Today ˅</p>
                    <Link to="/weekly-progress" className="see-progress-link">See Progress</Link>
                </div>
            </div>

            {/* Grid Butang Ciri (4 Kad) */}
            <div className="feature-card-grid">
                {cardData.map((data, index) => (
                    <FeatureCard key={index} {...data} />
                ))}
            </div>

            {/* Navigasi Bawah */}
            <NavPill />
        </div>
    );
};

export default MenuPage;