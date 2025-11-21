// src/pages/register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdOutlineMailOutline } from 'react-icons/md';
import { RiLockPasswordLine } from 'react-icons/ri';
import { FaRegUser } from 'react-icons/fa'; 
// import { registerUser } from '../services/api'; // (Uncomment when ready)

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = (e) => {
        e.preventDefault();
        const { password, confirmPassword } = formData;

        if (password !== confirmPassword) {
            return alert("Passwords do not match!");
        }
        
        // TODO: Call registerUser API here
        console.log('Attempting registration:', formData);
        alert("Registration attempt successful (Prototype Mode).");
        // navigate('/'); 
    };

    return (
        <div className="login-container">
            <div className="header">
                <h1 className="title">We Say Hello!</h1>
                <p className="subtitle">Create an account to track your health habits</p>
            </div>

            <form onSubmit={handleRegister} className="auth-form">
                
                {/* INPUT USERNAME */}
                <div className="input-group-icon">
                    <FaRegUser className="input-icon" />
                    <input 
                        type="text" 
                        name="username"
                        placeholder="Username" 
                        value={formData.username}
                        onChange={handleChange}
                        required 
                    />
                </div>

                {/* INPUT EMAIL */}
                <div className="input-group-icon">
                    <MdOutlineMailOutline className="input-icon" />
                    <input 
                        type="email" 
                        name="email"
                        placeholder="Email Address" 
                        value={formData.email}
                        onChange={handleChange}
                        required 
                    />
                </div>

                {/* CREATE PASSWORD */}
                <div className="input-group-icon">
                    <RiLockPasswordLine className="input-icon" />
                    <input 
                        type="password" 
                        name="password"
                        placeholder="Create Password" 
                        value={formData.password}
                        onChange={handleChange}
                        required 
                    />
                </div>

                {/* RETYPE PASSWORD */}
                <div className="input-group-icon">
                    <RiLockPasswordLine className="input-icon" />
                    <input 
                        type="password" 
                        name="confirmPassword"
                        placeholder="Retype Password" 
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required 
                    />
                </div>

                {/* REGISTER BUTTON - FIXING THE STYLE */}
                <button type="submit" className="btn-primary">Register</button>
            </form>

            <div className="footer-link">
                <p>Already Have an Account? <Link to="/login">Enter</Link></p>
            </div>
        </div>
    );
};

export default Register;