// src/pages/login.jsx
import React, { useState } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import { MdOutlineMailOutline } from 'react-icons/md'; 
import { RiLockPasswordLine } from 'react-icons/ri';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: Connect to backend API
    console.log("Attempting login with:", email, password);
    navigate('/menu'); 
  };

  return (
    // Pastikan container utama guna login-container class
    <div className="login-container"> 
      <div className="header">
        <h1 className="title">We Say Hello!</h1>
        <p className="subtitle">Welcome back. Use your email and password to login</p>
      </div>

      <form onSubmit={handleLogin} className="auth-form">
        
        {/* INPUT EMAIL - MESTI GUNA input-group-icon class */}
        <div className="input-group-icon"> 
          <MdOutlineMailOutline className="input-icon" />
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>

        {/* INPUT PASSWORD - MESTI GUNA input-group-icon class */}
        <div className="input-group-icon">
          <RiLockPasswordLine className="input-icon" />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>

        {/* FORGOT PASSWORD LINK - MESTI GUNA forgot-pass class */}
        <div className="forgot-pass">
            <Link to="/forgot-password" style={{textDecoration: 'none', color: '#d32f2f', fontWeight: '600'}}>
                Forgot Password?
            </Link>
        </div>

        {/* LOGIN BUTTON - MESTI GUNA btn-primary class */}
        <button type="submit" className="btn-primary">Log In</button> 
      </form>

      <div className="footer-link">
        <p>Don't Have an Account? <Link to="/register">Sign Up</Link></p>
      </div>
    </div>
  );
};

export default Login;