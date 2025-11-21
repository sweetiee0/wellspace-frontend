// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage.jsx'; // Corrected Case
import Login from './pages/login.jsx'; 
import Register from './pages/Register.jsx'; 
import ForgotPassword from './pages/ForgotPassword.jsx'; // <--- CRITICAL FIX
import Dashboard from './pages/Dashboard.jsx'; 
import MenuPage from './pages/MenuPage.jsx';       
import Activity from './pages/Activity.jsx';  
import Reminders from './pages/Reminders.jsx';
import Nutrition from './pages/Nutrition.jsx';
import DiaryEntry from './pages/DiaryEntry.jsx';    
import MoodSelect from './pages/moodselect.jsx'; 

import './App.css'; 
import './index.css'; 

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<WelcomePage />} /> 
          <Route path="/login" element={<Login />} /> 
          <Route path="/register" element={<Register />} /> 
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Main App Routes */}
          <Route path="/dashboard" element={<Dashboard />} /> 
          <Route path="/menu" element={<MenuPage />} /> 
          
          {/* Feature Routes */}
          <Route path="/activity" element={<Activity />} />  
          <Route path="/nutrition" element={<Nutrition />} /> 
          <Route path="/reminders" element={<Reminders />} /> 

          {/* DIARY FLOW: Sequential routes */}
          <Route path="/diary" element={<MoodSelect />} />     
          <Route path="/diary-entry" element={<DiaryEntry />} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;