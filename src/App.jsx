// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './pages/welcome.jsx'; 
import Login from './pages/login.jsx'; 
import Register from './pages/register.jsx'; 
import ForgotPassword from './pages/ForgotPassword.jsx';
import Dashboard from './pages/dashboard.jsx'; 
import MenuPage from './pages/menu.jsx';      
import Activity from './pages/activity.jsx';  
import Reminders from './pages/reminders.jsx';
import Nutrition from './pages/nutrition.jsx';
import DiaryEntry from './pages/diaryentry.jsx';    
import MoodSelect from './pages/moodselect.jsx'; 
import ActivityReport from './pages/ActivityReport.jsx';
import WeeklyProgress from './pages/weeklyprogress.jsx'; 

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
          
          {/* Main App Routes (Accessed after login) */}
          <Route path="/dashboard" element={<Dashboard />} /> 
          <Route path="/menu" element={<MenuPage />} /> 
          
          {/* 1. Activity Flow (Logging and Report) */}
          <Route path="/activity" element={<Activity />} />  
          <Route path="/activity-report" element={<ActivityReport />} /> 
          
          {/* 2. Standard Feature Routes */}
          <Route path="/nutrition" element={<Nutrition />} /> 
          <Route path="/reminders" element={<Reminders />} /> 
          <Route path="/weekly-progress" element={<WeeklyProgress />} /> 

          {/* 3. Diary Flow (Sequential Selection) */}
          <Route path="/diary" element={<MoodSelect />} />     
          <Route path="/diary-entry" element={<DiaryEntry />} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;