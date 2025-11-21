// src/pages/forgotpassword.jsx
import React, { useState } from 'react'; 
import { Link } from 'react-router-dom';

const forgotpassword = () => {
  const [identifier, setIdentifier] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Sending reset link to:", identifier);
    alert("Reset link sent (Prototype Mode)");
  };

  return (
    <div className="login-container">
      <div className="header">
        <h1 className="title" style={{color: '#d50000'}}>OoPpss!!!</h1>
        <p className="subtitle" style={{color: '#666', marginBottom: '10px'}}>
            Enter your email, phone, or username and we'll send you a link to change a new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Username, Email or Phone Number" 
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required 
          />
        </div>

        <button type="submit" className="btn-primary" style={{backgroundColor: '#e91e63'}}>Send Reset Link</button>
      </form>

      <div className="footer-link" style={{marginTop: '20px'}}>
        <p>Remember your password? <Link to="/">Go Back to Login</Link></p>
      </div>
    </div>
  );
};

export default ForgotPassword;
