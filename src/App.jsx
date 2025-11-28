import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// ✅ Import Firebase dari fail firebase.js yang kita buat tadi
import { auth, db } from './firebase'; 
import firebase from 'firebase/compat/app';

// Mengimport semua ikon dari Lucide React
import { 
    Search, Bell, Plus, Edit2, Zap, Utensils,
    Activity, MoonStar, CheckSquare, Settings, LogIn, UserPlus, Home, Clock, ChevronDown, Droplet, Footprints, X, Mail, Lock, User, Bike, Dribbble, Dumbbell, Flame, Watch, MessageSquareText, Edit, ListChecks, ArrowLeft, TrendingUp, 
    Trash2, 
    Camera // <--- Tambah yang ni di hujung (jangan lupa koma)
} from 'lucide-react';

// ====================================================================
// --- GEMINI API INTEGRATION FUNCTION ---
// ====================================================================

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=";
const API_KEY = "AIzaSyAp95l2ZP-AHQy02-tHurNsIPO5RdzLE_Y"; // 🔴 MASUKKAN GEMINI API KEY ANDA DI SINI

const fetchGeminiResponse = async (prompt, systemInstruction) => {
    if (!API_KEY) return "Sila masukkan API Key dalam kod.";

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
    };

    // Implementasi retry dengan exponential backoff
    const maxRetries = 3;
    let delay = 1000;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(GEMINI_API_URL + API_KEY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                if (i < maxRetries - 1) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                } else {
                    const errorBody = await response.json();
                    console.error("Gemini API final attempt failed:", errorBody);
                    return "Maaf, Gemini gagal menjana respons selepas beberapa kali cuba.";
                }
            }
            
            const result = await response.json();
            return result.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, Gemini gagal menjana respons.";

        } catch (error) {
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; 
            } else {
                console.error("Gemini API call failed after retries:", error);
                return "Ralat sambungan AI. Sila cuba sebentar lagi.";
            }
        }
    }
};

// ====================================================================
// --- 2. QUOTES & DATA & NUTRITION LOGIC ---
// ====================================================================

const QUOTES_BY_MOOD = {
    Happy: {
        quote: "Happiness is not something readymade. It comes from your own actions.",
        color: "#2E7D32" // Hijau
    },
    Angry: {
        quote: "Don't let yesterday take up too much of today.",
        color: "#D32F2F" // Merah
    },
    Tired: {
        quote: "Rest and self-care are so important. When you take time to replenish your spirit, it allows you to serve others from the overflow.",
        color: "#1976D2" // Biru
    },
    Stressed: {
        quote: "Each thought you write is a step toward peace. Take a deep breath and let it all out.",
        color: "#5E35B1" // Ungu
    }
};

const getQuote = (mood) => QUOTES_BY_MOOD[mood] || QUOTES_BY_MOOD.Happy;

// --- AI NUTRITION CALCULATOR ---
const analyzeFoodWithAI = async (foodInput) => {
    // Arahan kepada Gemini
    const prompt = `
        You are a professional Nutritionist.
        Analyze this food/drink list: "${foodInput}".
        
        Calculate the TOTAL estimated nutritional value for a standard Malaysian serving size.
        
        IMPORTANT rules:
        1. If the user enters nothing or nonsense, return 0 for all values.
        2. Estimate based on 1 serving if quantity is not specified.
        3. Determine if the meal is generally "Healthy" (true/false).
        
        RETURN ONLY RAW JSON (No markdown, no explanation):
        {
            "calories": 0,
            "proteins": 0,
            "fats": 0,
            "carbs": 0,
            "isHealthy": boolean
        }
    `;

    try {
        // Panggil Gemini
        const resultText = await fetchGeminiResponse(prompt, "You are a JSON data generator.");
        
        // Bersihkan format JSON (buang ```json jika ada)
        const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);
        
        return {
            meal: foodInput,
            calories: data.calories || 0,
            proteins: data.proteins || 0,
            fats: data.fats || 0,
            carbs: data.carbs || 0,
            isHealthy: data.isHealthy,
            rdc: 0 // Ini akan dikira di Dashboard nanti
        };

    } catch (error) {
        console.error("AI Nutrition Error:", error);
        alert("AI tak dapat baca makanan tu. Sila cuba ayat lain.");
        return null;
    }
};

// ====================================================================
// --- NUTRITION LOGGING MODAL ---
// ====================================================================
const NutritionModal = ({ onClose, onLogMeal, mealTime }) => {
    const [foodInput, setFoodInput] = useState('');
    const [status, setStatus] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async () => {
        // Validasi Input (Min 1 huruf, Max agak-agak 6 item dalam satu ayat)
        if (!foodInput.trim()) {
            setStatus("Please enter at least 1 food/drink.");
            return;
        }

        setIsProcessing(true);
        setStatus('AI is analyzing your food... 🥗');

        // Panggil Fungsi AI Baru Tadi
        const nutritionData = await analyzeFoodWithAI(foodInput);

        if (nutritionData) {
            onLogMeal(nutritionData, mealTime); // Hantar data ke Dashboard
            onClose(); // Tutup modal
        } else {
            setIsProcessing(false);
            setStatus('Error. Try simplifying the food name.');
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="nutrition-modal-content">
                <div className="modal-header">
                    <h2 className="text-[#2E7D32]">Log {mealTime}</h2>
                    <X className="cursor-pointer text-gray-500" size={24} onClick={onClose} />
                </div>
                
                <p className="modal-subtitle">What did you eat? (Max 6 items recommended)</p>

                <textarea
                    placeholder="E.g., 1 Nasi Lemak, 1 Iced Milo"
                    value={foodInput}
                    onChange={(e) => {
                        setFoodInput(e.target.value);
                        setStatus('');
                    }}
                    className="food-input-textarea"
                    disabled={isProcessing}
                />
                
                <p className={`status-message ${status.includes('Error') || status.includes('Please') ? 'text-red-500' : 'text-green-600'}`}>
                    {status}
                </p>

                <button 
                    onClick={handleProcess} 
                    className="process-btn" 
                    disabled={isProcessing || !foodInput.trim()}
                >
                    {isProcessing ? 'Calculating...' : 'Calculate Nutrition'}
                </button>
            </div>
        </div>
    );
};

// ====================================================================
// --- 3. PAGES / COMPONENTS ---
// ====================================================================

// --- ActivityTrackerPage ---
const ActivityTrackerPage = ({ navigate, userId }) => {
    const appId = 'wellspace-app'; // App ID statik untuk Firestore path
    
    // State Aktiviti
    const [isTracking, setIsTracking] = useState(false);
    const [activityName, setActivityName] = useState('Cycling'); 
    const [currentDistanceKm, setCurrentDistanceKm] = useState(0.00);
    const [currentSteps, setCurrentSteps] = useState(0);
    const [currentCalories, setCurrentCalories] = useState(0);

    const [startTime, setStartTime] = useState(null); 
    const [endTime, setEndTime] = useState(null);

    const [manualStartTimeInput, setManualStartTimeInput] = useState('00:00'); 
    const [manualEndTimeInput, setManualEndTimeInput] = useState('00:00');

    const [geminiAnalysis, setGeminiAnalysis] = useState('Press "Start" to begin tracking.');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activityStatus, setActivityStatus] = useState('');

    const mockSchedule = [
        { name: 'Cycling', caloriesPerMinute: 8, icon: <Bike size={40} />, speedKMPH: 15, uiIcon: <Bike size={60} /> },
        { name: 'Running', caloriesPerMinute: 10, icon: <Footprints size={40} />, speedKMPH: 8, uiIcon: <Footprints size={60} /> },
        { name: 'Badminton', caloriesPerMinute: 6, icon: <Dribbble size={40} />, speedKMPH: 4, uiIcon: <Dribbble size={60} /> },
        { name: 'Swimming', caloriesPerMinute: 7, icon: <Dumbbell size={40} />, speedKMPH: 3, uiIcon: <Dumbbell size={60} /> },
    ];

    const saveActivityLog = useCallback(async (metrics, activity, analysis) => {
        if (!db || !userId) {
            setActivityStatus('Error: Database connection or User ID is missing.');
            return;
        }

        try {
            const collectionPath = `artifacts/${appId}/users/${userId}/activity_logs`;
            
            await db.collection(collectionPath).add({
                type: 'Activity',
                activityType: activity,
                distance: parseFloat(metrics.distance),
                distanceUnit: metrics.distanceUnit,
                calories: parseInt(metrics.calories),
                totalSteps: parseInt(metrics.totalSteps),
                durationHours: metrics.durationHours,
                analysis: analysis,
                date: firebase.firestore.FieldValue.serverTimestamp(),
                color: '#F47C7C', 
            });

            setActivityStatus(`Activity logged successfully! ${metrics.distance} ${metrics.distanceUnit}.`);
            
        } catch (error) {
            console.error("Error saving activity log:", error);
            setActivityStatus(`Error saving activity: ${error.message}`);
        }
    }, [appId, userId]);

    // FUNCTION calculateMetrics:
    const calculateMetrics = useCallback((start, end, activity) => {
        if (!start || !end) return { duration: '0h 0m 0s', distance: 0, calories: 0, distanceUnit: 'km', totalSteps: 0, durationHours: 0 };

        const durationMs = end - start;
        let durationHours = durationMs / (1000 * 60 * 60);

        if (durationHours <= 0) return { duration: '0h 0m 0s', distance: 0, calories: 0, distanceUnit: 'km', totalSteps: 0, durationHours: 0 };
        
        // Data kelajuan
        const activityData = mockSchedule.find(a => a.name === activity);
        const speedKMPH = activityData?.speedKMPH || 5; 
        const calsPerMinute = activityData?.caloriesPerMinute || 5;

        // Kira Jarak (Sentiasa dalam KM)
        let distance = durationHours * speedKMPH;
        
        // Kira Kalori & Steps berdasarkan jarak KM sebenar
        const totalMinutes = durationHours * 60;
        const activityCalories = totalMinutes * calsPerMinute;
        const steps = distance * 1300; // Purata 1300 langkah per 1 KM
        const stepsCalories = steps * 0.04; 
        const totalCaloriesBurned = activityCalories + stepsCalories;

        // Format Masa
        const hours = Math.floor(durationHours);
        const minutes = Math.floor((durationHours - hours) * 60);
        const seconds = Math.floor(((durationHours - hours) * 60 - minutes) * 60);

        return {
            duration: `${hours}h ${minutes}m ${seconds}s`,
            distance: distance.toFixed(4), // Tunjuk 4 perpuluhan supaya nampak gerak sikit
            calories: totalCaloriesBurned.toFixed(0),
            distanceUnit: 'km',
            totalSteps: Math.floor(steps),
            durationHours: durationHours,
        };
    }, [mockSchedule]);

    
    useEffect(() => {
        let interval;
        if (isTracking && startTime) {
            interval = setInterval(() => {
                const metrics = calculateMetrics(startTime, Date.now(), activityName);
                setCurrentDistanceKm(parseFloat(metrics.distance));
                setCurrentCalories(parseInt(metrics.calories));
                setCurrentSteps(parseInt(metrics.totalSteps));
            }, 1000); 
        }
        return () => clearInterval(interval);
    }, [isTracking, startTime, activityName, calculateMetrics]);


    const handleLogActivity = async () => {
        const today = new Date().toDateString();
        let actualStartTime = new Date(today + ' ' + manualStartTimeInput).getTime();
        let actualEndTime = new Date(today + ' ' + manualEndTimeInput).getTime();

        if (actualEndTime <= actualStartTime) actualEndTime += 86400000; 

        const metrics = calculateMetrics(actualStartTime, actualEndTime, activityName);
        
        if (metrics.durationHours <= 0) {
            setActivityStatus('Aktiviti mesti mempunyai durasi masa yang sah untuk log manual.');
            return;
        }
        
        setCurrentDistanceKm(parseFloat(metrics.distance));
        setCurrentCalories(parseInt(metrics.calories));
        setCurrentSteps(parseInt(metrics.totalSteps)); 
        
        setIsAnalyzing(true);
        setGeminiAnalysis("Analyzing your performance... 🤖");
        setActivityStatus("Logging manual activity and generating AI analysis...");

        const prompt = `Analyze this user's fitness performance: Activity: ${activityName}, Duration: ${metrics.durationHours} hours, Distance: ${metrics.distance} ${metrics.distanceUnit}, Calories Burned: ${metrics.calories}. Provide a concise performance analysis (1 paragraph) and one specific suggestion for improvement for the next session. Respond in English.`;
        const systemInstruction = "You are a personalized, encouraging AI Fitness Coach. Your analysis must be positive yet informative.";

        const analysis = await fetchGeminiResponse(prompt, systemInstruction);
        setGeminiAnalysis(analysis);
        setIsAnalyzing(false);

        await saveActivityLog(metrics, activityName, analysis);

        setManualStartTimeInput('00:00');
        setManualEndTimeInput('00:00');
        
        setActivityStatus('Manual Activity Logged & Analysis Ready.');
    };
    
    const handleStartStop = async (name) => {
        if (!isTracking) {
            setActivityName(name);
            setStartTime(Date.now());
            setEndTime(null);
            setIsTracking(true);
            setCurrentDistanceKm(0.00);
            setCurrentSteps(0);
            setCurrentCalories(0);
            setGeminiAnalysis('Tracking in progress. Press Stop to complete session.');
            setActivityStatus(`Tracking ${name} started.`);

        } else if (activityName === name) {
            const stopTime = Date.now();
            setEndTime(stopTime);
            setIsTracking(false);
            
            const metrics = calculateMetrics(startTime, stopTime, activityName);
            
            setCurrentDistanceKm(parseFloat(metrics.distance));
            setCurrentCalories(parseInt(metrics.calories));
            setCurrentSteps(parseInt(metrics.totalSteps)); 

            setIsAnalyzing(true);
            setGeminiAnalysis("Analyzing your performance... 🤖");
            setActivityStatus("Session stopped. Analyzing performance...");

            const prompt = `Analyze this user's fitness performance: Activity: ${activityName}, Duration: ${metrics.durationHours} hours, Distance: ${metrics.distance} ${metrics.distanceUnit}, Calories Burned: ${metrics.calories}. Provide a concise performance analysis (1 paragraph) and one specific suggestion for improvement for the next session. Respond in English.`;
            const systemInstruction = "You are a personalized, encouraging AI Fitness Coach. Your analysis must be positive yet informative.";

            const analysis = await fetchGeminiResponse(prompt, systemInstruction);
            setGeminiAnalysis(analysis);
            setIsAnalyzing(false);

            await saveActivityLog(metrics, activityName, analysis);
            
            setStartTime(null);
            setEndTime(null);
            setActivityStatus('Session Logged & Analysis Ready.');
        }
    };
    
    const timeDisplay = useMemo(() => {
        if (isTracking && startTime) {
            const currentDurationMs = Date.now() - startTime;
            const hours = Math.floor(currentDurationMs / (1000 * 60 * 60));
            const minutes = Math.floor((currentDurationMs / (1000 * 60)) % 60);
            const seconds = Math.floor((currentDurationMs / 1000) % 60);
            return `${hours}h ${minutes}m ${seconds}s`;
        }
        
        const metrics = calculateMetrics(startTime, endTime, activityName);
        if (currentDistanceKm > 0 && metrics.duration !== '0h 0m') {
             return metrics.duration;
        }
        return '0h 0m';
    }, [isTracking, startTime, endTime, activityName, currentDistanceKm, calculateMetrics]);

    const manualMetrics = useMemo(() => {
        const today = new Date().toDateString();
        const startTimestamp = new Date(today + ' ' + manualStartTimeInput).getTime();
        let endTimestamp = new Date(today + ' ' + manualEndTimeInput).getTime();
        
        if (endTimestamp <= startTimestamp) {
            endTimestamp += 86400000;
        }

        return calculateMetrics(
            startTimestamp,
            endTimestamp,
            activityName
        );
    }, [manualStartTimeInput, manualEndTimeInput, activityName, calculateMetrics]);


    const getCurrentIcon = () => {
        const activity = mockSchedule.find(a => a.name === activityName);
        return activity ? activity.uiIcon : <Activity size={60} />;
    };


    return (
        <div className="activity-page-container">
            <header className="activity-header">
                <button onClick={() => navigate('dashboard')} className="back-btn">
                    <ArrowLeft size={24} className="text-black" />
                </button>
                <h1 className="activity-title">Activity Alert</h1>
                <ChevronDown className="text-gray-500 cursor-pointer" size={24} />
            </header>

            <main className="activity-main-content">
                
                <h2 className="section-title">Activities</h2>
                
                {/* 1. KAD AKTIVITI TERKINI */}
                <div className="current-activity-card" style={{backgroundColor: '#F47C7C' }}>
                    <div className="activity-details">
                        <h3 className="activity-name">{activityName}</h3>
                        <p className="activity-distance">{currentDistanceKm.toFixed(2)} km</p>
                        <p className="activity-time">Time: {timeDisplay}</p>
                        
                        {activityStatus && <p className="text-xs font-semibold mt-2 text-white/80">{activityStatus}</p>}
                        
                        {(!isTracking && currentDistanceKm > 0 && startTime && endTime) && (
                            <button onClick={handleLogActivity} className="checkout-btn">Checkout</button>
                        )}
                    </div>
                    <div className="activity-icon-large">
                             {getCurrentIcon()}
                    </div>
                </div>

                {/* 2. KAD STATISTIK HARIAN */}
                <div className="daily-stats-card-grid">
                    <div className="stat-item">
                        <Footprints size={30} className="stat-icon-foot" />
                        <p className="stat-value-sm">{currentSteps}</p>
                        <p className="stat-label-sm">Total Steps</p>
                    </div>
                    <div className="stat-item">
                        <Flame size={30} className="stat-icon-fire" />
                        <p className="stat-value-sm">{currentCalories}</p>
                        <p className="stat-label-sm">Total Calories</p>
                    </div>
                </div>

                <h2 className="section-title mt-8">My Schedule</h2>

                {/* 3. JADUAL AKTIVITI */}
                <div className="schedule-list">
                    {mockSchedule.map((item, index) => (
                        <div key={index} className="schedule-card" style={{backgroundColor: 'white', color: 'black'}}>
                            <div className="schedule-info">
                                <span className="schedule-name">{item.name}</span>
                                <span className="cals-per-min-label">({item.caloriesPerMinute} cals/min)</span>

                                <button 
                                    onClick={() => handleStartStop(item.name)} 
                                    className={`start-btn ${isTracking && activityName === item.name ? 'stop-btn' : ''}`}
                                    style={{backgroundColor: isTracking && activityName === item.name ? '#FF69B4' : '#D32F2F'}}
                                    disabled={isTracking && activityName !== item.name}
                                >
                                    {isTracking && activityName === item.name ? 'Stop' : 'Start'}
                                </button>
                            </div>
                            <div className="schedule-icon" style={{color: '#C30000'}}>{item.icon}</div>
                        </div>
                    ))}
                </div>
                
                {/* GEMINI AI ANALISIS */}
                <div className="gemini-analysis-box">
                    <h3 className="analysis-title"><MessageSquareText size={20} className="inline-block mr-2"/> Performance Analysis</h3>
                    <p className="analysis-text">{isAnalyzing ? 'Analyzing your performance... 🤖' : geminiAnalysis}</p>
                </div>
                
                {/* LOG DURATION MANUAL */}
                <div className="time-log-container">
                    <h3 className="time-log-title"><Watch size={20} className="inline-block mr-2 text-gray-700"/> Manual Time Log</h3>
                    <p className="text-sm text-gray-600 mb-4">Log masa untuk mengira jarak & kalori.</p>
                    <div className="time-input-group">
                        <label>Start Time:</label>
                        <input type="time" value={manualStartTimeInput} onChange={(e) => setManualStartTimeInput(e.target.value)} className="time-input" />
                    </div>
                    <div className="time-input-group">
                        <label>End Time:</label>
                        <input type="time" value={manualEndTimeInput} onChange={(e) => setManualEndTimeInput(e.target.value)} className="time-input" />
                    </div>
                    
                    <div className="calculation-result">
                        <p>Duration: **{manualMetrics.duration}**</p>
                        <p>Est. Distance: **{manualMetrics.distance} {manualMetrics.distanceUnit}**</p>
                    </div>

                    <button onClick={handleLogActivity} className="log-activity-btn" disabled={manualMetrics.distance <= 0 || isAnalyzing}>
                        Log Manual Activity
                    </button>
                </div>

            </main>
        </div>
    );
};


const WelcomePage = ({ navigate }) => (
    <div className="welcome-page-container">
        <div className="welcome-card floating-card">
            <h1 className="welcome-title">Welcome to WellSpace!</h1>
            <p className="welcome-subtitle">Your personalized wellness journey starts here.</p>
            <div className="welcome-button-group">
                <button onClick={() => navigate('login')} className="btn-lg btn-login">Login</button>
                <button onClick={() => navigate('register')} className="btn-lg btn-register">Register</button>
            </div>
        </div>
    </div>
);

// --- Register Page ---
const Register = ({ navigate, setUserName, setUserEmail, isAuthReady }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [retypePassword, setRetypePassword] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        if (!isAuthReady) {
            setStatus('Firebase not ready.');
            return;
        }
        setStatus('Processing registration...');
        setIsLoading(true);

        if (!email || !password || !retypePassword) {
            setStatus('Please fill in all fields.');
            setIsLoading(false);
            return;
        }
        if (password !== retypePassword) {
            setStatus('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        try {
            await auth.createUserWithEmailAndPassword(email, password);
            setUserName(email.split('@')[0]);
            setUserEmail(email);
            setStatus('Registration successful!');
            setTimeout(() => {
                navigate('dashboard');
                setIsLoading(false);
            }, 1500);
        } catch (error) {
            console.error("Firebase Registration Error:", error);
            setStatus(`Registration Failed: ${error.message}`);
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form-card floating-card">
                <header className="header text-center">
                    <h1 className="text-red-700">We Say Hello!</h1>
                    <p className="text-gray-600">Register with your email and preferred password.</p>
                </header>
                <div className="input-group-icon">
                    <Mail className="input-icon" size={20} />
                    <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                </div>
                <div className="input-group-icon">
                    <Lock className="input-icon" size={20} />
                    <input type="password" placeholder="Create a Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                </div>
                <div className="input-group-icon">
                    <Lock className="input-icon" size={20} />
                    <input type="password" placeholder="Retype Password" value={retypePassword} onChange={(e) => setRetypePassword(e.target.value)} disabled={isLoading} />
                </div>
                <button onClick={handleRegister} className="btn-primary" disabled={isLoading}>
                    {isLoading ? 'Signing Up...' : 'Sign Up'}
                </button>
                {status && <p className="status-message-auth mt-4 text-sm font-semibold">{status}</p>}
                <div className="footer-link">
                    Already Have an Account? <a onClick={() => navigate('login')} className="text-red-500 cursor-pointer font-semibold">Enter</a>
                </div>
            </div>
        </div>
    );
};

// --- Login Page ---
const Login = ({ navigate, setUserName, setUserEmail, isAuthReady }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!isAuthReady) {
            setStatus('Firebase not ready.');
            return;
        }
        setStatus('Logging in...');
        setIsLoading(true);

        try {
            await auth.signInWithEmailAndPassword(email, password);
            setUserName(email.split('@')[0]);
            setUserEmail(email);
            setStatus('Login successful!');
            setTimeout(() => {
                navigate('dashboard');
                setIsLoading(false);
            }, 1500);
        } catch (error) {
            console.error("Firebase Login Error:", error);
            setStatus(`Login Failed: ${error.message}`);
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form-card floating-card">
                <header className="header text-center">
                    <h1 className="text-red-700">We Say Hello!</h1>
                    <p className="text-gray-600">Welcome back. Use your email and password to login</p>
                </header>
                <div className="input-group-icon">
                    <Mail className="input-icon" size={20} />
                    <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                </div>
                <div className="input-group-icon">
                    <Lock className="input-icon" size={20} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                </div>
                <div className="forgot-pass">
                    <a onClick={() => navigate('forgot-password')} className="text-red-500 cursor-pointer text-sm font-semibold">Forgot Password?</a>
                </div>
                <button onClick={handleLogin} className="btn-primary" disabled={isLoading}>
                    {isLoading ? 'Logging In...' : 'Log In'}
                </button>
                {status && <p className="status-message-auth mt-4 text-sm font-semibold">{status}</p>}
                <div className="footer-link">
                    Don't Have an Account? <a onClick={() => navigate('register')} className="text-red-500 cursor-pointer font-semibold">Sign Up</a>
                </div>
            </div>
        </div>
    );
};

// --- ForgotPasswordPage ---
const ForgotPasswordPage = ({ navigate, isAuthReady }) => {
    const [identifier, setIdentifier] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendLink = async () => {
        setStatus('Sending request...');
        setIsLoading(true);
        try {
            await auth.sendPasswordResetEmail(identifier.trim());
            setStatus('A reset link has been sent to your email.');
            setTimeout(() => {
                navigate('login');
                setIsLoading(false);
            }, 2500);
        } catch (error) {
            setStatus(`Reset Failed: ${error.message}`);
            setIsLoading(false);
        }
    };

    return (
        <div className="forgot-password-page-container">
            <div className="forgot-card">
                <header className="forgot-header">
                    <h1 className="logo-title">WELL SPACE</h1>
                    <p className="logo-subtitle">Thinking Everything</p>
                </header>
                <div className="forgot-body">
                    <h2 className="title-oopss">OoPpsss!!!</h2>
                    <h3 className="subtitle-forgot">I forgot</h3>
                    <div className="input-group-icon mt-8">
                        <User className="input-icon" size={20} />
                        <input type="email" placeholder="Email Address" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="reset-input" disabled={isLoading} />
                    </div>
                    <button onClick={handleSendLink} className="send-btn" disabled={isLoading || !identifier.trim()}>
                        {isLoading ? 'Sending...' : 'Send'}
                    </button>
                    {status && <p className={`status-message-reset mt-4 text-sm font-semibold ${status.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>{status}</p>}
                </div>
                <div className="forgot-footer">
                    Don't have an account? <a onClick={() => navigate('register')} className="register-link">Register</a>
                </div>
            </div>
        </div>
    );
};

// --- DailyChecklist ---
const DailyChecklist = () => {
    const defaultChecklist = useMemo(() => [
        { id: 1, label: 'Drink 8 glasses of water', checked: false, icon: Droplet },
        { id: 2, label: '30 minutes of activity', checked: false, icon: Footprints },
        { id: 3, label: 'Log dinner meal', checked: false, icon: Utensils },
        { id: 4, label: 'Write wellness diary entry', checked: false, icon: Edit2 },
        { id: 5, label: 'Log 7+ hours of sleep', checked: false, icon: MoonStar },
    ], []);

    const [items, setItems] = useState(defaultChecklist);
    const [saveStatus, setSaveStatus] = useState('');

    const handleToggle = useCallback((id) => {
        setItems(prevItems =>
            prevItems.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
        );
        setSaveStatus('');
    }, []);

    const handleSave = () => {
        setSaveStatus('Saving changes...');
        setTimeout(() => {
            setSaveStatus(`Checklist saved! You completed ${items.filter(i => i.checked).length} tasks.`);
        }, 1000);
    };

    return (
        <div className="daily-checklist-card">
            <h3 className="checklist-title">Daily Checklist</h3>
            <div className="checklist-items">
                {items.map(item => (
                    <div key={item.id} className="checklist-item-row">
                        <item.icon size={20} className={`checklist-icon ${item.checked ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`checklist-label ${item.checked ? 'line-through text-gray-500' : 'text-gray-800'}`}>{item.label}</span>
                        <input type="checkbox" checked={item.checked} readOnly onChange={() => handleToggle(item.id)} className="checklist-checkbox" />
                    </div>
                ))}
            </div>
            <div className="checklist-footer">
                <button onClick={handleSave} className="save-checklist-btn">Save Checklist</button>
                {saveStatus && <p className="checklist-status text-sm mt-2">{saveStatus}</p>}
            </div>
        </div>
    );
};

// --- Profile Page ---
const ProfilePage = ({ navigate, userName, userEmail, setUserName, setUserEmail, isAuthReady, darkMode, setDarkMode }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(userName);
    const [tempEmail, setTempEmail] = useState(userEmail);
    const [status, setStatus] = useState('');
    
    // State untuk gambar (Cuba ambil dari simpanan browser dulu)
    const [profileImage, setProfileImage] = useState(localStorage.getItem('userProfilePic') || null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setTempName(userName);
        setTempEmail(userEmail);
    }, [userName, userEmail]);

    const handleEditProfile = () => {
        if (isEditing) {
            setStatus('Saving profile...');
            setTimeout(() => {
                setUserName(tempName);
                setUserEmail(tempEmail);
                setStatus('Profile saved successfully!');
                setIsEditing(false);
            }, 1000);
        } else {
            setIsEditing(true);
            setStatus('');
        }
    };

    // Fungsi bila user pilih gambar
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Simpan gambar (Base64 string) ke state dan LocalStorage
                setProfileImage(reader.result);
                localStorage.setItem('userProfilePic', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogout = () => {
        setStatus('Logging out...');
        if (!isAuthReady || typeof firebase === 'undefined' || !auth) return;

        try {
            auth.signOut();
            setStatus('Logout successful. Redirecting...');
            setTimeout(() => {
                navigate('welcome'); 
                setUserName('Guest'); 
                setUserEmail('guest@app.com');
            }, 1000);
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };
    
    // Default Avatar (Kalau tak ada gambar upload)
    const DefaultAvatar = (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="100%" height="100%">
            <circle cx="25" cy="25" r="24" fill="#FFFFFF" stroke="#C30000" strokeWidth="2"/>
            <circle cx="18" cy="25" r="4" fill="#000000"/>
            <circle cx="32" cy="25" r="4" fill="#000000"/>
            <path d="M 15 35 Q 25 30 35 35" stroke="#C30000" strokeWidth="2" fill="none"/>
            <circle cx="34" cy="28" r="1.5" fill="#C30000"/>
            <path d="M 10 15 Q 25 5 40 15" stroke="#C30000" strokeWidth="3" fill="none"/>
        </svg>
    );

    return (
        <div className="profile-page-container">
            <header className="profile-header">
                <button onClick={() => navigate('dashboard')} className="back-btn">
                    <ArrowLeft size={24} className="text-black" />
                </button>
                <h1 className="profile-title">Profile</h1>
                <div className="w-6"></div> 
            </header>

            <main className="profile-main-content">
                
                <div className="profile-info-section">
                    {/* AVATAR AREA (BOLEH KLIK) */}
                    <div className="relative inline-block mb-4 group">
                        <div 
                            className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg cursor-pointer relative bg-white mx-auto"
                            onClick={() => fileInputRef.current.click()}
                        >
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                DefaultAvatar
                            )}
                            
                            {/* Overlay Kamera (Akan muncul bila hover atau editing) */}
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={30} />
                            </div>
                        </div>
                        
                        {/* Input File Tersembunyi */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />
                    </div>

                    {isEditing ? (
                        <div className="w-full text-center mt-2">
                            <input 
                                type="text" 
                                value={tempName} 
                                onChange={(e) => setTempName(e.target.value)} 
                                className="profile-input mb-2 font-bold text-lg"
                            />
                            <input 
                                type="email" 
                                value={tempEmail} 
                                onChange={(e) => setTempEmail(e.target.value)} 
                                className="profile-input text-gray-600 text-sm"
                            />
                        </div>
                    ) : (
                        <>
                            <h2 className="profile-name">{userName}</h2>
                            <p className="profile-email">{userEmail}</p>
                        </>
                    )}
                    
                    <DailyChecklist />
                </div>

                {status && <p className={`text-center mt-4 font-semibold text-sm ${status.includes('successfully') ? 'text-green-600' : 'text-gray-600'}`}>{status}</p>}

                <div className="profile-options-section">
                    {/* --- DARK MODE TOGGLE --- */}
                    <div className="option-item">
                         <div className="flex items-center flex-grow">
                         <MoonStar size={24} className="option-icon" />
                        <span className="option-label">Dark Mode</span>
                     </div>
                     <label className="switch">
                        <input 
                             type="checkbox" 
                            checked={darkMode} 
                             onChange={() => setDarkMode(!darkMode)} 
                         />
                      <span className="slider round"></span>
                    </label>
                </div>
                    <div className="option-item" onClick={handleEditProfile}>
                        <Edit size={24} className="option-icon" />
                        <span className="option-label">{isEditing ? 'Save Profile' : 'Edit Profile Name'}</span>
                    </div>
                    <div className="option-item" onClick={() => navigate('forgot-password')}>
                        <Lock size={24} className="option-icon" />
                        <span className="option-label">Forgot password</span>
                    </div>
                    <div className="option-item logout-item" onClick={handleLogout}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="option-icon"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
                        <span className="option-label">Logout</span>
                    </div>
                </div>

            </main>
        </div>
    );
};

// --- TasksPage ---
const TasksPage = ({ navigate }) => {
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Finalize app design presentation', completed: false, date: new Date(Date.now() + 86400000) },
        { id: 2, text: 'Buy groceries (milk, eggs, bread)', completed: true, date: new Date(Date.now()) },
        { id: 3, text: 'Call Aunt Sarah for birthday', completed: false, date: new Date(Date.now() - 86400000 * 2) },
    ]);
    const [newTaskText, setNewTaskText] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date()); 
    const [inputStatus, setInputStatus] = useState('');

    const handleAddTask = () => {
        if (newTaskText.trim() === '') {
            setInputStatus('Please enter a task!');
            return;
        }
        const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
        const newTask = { id: newId, text: newTaskText.trim(), completed: false, date: selectedDate };
        setTasks([...tasks, newTask]);
        setNewTaskText('');
        setInputStatus('Task added successfully!');
        setTimeout(() => setInputStatus(''), 1500);
    };

    const handleToggleTask = (id) => {
        setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
    };

    const handleDateSelect = (dayOffset) => {
        const today = new Date();
        today.setDate(today.getDate() + dayOffset);
        setSelectedDate(today);
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const taskDate = task.date;
            if (!taskDate || !(taskDate instanceof Date)) return false; 
            return (
                taskDate.getFullYear() === selectedDate.getFullYear() &&
                taskDate.getMonth() === selectedDate.getMonth() &&
                taskDate.getDate() === selectedDate.getDate()
            );
        });
    }, [tasks, selectedDate]);
    
    const renderCalendar = () => {
        const today = new Date();
        const days = [];
        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

        for (let i = -2; i <= 4; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayIndex = date.getDay();
            const isSelected = date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth();

            days.push(
                <div key={i} className={`calendar-day ${isSelected ? 'selected' : ''}`} onClick={() => handleDateSelect(i)}>
                    <span className="day-name">{dayNames[dayIndex]}</span>
                    <span className="day-num">{date.getDate()}</span>
                </div>
            );
        }
        return <div className="calendar-strip">{days}</div>;
    };

    return (
        <div className="tasks-page-container-v2">
            <header className="tasks-header-v2">
                <button onClick={() => navigate('dashboard')} className="back-btn"><ArrowLeft size={24} className="text-black" /></button>
                <h1 className="tasks-title-v2">To do</h1>
                <div className="date-display">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} <Clock size={20} className="ml-2 text-gray-700" /></div>
            </header>
            <main className="tasks-main-content-v2">
                {renderCalendar()}
                {filteredTasks.length === 0 ? (
                    <div className="no-tasks-placeholder">
                        <h2 className="text-xl font-bold text-gray-700 mb-2">You have no tasks</h2>
                        <p className="text-gray-500">Write something below</p>
                    </div>
                ) : (
                    <div className="tasks-list-v2">
                        <h2 className="list-title">My Tasks</h2>
                        {filteredTasks.map(task => (
                            <div key={task.id} className="task-row-v2" onClick={() => handleToggleTask(task.id)}>
                                <input type="checkbox" checked={task.completed} readOnly className="task-checkbox-v2" />
                                <span className={`task-text ${task.completed ? 'completed' : ''}`}>{task.text}</span>
                            </div>
                        ))}
                    </div>
                )}
                {inputStatus && <p className={`text-center text-sm font-medium my-3 ${inputStatus.includes('successfully') ? 'text-green-600' : 'text-red-500'}`}>{inputStatus}</p>}
                <div className="new-task-input-section">
                    <input type="text" placeholder="What do you need to do?" value={newTaskText} onChange={(e) => { setNewTaskText(e.target.value); setInputStatus(''); }} className="new-task-input" />
                    <button onClick={handleAddTask} className="add-task-btn" disabled={!newTaskText.trim()}><Plus size={24} /></button>
                </div>
            </main>
        </div>
    );
};

const ActivityPage = () => (
    <div className="p-8 text-center bg-yellow-50 min-h-screen">
        <h2 className="text-2xl font-bold mt-20">Activity Goal Tracking</h2>
        <p className="mt-4 text-gray-600">Log your runs, steps, and exercises here.</p>
    </div>
);

// --- RemindersPage ---
const RemindersPage = ({ navigate }) => {
    const [reminders, setReminders] = useState({
        breakfast: true,
        activity: false,
        water: true,
        lunch: true,
    });

    // 1. Minta Izin Notifikasi bila page dibuka
    useEffect(() => {
        if (!("Notification" in window)) {
            console.log("Browser ini tidak menyokong notifikasi desktop");
        } else if (Notification.permission !== "granted") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("WellSpace", { body: "Notifikasi diaktifkan! 🎉" });
                }
            });
        }
    }, []);

    const handleToggle = (key) => {
        setReminders(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // 2. Fungsi Hantar Notifikasi (Untuk Test Manual)
    const sendTestNotification = (title) => {
        if (Notification.permission === "granted") {
            new Notification("WellSpace Reminder 🔔", {
                body: `Hey! Don't forget: ${title}`,
                // Anda boleh tambah ikon jika ada: icon: '/icon.png'
            });
        } else {
            alert("Sila benarkan (Allow) notifikasi pada browser anda dahulu.");
            Notification.requestPermission();
        }
    };

    const reminderItems = [
        { key: 'breakfast', label: 'Breakfast Alert', icon: <Utensils size={24} />, color: '#D32F2F' },
        { key: 'activity', label: 'Activity Alert', icon: <Footprints size={24} />, color: '#C30000' },
        { key: 'water', label: 'Water Alert', icon: <Droplet size={24} />, color: '#17A2B8' },
        { key: 'lunch', label: 'Lunch Alert', icon: <Bell size={24} />, color: '#FBC02D' },
    ];

    // 3. Simulasi Check Masa (Optional: Dalam real app, ini guna Service Worker)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            // Contoh: Jika jam 8:00 pagi dan Reminder Breakfast ON
            if (reminders.breakfast && currentHour === 8 && currentMinute === 0) {
                sendTestNotification("Time for Breakfast!");
            }
            // Contoh: Jika jam 12:30 tengahari dan Reminder Lunch ON
            if (reminders.lunch && currentHour === 12 && currentMinute === 30) {
                sendTestNotification("Time for Lunch!");
            }
        }, 60000); // Check setiap 1 minit

        return () => clearInterval(interval);
    }, [reminders]);

    return (
        <div className="reminders-page-container">
            <header className="reminders-header">
                <button onClick={() => navigate('dashboard')} className="back-btn">
                    <ArrowLeft size={24} className="text-black" />
                </button>
                <h1 className="reminders-title">WellSpace</h1>
                <div className="w-6"></div>
            </header>

            <main className="reminders-main-content">
                <h2 className="set-reminders-title">Set Reminders</h2>
                
                <div className="reminders-list">
                    {reminderItems.map(item => (
                        <div key={item.key} className="reminder-card">
                            <div className="reminder-label-group">
                                <span style={{ color: item.color }}>{item.icon}</span>
                                <span className="reminder-name">{item.label}</span>
                            </div>
                            
                            {/* Butang Test Kecil untuk Demo */}
                            <button 
                                onClick={() => sendTestNotification(item.label)}
                                className="text-xs bg-gray-200 px-2 py-1 rounded mr-2 hover:bg-gray-300"
                            >
                                Test
                            </button>

                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={reminders[item.key]} 
                                    onChange={() => handleToggle(item.key)} 
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    ))}
                </div>

                <button onClick={() => navigate('dashboard')} className="save-reminder-btn">
                    Save Reminder
                </button>
            </main>
        </div>
    );
};

// --- SleepTrackerPage (UPDATED WITH AI, REAL CHART & ALARM) ---
const SleepTrackerPage = ({ navigate, userId }) => {
    const today = new Date();
    const appId = 'wellspace-app';
    
    const referenceDateFormatted = today.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
    
    // State Input
    const [sleepTimeInput, setSleepTimeInput] = useState('22:30'); 
    const [wakeTimeInput, setWakeTimeInput] = useState('06:30'); 
    const [screenTimeHours, setScreenTimeHours] = useState(2); 
    
    // State Data & UI
    const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0]); 
    const [aiAdvice, setAiAdvice] = useState(''); 
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // State untuk Mode Alarm
    const [isAlarmActive, setIsAlarmActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState('');
    const audioRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg')); 

    // 1. FETCH DATA FIREBASE
    useEffect(() => {
        if (!userId || !db) return;
        const fetchWeeklySleep = async () => {
            try {
                const logsRef = db.collection(`artifacts/${appId}/users/${userId}/sleep_logs`)
                    .orderBy('date', 'desc').limit(5);
                const snapshot = await logsRef.get();
                const sleepHours = snapshot.docs.map(doc => doc.data().durationHours).reverse();
                setWeeklyData([...Array(5 - sleepHours.length).fill(0), ...sleepHours]);
            } catch (error) { console.error("Error:", error); }
        };
        fetchWeeklySleep();
    }, [userId]);

    // Pengiraan
    const sleepDurationHours = useMemo(() => {
        const todayStr = today.toDateString();
        const sleepDate = new Date(todayStr + ' ' + sleepTimeInput);
        let wakeDate = new Date(todayStr + ' ' + wakeTimeInput);
        if (wakeDate <= sleepDate) wakeDate.setDate(wakeDate.getDate() + 1);
        const diffHours = Math.abs(wakeDate.getTime() - sleepDate.getTime()) / (1000 * 60 * 60);
        return (diffHours > 24 || diffHours <= 0) ? 0 : diffHours;
    }, [sleepTimeInput, wakeTimeInput]);

    const sleepQuality = useMemo(() => {
        let base = (sleepDurationHours >= 7 && sleepDurationHours <= 9) ? 90 : (sleepDurationHours > 6 ? 75 : 50);
        return `${Math.max(0, base - (screenTimeHours * 5))}%`;
    }, [sleepDurationHours, screenTimeHours]);

    const awakeDuration = useMemo(() => {
        const totalHours = 24;
        const awakeHours = totalHours - sleepDurationHours;
        const hours = Math.floor(awakeHours);
        const minutes = Math.round((awakeHours - hours) * 60);
        return `${hours}j ${minutes}m`;
    }, [sleepDurationHours]);

    // --- FUNGSI 1: LOG REKOD SAHAJA (Tanpa Alarm) ---
    const handleLogOnly = async () => {
        if (!db || !userId) return alert("Sila login.");
        
        setIsAnalyzing(true);
        setAiAdvice("AI sedang menganalisis (Analyzing / 分析中)... 🧠");

        // Prompt 3 Bahasa
        let prompt = `I slept ${sleepDurationHours.toFixed(1)}h. Quality: ${sleepQuality}. Screen time: ${screenTimeHours}h. Give advice in English, Malay, Mandarin.`;
        const systemInstruction = "You are a trilingual Sleep Coach.";
        
        const advice = await fetchGeminiResponse(prompt, systemInstruction);
        setAiAdvice(advice);
        setIsAnalyzing(false);

        // Simpan Database
        db.collection(`artifacts/${appId}/users/${userId}/sleep_logs`).add({
            durationHours: sleepDurationHours,
            sleepTime: sleepTimeInput,
            wakeTime: wakeTimeInput,
            quality: sleepQuality,
            analysis: advice,
            date: firebase.firestore.FieldValue.serverTimestamp(),
        });
        setWeeklyData(prev => [...prev.slice(1), sleepDurationHours]);
    };

    // --- FUNGSI 2: AKTIFKAN ALARM (Nightstand Mode) ---
    const handleStartAlarm = async () => {
        // Request Wake Lock
        try {
            if ('wakeLock' in navigator) await navigator.wakeLock.request('screen');
        } catch (err) { console.log("Wake Lock error:", err); }

        const now = new Date();
        let wakeDate = new Date(now.toDateString() + ' ' + wakeTimeInput);
        if (wakeDate <= now) wakeDate.setDate(wakeDate.getDate() + 1);
        
        const msUntilAlarm = wakeDate.getTime() - now.getTime();
        
        setIsAlarmActive(true); 
        setTimeRemaining(`Alarm set for ${wakeTimeInput}`);

        setTimeout(() => {
            audioRef.current.loop = true;
            audioRef.current.play();
            setTimeRemaining("⏰ WAKE UP! WAKE UP!");
            handleLogOnly(); 
        }, msUntilAlarm);
    };

    const handleStopAlarm = () => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsAlarmActive(false); 
        window.location.reload(); 
    };

    // --- TAMPILAN JIKA ALARM AKTIF ---
    if (isAlarmActive) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-5 text-center fixed top-0 left-0 w-full z-[9999]">
                <MoonStar size={80} className="text-purple-400 mb-6 animate-pulse" />
                <h1 className="text-4xl font-bold mb-4">{timeRemaining}</h1>
                <p className="text-gray-400 mb-10">Screen is kept ON. Sweet dreams!</p>
                <button onClick={handleStopAlarm} className="px-8 py-4 bg-red-600 rounded-full text-xl font-bold shadow-lg hover:bg-red-700 transition-all">
                    STOP ALARM & LOG
                </button>
            </div>
        );
    }

    // --- TAMPILAN BIASA ---
    const qualityPercent = parseInt(sleepQuality);
    const durationPercent = Math.min(100, ((24 - sleepDurationHours) / 16) * 100);
   
    return (
        <div className="sleep-page-container">
            <header className="sleep-header">
                <button onClick={() => navigate('dashboard')} className="back-btn"><ArrowLeft size={24} className="text-black" /></button>
                <h1 className="sleep-title">Sleep Tracker</h1>
                <div className="w-6"></div>
            </header>
            <main className="sleep-main-content">
                <h2 className="current-date-v2">{referenceDateFormatted}</h2>
                
                <div className="tracking-card-purple">
                    <div className="sleep-time-inputs-v2">
                        <label>Sleep:</label>
                        <input type="time" value={sleepTimeInput} onChange={(e) => setSleepTimeInput(e.target.value)} className="time-input-sleep" />
                        <label>Wake:</label>
                        <input type="time" value={wakeTimeInput} onChange={(e) => setWakeTimeInput(e.target.value)} className="time-input-sleep" />
                    </div>
                    <div className="flex gap-3 flex-col">
                        <button onClick={handleStartAlarm} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg border border-gray-700">
                            <Clock size={18} /> Set Alarm (Sleep Now)
                        </button>
                        <button onClick={handleLogOnly} disabled={isAnalyzing} className="w-full py-3 bg-white text-purple-700 rounded-xl font-bold shadow-lg">
                            {isAnalyzing ? 'Analyzing...' : '📝 Log Past Record'}
                        </button>
                    </div>
                </div>

                {aiAdvice && (
                    <div className="bg-white p-4 rounded-xl shadow-md mb-6 border-l-4 border-purple-500">
                        <h3 className="font-bold text-purple-700 mb-1">AI Analysis (3 Languages):</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{aiAdvice}</p>
                    </div>
                )}

                <h2 className="statistics-title">Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card-pink">
                        <p className="stat-label-sleep">Quality (Screen Time)</p>
                        <p className="stat-value-sleep">{sleepQuality}</p>
                        <div className="progress-bar-wrap-sleep"><div className="progress-bar-sleep" style={{ width: `${qualityPercent}%` }}></div></div>
                    </div>
                    <div className="stat-card-pink">
                        <p className="stat-label-sleep">Awake Duration</p>
                        <p className="stat-value-sleep">{awakeDuration}</p>
                        <div className="progress-bar-wrap-sleep"><div className="progress-bar-sleep" style={{ width: `${durationPercent}%` }}></div></div>
                    </div>
                </div>

                <h2 className="statistics-title-weekly">Weekly Sleep</h2>
                <div className="weekly-sleep-card-purple">
                    <div className="chart-placeholder" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '120px' }}>
                        {weeklyData.map((hours, idx) => (
                            <div key={idx} className="w-3 bg-purple-400 rounded-t-md" style={{ height: `${Math.min(hours * 12, 100)}px` }}></div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Last 5 Entries</p>
                </div>

                <div className="screen-time-input-row">
                    <label>Screen Time (Hours):</label>
                    <input type="number" min="0" max="10" value={screenTimeHours} onChange={(e) => setScreenTimeHours(parseInt(e.target.value))} className="screen-time-input" />
                </div>
            </main>
        </div>
    );
};

// --- HydrationSleepPage ---
const HydrationSleepPage = ({ navigate }) => {
    const [dailyGoal, setDailyGoal] = useState(15);
    const [waterCount, setWaterCount] = useState(0); 
    const [isReminderOn, setIsReminderOn] = useState(true); 
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [newGoalInput, setNewGoalInput] = useState(15); 
    const GLASS_VOLUME_LITERS = 0.25; 
    const MAX_GLASSES = 20;

    const handleWaterClick = () => {
        if (waterCount < dailyGoal) setWaterCount(waterCount + 1);
        else alert('Goal achieved! You can still drink more, but the tracker limit is reached.');
    };

    const handleGoalChange = () => {
        const goal = parseInt(newGoalInput);
        if (goal > 0 && goal <= MAX_GLASSES) { setDailyGoal(goal); setWaterCount(0); }
        else alert(`Goal must be between 1 and ${MAX_GLASSES}.`);
        setIsEditingGoal(false);
    };

    const hydrationMetrics = useMemo(() => {
        return { average: (1.8).toFixed(1), minimum: (1.0).toFixed(1), maximum: (3.25).toFixed(2) };
    }, [dailyGoal]);

    const isGoalAchieved = waterCount >= dailyGoal;

    const renderWaterDrops = () => {
        const drops = [];
        const itemsPerFullRow = 6;
        const totalItemsToDraw = dailyGoal;
        for (let index = 0; index < totalItemsToDraw; index++) {
            const isFilled = index < waterCount;
            const isNextToFill = index === waterCount;
            const isLastInRow = (index + 1) % itemsPerFullRow === 0;
            drops.push(
                <div key={index} className="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill={isFilled ? "#17A2B8" : "#E0F2F7"} stroke={isFilled ? "#17A2B8" : "#B3E0EB"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2.69L12 21.31C12 22.18 11.18 22.82 10.31 22.31L1.69 17.69C0.82 17.18 0.18 16.36 0.69 15.69L5.31 4.31C5.82 3.44 6.64 2.8 7.51 3.31L16.13 7.93C17 8.44 17.64 9.26 17.13 9.93L12 2.69Z" transform="translate(3 0)" />
                    </svg>
                    <button onClick={handleWaterClick} disabled={isGoalAchieved || !isNextToFill} className={`water-plus-btn-v2 ${isNextToFill ? 'active' : ''}`} style={{ visibility: isNextToFill && !isGoalAchieved ? 'visible' : 'hidden' }}>+</button>
                </div>
            );
            if (isLastInRow && index < totalItemsToDraw - 1) {
                drops.push(<div key={`spacer-${index}`} style={{ gridColumn: `span ${itemsPerFullRow}`}}></div>);
            }
        }
        return drops;
    };

    return (
        <div className="hydration-page-container">
            <header className="hydration-header">
                <button onClick={() => navigate('dashboard')} className="back-btn"><ArrowLeft size={24} className="text-black" /></button>
                <h1 className="hydration-title">Water Alert</h1>
                <ChevronDown className="text-gray-500 cursor-pointer" size={24} />
            </header>
            <div className="water-tracker-section">
                <h2 className="water-count">Water Today<br/>{waterCount} / {dailyGoal} glasses</h2>
                {isGoalAchieved ? <p className="water-description-success">SUCCESS! Goal achieved, stay hydrated!</p> : <p className="water-description">Helps meet your hydration goal and boosts focus, directly addressing fatigue.</p>}
                <div className="water-drop-grid-v2" style={{ gridTemplateColumns: `repeat(6, 1fr)`, gridAutoRows: 'min-content' }}>{renderWaterDrops()}</div>
                <div className="reminder-toggle-row mt-6">
                    <p>Remind me to drink water</p>
                    <label className="switch"><input type="checkbox" checked={isReminderOn} onChange={() => setIsReminderOn(!isReminderOn)} /><span className="slider round"></span></label>
                </div>
                <div className="reminder-time-selector mb-10">
                    <select className="time-dropdown-v2"><option>Every 30 minutes</option><option>Every 60 minutes</option><option>Every 90 minutes</option></select>
                    <ChevronDown size={20} className="text-gray-500 dropdown-arrow-v2" />
                </div>
            </div>
            <div className="daily-goal-card-v2">
                <h3 className="daily-goal-title">Daily Goal: {dailyGoal} glasses</h3>
                <div className="goal-metrics-v2">
                    <div><p className="metric-avg-v2">{hydrationMetrics.average} l/d</p><span className="metric-label-small">AVERAGE</span></div>
                    <div><p className="metric-min-v2">{hydrationMetrics.minimum} l/d</p><span className="metric-label-small">MINIMUM</span></div>
                    <div><p className="metric-max-v2">{hydrationMetrics.maximum} l/d</p><span className="metric-label-small">MAXIMUM</span></div>
                </div>
                {isEditingGoal ? (
                    <div className="goal-edit-area">
                        <input type="number" min="1" max={MAX_GLASSES} value={newGoalInput} onChange={(e) => setNewGoalInput(e.target.value)} className="goal-input" placeholder={`New Goal (1-${MAX_GLASSES})`} />
                        <button onClick={handleGoalChange} className="save-goal-btn" disabled={!newGoalInput}>Set Goal</button>
                        <button onClick={() => setIsEditingGoal(false)} className="cancel-goal-btn">Cancel</button>
                    </div>
                ) : (
                    <button onClick={() => { setNewGoalInput(dailyGoal); setIsEditingGoal(true); }} className="change-goal-btn-v2">Change Daily Goal</button>
                )}
            </div>
            <button onClick={() => navigate('sleep')} className="sleep-tracker-link-v2">Go to Sleep Tracking</button>
        </div>
    );
};

// --- MoodSelectPage ---
const MoodSelectPage = ({ navigate }) => {
    const moodOptions = [
        { name: "Happy", emoji: "☀️", color: "text-yellow-500", background: "#FFF8E1" },
        { name: "Angry", emoji: "😡", color: "text-red-600", background: "#FFECEC" },
        { name: "Tired", emoji: "☁️", color: "text-blue-400", background: "#E3F2FD" },
        { name: "Stressed", emoji: "🌧️", color: "text-gray-600", background: "#EFEBE9" },
    ];
    const [selectedMood, setSelectedMood] = useState(null);

    const handleMoodSelect = (moodName) => {
        setSelectedMood(moodName);
        setTimeout(() => navigate('diary-entry', { mood: moodName }), 200); 
    };

    return (
        <div className="mood-page-container">
            <header className="mood-header">
                <button onClick={() => navigate('dashboard')} className="back-btn"><ArrowLeft size={24} className="text-black" /></button>
                <h1 className="mood-title">Mood&Wellness</h1>
                <Bell className="text-gray-500 cursor-pointer" size={24} onClick={() => navigate('reminders')} />
            </header>
            <div className="content-area">
                <div className="kawaii-face"><span className="text-7xl">^_^</span></div>
                <div className="mood-grid">
                    {moodOptions.map((mood) => (
                        <div key={mood.name} className={`mood-card ${selectedMood === mood.name ? 'selected-mood' : ''}`} style={{ backgroundColor: mood.background, borderColor: selectedMood === mood.name ? '#C30000' : '#FFF' }} onClick={() => handleMoodSelect(mood.name)}>
                            <span className="mood-emoji text-6xl">{mood.emoji}</span>
                            <p className="mood-name text-sm font-semibold text-gray-700">{mood.name}</p>
                        </div>
                    ))}
                </div>
                <h2 className="mood-prompt">How do you feel?</h2>
            </div>
        </div>
    );
};

// --- DiaryEntryPage ---
const DiaryEntryPage = ({ navigate, routeParams, userId }) => {
    const appId = 'wellspace-app';
    const mood = routeParams?.mood || 'Happy';
    const { quote, color } = getQuote(mood);
    const [entry, setEntry] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleSave = async () => {
        if (!entry.trim()) { setSaveMessage("Sila tulis sesuatu sebelum menyimpan."); return; }
        if (!db || !userId) { setSaveMessage("Ralat: Pangkalan data tidak disambungkan."); return; }

        setIsSaving(true);
        setSaveMessage('');
        setIsAnalyzing(true);
        
        const prompt = `Analyze the emotional tone of this diary entry and provide a concise one-sentence summary and a related motivational quote (2-3 sentences total). The user selected the mood: ${mood}. The entry is: "${entry}". Respond in English.`;
        const systemInstruction = "You are a supportive Wellness Coach AI. Your response must be comforting and actionable, starting with the summary and ending with a quote.";
        
        let geminiResponse = '';
        try { geminiResponse = await fetchGeminiResponse(prompt, systemInstruction); } 
        catch (e) { geminiResponse = "Could not generate analysis."; }
        setIsAnalyzing(false);

        try {
            const collectionPath = `artifacts/${appId}/users/${userId}/diary_logs`;
            await db.collection(collectionPath).add({
                type: 'Diary',
                mood: mood,
                entry: entry,
                date: firebase.firestore.FieldValue.serverTimestamp(),
                color: color,
                analysis: geminiResponse, 
            });
            setSaveMessage(`Berjaya disimpan! ${geminiResponse}`);
            setTimeout(() => { navigate('history'); }, 2000);
        } catch (error) {
            console.error("Error saving diary entry:", error);
            setSaveMessage(`Ralat semasa menyimpan: ${error.message}`);
            setIsSaving(false);
        }
    };

    return (
        <div className="diary-entry-page-container">
            <div className="diary-image-wrapper">
                <img src="https://placehold.co/300x250/FAD0C4/C30000?text=Mind+and+Heart" alt="Mind and Wellness" className="diary-hero-image" />
            </div>
            <div className="diary-content-wrapper" style={{ backgroundColor: color }}>
                <p className="diary-quote">"{quote}"</p>
                <textarea placeholder="Type your feelings..." value={entry} onChange={(e) => { setEntry(e.target.value); setSaveMessage(''); }} className="diary-textarea-style" disabled={isSaving || isAnalyzing} />
                <button onClick={handleSave} className="diary-save-btn" disabled={isSaving || !entry.trim() || isAnalyzing}>
                    {isAnalyzing ? 'Analyzing... 🧠' : isSaving ? 'Saving...' : 'Save (Get Analysis ✨)'}
                </button>
                {saveMessage && <div className="save-message" style={{ color: 'white' }}>{saveMessage}</div>}
            </div>
        </div>
    );
};

// --- HistoryPage ---
// --- HistoryPage (DENGAN FUNGSI DELETE) ---
const HistoryPage = ({ userId, isAuthReady, navigate }) => { 
    const [recentLogs, setRecentLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); 
    const appId = 'wellspace-app';

    useEffect(() => {
        if (!isAuthReady || !userId || !db) return;
        setIsLoading(true);
        
        // Kita guna onSnapshot supaya bila delete, dia hilang serta-merta (real-time)
        const diaryCollectionPath = `artifacts/${appId}/users/${userId}/diary_logs`;
        const unsubscribeDiary = db.collection(diaryCollectionPath).limit(20).onSnapshot(snapshot => {
            const diaryLogs = snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    type: 'Diary', 
                    mood: data.mood || 'N/A', 
                    entry: data.entry || 'No entry', 
                    date: data.date ? data.date.toDate() : new Date(), 
                    color: QUOTES_BY_MOOD[data.mood]?.color || '#5E35B1', 
                    analysis: data.analysis || '' 
                };
            });
            
            // Gabungkan dengan Activity
            fetchActivityLogs(diaryLogs);
        });

        const fetchActivityLogs = (diaryLogs) => {
            const activityCollectionPath = `artifacts/${appId}/users/${userId}/activity_logs`;
            const unsubscribeActivity = db.collection(activityCollectionPath).limit(20).onSnapshot(snapshot => {
                const activityLogs = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const details = `${data.distance?.toFixed(2)} ${data.distanceUnit} ${data.activityType} (${data.calories} kcal)`;
                    return { 
                        id: doc.id, 
                        type: 'Activity', 
                        activityType: data.activityType || 'N/A', 
                        details: details, 
                        date: data.date ? data.date.toDate() : new Date(), 
                        color: '#F47C7C', 
                        analysis: data.analysis || 'No AI analysis.' 
                    };
                });
                
                // Gabung dan Susun
                const combined = [...diaryLogs, ...activityLogs].sort((a, b) => b.date.getTime() - a.date.getTime());
                setRecentLogs(combined);
                setIsLoading(false);
            });
            return unsubscribeActivity;
        };

        return () => unsubscribeDiary();
    }, [userId, isAuthReady]);

    // --- FUNGSI DELETE BARU ---
    const handleDelete = async (id, type) => {
        // Tanya confirmation dulu
        if(!confirm("Are you sure you want to delete this log?")) return;

        const collectionName = type === 'Diary' ? 'diary_logs' : 'activity_logs';
        try {
            await db.collection(`artifacts/${appId}/users/${userId}/${collectionName}`).doc(id).delete();
            // Tak perlu update state manual sebab kita guna onSnapshot (dia auto hilang)
        } catch (error) {
            alert("Error deleting: " + error.message);
        }
    };

    const filteredLogs = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        if (!lowerCaseSearch) return recentLogs;
        return recentLogs.filter(log => {
            const content = log.type === 'Diary' ? log.entry : log.details;
            return (
                log.type.toLowerCase().includes(lowerCaseSearch) ||
                (log.mood && log.mood.toLowerCase().includes(lowerCaseSearch)) ||
                (log.activityType && log.activityType.toLowerCase().includes(lowerCaseSearch)) ||
                content.toLowerCase().includes(lowerCaseSearch)
            );
        });
    }, [recentLogs, searchTerm]);

    return (
        <div className="history-page-container"> 
            <header className="history-header-style">
                <button onClick={() => navigate('dashboard')} className="menu-icon-btn"><ArrowLeft size={24} className="text-black" /></button>
                <h1 className="history-title-style">History</h1>
                <ChevronDown size={24} className="text-gray-500 cursor-pointer" />
            </header>
            <main className="history-main-content">
                <p className="history-subtitle">Looking for recent log? Search to find it easier</p>
                <div className="search-container">
                    <Search size={20} className="search-icon" />
                    <input type="text" placeholder="Searching for..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                </div>
                <h2 className="recent-logs-title">Recent logs :</h2>
                {isLoading && <p className="text-center text-gray-500">Loading history...</p>}
                <div className="logs-list-wrapper">
                    {!isLoading && filteredLogs.length === 0 ? (
                        <p className="text-center text-gray-500">No entries match your search or no logs found yet.</p>
                    ) : (
                        filteredLogs.map((log) => (
                            <div key={log.id} className="log-card" style={{borderColor: log.color}}>
                                <div className="flex justify-between items-start">
                                    <span className="log-type" style={{color: log.color}}>{log.type === 'Diary' ? `DIARY LOG - ${log.mood.toUpperCase()}` : `ACTIVITY - ${log.activityType}`}</span>
                                    
                                    {/* BUTANG SAMPAH (DELETE) */}
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(log.id, log.type); }} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete Log">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                
                                <p className="log-entry">{log.type === 'Diary' ? log.entry.substring(0, 80) + (log.entry.length > 80 ? '...' : '') : log.details}</p>
                                <p className="analysis-entry mt-2 text-xs font-medium italic" style={{color: log.color, opacity: 0.8}}>AI Analysis: {log.analysis}</p>
                                <span className="log-date">{log.date instanceof Date ? log.date.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Date N/A'}</span>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

// --- KOMPONEN: Pemilih Waktu Makan (MealTimeSelector) ---
const MealTimeSelector = ({ onSelect, onClose }) => {
    const mealTimes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

    return (
        <div className="modal-backdrop">
            <div className="nutrition-modal-content">
                <div className="modal-header">
                    <h2 className="text-[#2E7D32] font-bold text-xl">Select Meal Time</h2>
                    <X className="cursor-pointer text-gray-500" size={24} onClick={onClose} />
                </div>
                
                <p className="modal-subtitle text-gray-600 mb-4">Choose which meal you want to log:</p>
                
                <div className="meal-selection-grid">
                    {mealTimes.map(time => (
                        <button 
                            key={time}
                            className="meal-select-btn"
                            onClick={() => onSelect(time)}
                        >
                            {time}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Dashboard Content ---
const DashboardContent = ({ metrics, featureCards, logoSvg, navigate, userName }) => {
    const userImage = localStorage.getItem('userProfilePic');
    const [currentNutrition, setCurrentNutrition] = useState({ meal: 'Breakfast', calories: '340', proteins: '62.5', fats: '23.1', carbs: '53.6', rdc: '12', isHealthy: true });
    const [isMealSelectorOpen, setIsMealSelectorOpen] = useState(false);
    const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
    const [modalMealTime, setModalMealTime] = useState('Food');

    const handleStartLog = () => setIsMealSelectorOpen(true);
    const handleMealTimeSelected = (time) => { setModalMealTime(time); setIsMealSelectorOpen(false); setIsNutritionModalOpen(true); };
    const handleLogMeal = (data, mealTime) => { setCurrentNutrition({ meal: mealTime,  ...data }); setIsNutritionModalOpen(false); };
    const getMetricColor = (isHealthy) => isHealthy ? '#2E7D32' : '#D32F2F';
    const cardMetrics = [
        { label: 'Proteins', value: currentNutrition.proteins, color: getMetricColor(currentNutrition.isHealthy) },
        { label: 'Fats', value: currentNutrition.fats, color: getMetricColor(currentNutrition.isHealthy) },
        { label: 'Carbs', value: currentNutrition.carbs, color: getMetricColor(currentNutrition.isHealthy) },
        { label: 'RDC', value: `${currentNutrition.rdc}%`, color: getMetricColor(currentNutrition.isHealthy) },
    ];

    return (
        <div className="dashboard-container">
            {isMealSelectorOpen && <MealTimeSelector onClose={() => setIsMealSelectorOpen(false)} onSelect={handleMealTimeSelected} />}
            {isNutritionModalOpen && <NutritionModal onClose={() => setIsNutritionModalOpen(false)} onLogMeal={handleLogMeal} mealTime={modalMealTime} />}
            <header className="top-header">
                <div className="welcome-area">
                    <div onClick={() => navigate('profile')} className="cursor-pointer mr-3">
    {userImage ? (
        <img 
            src={userImage} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
        />
    ) : (
        logoSvg
    )}
</div>
                    <h1 className="welcome-text">WELCOME <strong>{userName.toUpperCase()}!</strong></h1>
                </div>
                <div className="top-icons">
                    <Search className="cursor-pointer" size={24} onClick={() => navigate('search')} />
                    <Bell className="cursor-pointer" size={24} onClick={() => navigate('reminders')} />
                </div>
            </header>
            <div className="breakfast-card">
                <div className="flex justify-between items-start">
                    <div><h2 className="breakfast-title">{currentNutrition.meal}</h2><p className="breakfast-calories">{currentNutrition.calories} calories</p></div>
                    <div className="top-right-icons">
                        <Plus className="cursor-pointer" size={20} onClick={handleStartLog} />
                        <Edit2 className="cursor-pointer" size={20} />
                    </div>
                </div>
                <div className="metric-grid">
                    {cardMetrics.map((metric) => (<div key={metric.label} className="metric-item"><p className="metric-value" style={{color: metric.color}}>{metric.value}</p><p className="metric-label">{metric.label}</p></div>))}
                </div>
                <div className="bottom-row">
                    <a href="#" className="today-dropdown">Today <span className="ml-1">↓</span></a>
                    <a onClick={() => navigate('tasks')} className="see-progress cursor-pointer">To-Do List</a>
                </div>
            </div>
            <div className="feature-grid">
                {featureCards.map((card) => (
                    <div key={card.title} className={`feature-card ${card.color} cursor-pointer`} onClick={() => navigate(card.link)}>
                        <div className="card-title-icon"><h3 className="text-sm uppercase tracking-wider">{card.title}</h3><span className="icon">{card.icon}</span></div>
                        <p className="card-content">{card.description}</p>
                        <a className="check-action text-white">CHECK <span className="check-arrow">→</span></a>
                    </div>
                ))}
            </div>
            <div className="h-20"></div> 
        </div>
    );
};

// --- SearchPage ---
// (SMART NAVIGATION) ---
const SearchPage = ({ navigate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Senarai semua benda yang ada dalam App ni
    const allFeatures = [
        { id: 1, title: 'Sleep Tracker', desc: 'Log sleep & check quality', link: 'sleep', icon: '🌙' },
        { id: 2, title: 'BMI Calculator', desc: 'Check body mass index', link: 'wellness-tools', icon: '⚖️' },
        { id: 4, title: 'Food Diary', desc: 'Log calories & nutrition', link: 'dashboard', icon: '🥗' },
        { id: 5, title: 'Activity Goal', desc: 'Track runs & steps', link: 'activity', icon: '🏃' },
        { id: 6, title: 'Wellness Diary', desc: 'Record your mood', link: 'diary', icon: '📖' },
        { id: 7, title: 'Set Reminders', desc: 'Water & meal alerts', link: 'reminders', icon: '⏰' },
        { id: 8, title: 'Diet Menu', desc: 'Meal suggestions by age', link: 'wellness-tools', icon: '🍎' },
    ];

    // Tapis senarai berdasarkan apa user taip
    const filteredResults = allFeatures.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="search-page-container">
            <header className="search-header-style">
                <button onClick={() => navigate('dashboard')} className="back-btn">
                    <ArrowLeft size={24} className="text-black" />
                </button>
                <span className="font-bold text-gray-500">Explore</span>
                <div className="w-6"></div>
            </header>
            
            <main className="search-main-content">
                <h1 className="search-title">Search</h1>
                <p className="search-subtitle">Find tools, features, or settings.</p>

                {/* Input Search */}
                <div className="search-input-wrapper">
                    <Search size={20} className="search-icon-input" />
                    <input 
                        type="text" 
                        placeholder="Try 'Sleep' or 'BMI'..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="search-input-field"
                        autoFocus
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* HASIL CARIAN (LIST) */}
                <div className="mt-4 space-y-3 overflow-y-auto max-h-[60vh]">
                    {filteredResults.length > 0 ? (
                        filteredResults.map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => navigate(item.link)}
                                className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors border border-transparent hover:border-purple-300"
                            >
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{item.title}</h3>
                                    <p className="text-xs text-gray-500">{item.desc}</p>
                                </div>
                                <div className="ml-auto text-gray-300">
                                    <ArrowLeft size={20} className="rotate-180" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-60">
                            <p className="text-4xl mb-2">🤔</p>
                            <p>No results found for "{searchTerm}"</p>
                        </div>
                    )}
                </div>

                {/* SHORTCUTS (Muncul bila tak taip apa-apa) */}
                {!searchTerm && (
                    <div className="mt-8">
                        <h3 className="font-bold text-gray-600 mb-3 text-sm uppercase tracking-wide">Popular Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {['Sleep', 'Food', 'BMI', 'Music', 'Run'].map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => setSearchTerm(tag)}
                                    className="px-4 py-2 bg-white rounded-full text-sm font-medium text-purple-600 shadow-sm border border-purple-100 hover:bg-purple-50"
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// --- WellnessToolsPage (STRAWBERRY MATCHA AESTHETIC 🍓🍵) ---
const WellnessToolsPage = ({ navigate, userStats, setUserStats }) => {
    const [activeTab, setActiveTab] = useState('menu');
    const [bmiResult, setBmiResult] = useState(null);
    
    // State AI Menu
    const [age, setAge] = useState('');
    const [role, setRole] = useState('Student');
    const [menuPlan, setMenuPlan] = useState(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    // --- LOGIK (SAMA MACAM TADI) ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserStats(prev => ({ ...prev, [name]: value }));
    };

    const calculateBMI = () => {
        if (userStats.weight && userStats.height) {
            const h = userStats.height / 100;
            const bmi = (userStats.weight / (h * h)).toFixed(1);
            let status = (bmi < 18.5) ? 'Underweight' : (bmi < 25) ? 'Normal' : (bmi < 30) ? 'Overweight' : 'Obese';
            setBmiResult({ value: bmi, status });
        } else {
            alert("Please enter weight & height.");
        }
    };

    const generateMenuAI = async () => {
        if (!age) return alert("Please enter your age.");
        setIsLoadingAI(true);
        setMenuPlan(null);

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];

        const prompt = `
            Act as a nutritionist. Create a 1-day meal plan for a ${age} year old ${role} living in Malaysia. Today is ${today}.
            Requirements:
            - If "Student": Cheap, budget-friendly.
            - If "Office Worker": Quick, energy-boosting.
            - Style: Malaysian (Halal).
            
            IMPORTANT: Return ONLY valid JSON format:
            { "breakfast": "Food + emoji", "lunch": "Food + emoji", "dinner": "Food + emoji", "tip": "Short tip" }
        `;
        
        try {
            const resultText = await fetchGeminiResponse(prompt, "You are a JSON generator.");
            const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
            setMenuPlan({ title: `Menu for ${role} (${age}y) - ${today}`, ...JSON.parse(cleanJson) });
        } catch (error) {
            console.error("AI Error:", error);
            alert("AI tengah rehat minum kopi. Cuba lagi!");
        }
        setIsLoadingAI(false);
    };

    return (
        // BACKGROUND STRAWBERRY MATCHA
        <div className="p-6 min-h-screen bg-gradient-to-b from-[#FFDEE9] to-[#B5FFFC]">
            <header className="flex justify-between items-center mb-6">
                <button onClick={() => navigate('search')} className="bg-white/80 p-2 rounded-full shadow-sm hover:bg-white transition">
                    <ArrowLeft size={24} className="text-rose-500" />
                </button>
                <h1 className="text-2xl font-black text-rose-600 tracking-tight">Wellness Tools</h1>
                <div className="w-6"></div>
            </header>

            {/* TAB MENU (Matcha & Strawberry Colors) */}
            <div className="flex bg-white/60 backdrop-blur-md rounded-2xl p-1.5 mb-6 shadow-sm border border-white">
                {['menu', 'bmi'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                            activeTab === tab 
                            ? 'bg-[#81C784] text-white shadow-md transform scale-105' // Active: Matcha Green
                            : 'text-rose-400 hover:bg-rose-50' // Inactive: Soft Rose
                        }`}
                    >
                        {tab === 'menu' ? '🥗 AI Chef' : '⚖️ BMI Calc'}
                    </button>
                ))}
            </div>

            {/* KAD UTAMA (Glassmorphism + Cute) */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white min-h-[400px] flex flex-col items-center text-center relative">
                
                {/* ALAT 1: AI MENU (Matcha Theme) */}
                {activeTab === 'menu' && (
                    <div className="w-full max-w-sm animate-fade-in">
                        <h2 className="text-2xl font-black mb-2 text-[#2E7D32]">AI Menu Planner</h2>
                        <p className="text-[#558B2F] text-sm mb-6 font-medium">Personalized yummy meals for you!</p>

                        <div className="flex gap-2 mb-3">
                            <input 
                                type="number" placeholder="Age" value={age} onChange={e => setAge(e.target.value)} 
                                className="w-20 p-3 border-2 border-[#A5D6A7] rounded-2xl bg-[#E8F5E9] outline-none text-center font-bold text-[#1B5E20] focus:border-[#4CAF50]" 
                            />
                            <select 
                                value={role} onChange={e => setRole(e.target.value)}
                                className="flex-1 p-3 border-2 border-[#A5D6A7] rounded-2xl bg-[#E8F5E9] outline-none font-bold text-[#1B5E20] focus:border-[#4CAF50]"
                            >
                                <option value="Student">Student</option>
                                <option value="Office Worker">Worker</option>
                                <option value="Athlete">Athlete</option>
                            </select>
                        </div>

                        <button 
                            onClick={generateMenuAI} disabled={isLoadingAI}
                            className="w-full bg-gradient-to-r from-[#66BB6A] to-[#43A047] text-white py-3.5 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                        >
                            {isLoadingAI ? 'Brewing Ideas... 🍵' : 'Generate Menu 🍱'}
                        </button>

                        {menuPlan && (
                            <div className="text-left bg-[#F1F8E9] p-5 rounded-3xl border border-[#C8E6C9] animate-bounce-in mt-6 shadow-inner">
                                <h3 className="font-black text-[#33691E] text-lg mb-3 border-b border-[#DCEDC8] pb-2">{menuPlan.title}</h3>
                                <div className="space-y-3 text-[#558B2F] text-sm font-medium">
                                    <div className="flex items-start gap-2"><span className="text-xl">🍳</span><div><span className="font-bold text-[#33691E]">Breakfast:</span><br/>{menuPlan.breakfast}</div></div>
                                    <div className="flex items-start gap-2"><span className="text-xl">🍱</span><div><span className="font-bold text-[#33691E]">Lunch:</span><br/>{menuPlan.lunch}</div></div>
                                    <div className="flex items-start gap-2"><span className="text-xl">🥗</span><div><span className="font-bold text-[#33691E]">Dinner:</span><br/>{menuPlan.dinner}</div></div>
                                </div>
                                <div className="mt-4 bg-white p-3 rounded-2xl text-center text-[#2E7D32] text-xs font-bold border border-[#A5D6A7] shadow-sm">
                                    🍵 Tip: {menuPlan.tip}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ALAT 2: BMI CALCULATOR (Strawberry Theme) */}
                {activeTab === 'bmi' && (
                    <div className="w-full max-w-xs animate-fade-in pt-4">
                        <h2 className="text-2xl font-black mb-4 text-rose-500">Body Check</h2>
                        <input type="number" name="weight" placeholder="Weight (kg)" value={userStats.weight} onChange={handleInputChange} className="w-full p-3 mb-3 border-2 border-rose-200 rounded-2xl bg-rose-50 outline-none text-rose-700 font-bold focus:border-rose-400" />
                        <input type="number" name="height" placeholder="Height (cm)" value={userStats.height} onChange={handleInputChange} className="w-full p-3 mb-6 border-2 border-rose-200 rounded-2xl bg-rose-50 outline-none text-rose-700 font-bold focus:border-rose-400" />
                        
                        <button onClick={calculateBMI} className="w-full bg-gradient-to-r from-rose-400 to-pink-500 text-white py-3.5 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform">
                            Calculate BMI 🍓
                        </button>
                        
                        {bmiResult && (
                            <div className="mt-6 p-5 bg-rose-50 rounded-3xl border border-rose-100 shadow-inner">
                                <p className="text-rose-400 text-xs uppercase tracking-wide font-bold">Your Result</p>
                                <h3 className="text-5xl font-black text-rose-600 my-2">{bmiResult.value}</h3>
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${bmiResult.status === 'Normal' ? 'bg-green-100 text-green-600' : 'bg-rose-200 text-rose-600'}`}>
                                    {bmiResult.status}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- SPLASH SCREEN (LOGO BARU: BLOOMING HEART) ---
const SplashScreen = () => (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#FFDEE9] to-[#B5FFFC]">
        
        {/* Logo Berdenyut */}
        <div className="animate-bounce mb-6 relative">
            {/* Bulatan Latar Belakang */}
            <div className="w-48 h-48 bg-white rounded-full shadow-xl flex items-center justify-center relative overflow-hidden border-4 border-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-28 h-28 drop-shadow-md">
                    {/* Tunas Daun (Hijau Matcha) */}
                    <path d="M12 2L12 10" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 10C12 10 16 8 16 5C16 2 12 2 12 2" fill="#81C784" />
                    <path d="M12 10C12 10 8 8 8 5C8 2 12 2 12 2" fill="#A5D6A7" />
                    
                    {/* Hati (Pink Strawberry) */}
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                        fill="#FF5E7A" 
                        stroke="#FFC0CB" 
                        strokeWidth="1"
                    />
                </svg>
            </div>
        </div>
        
        {/* Teks Intro */}
        <h1 className="text-5xl font-black text-rose-500 tracking-tighter animate-pulse drop-shadow-sm" style={{ fontFamily: 'sans-serif' }}>
            WellSpace
        </h1>
        <p className="text-slate-500 font-bold mt-2 tracking-widest text-xs uppercase">Grow Healthy Habits</p>
        
        {/* Loading Spinner */}
        <div className="mt-10 w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
    </div>
);

// --- KOMPONEN: ONBOARDING PAGE (LOGO BARU) ---
const OnboardingPage = ({ navigate }) => {
    return (
        <div className="onboarding-page-container">
            <div className="onboarding-content">
                <h1 className="onboarding-logo-title text-rose-600">WellSpace</h1>
                <p className="onboarding-subtitle-top">Your Daily Habit Companion</p>
                
                {/* LOGO BARU: BLOOMING HEART */}
                <div className="onboarding-graphic-area mb-10">
                    <div className="w-60 h-60 bg-white/60 backdrop-blur-sm rounded-full shadow-2xl flex items-center justify-center border-4 border-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-32 h-32 drop-shadow-lg">
                            <path d="M12 2L12 10" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M12 10C12 10 16 8 16 5C16 2 12 2 12 2" fill="#81C784" />
                            <path d="M12 10C12 10 8 8 8 5C8 2 12 2 12 2" fill="#A5D6A7" />
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                                fill="#FF5E7A" 
                                stroke="#FFC0CB" 
                                strokeWidth="1"
                            />
                        </svg>
                    </div>
                </div>

                <div className="onboarding-bottom-section">
                    <div className="onboarding-text-block">
                        <h2 className="onboarding-title-bottom text-slate-800">Small steps,<br/>big changes.</h2>
                        <p className="onboarding-instruction text-slate-600">Log meals, Hydrate & Grow!</p>
                    </div>

                    <div className="onboarding-nav">
                        <div className="nav-dots">
                            <span className="dot active bg-rose-500"></span>
                            <span className="dot bg-rose-200"></span>
                        </div>
                        <div className="skip-group">
                            <button onClick={() => navigate('welcome')} className="skip-btn text-rose-500 font-bold">
                                Skip
                            </button>
                            <div onClick={() => navigate('welcome')} className="arrow-btn bg-rose-400 shadow-lg hover:bg-rose-500 transition">
                                <ArrowLeft size={24} className="text-white rotate-180" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mock-home-bar bg-slate-300"></div>
        </div>
    );
};

// ====================================================================
// --- 4. MAIN APP COMPONENT (Router Implementation) ---
// ====================================================================
const App = () => {
    const [activePage, setActivePage] = useState('onboarding'); 
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userId, setUserId] = useState(null);
    const [routeParams, setRouteParams] = useState({}); 

    // --- SPLASH SCREEN STATE ---
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 3000); // 3 saat
        return () => clearTimeout(timer);
    }, []);
    // ----

    // State Global untuk Pengguna (Mock Data, akan dikemas kini oleh Login/Register)
    const [userName, setUserName] = useState('Wendy');
    const [userEmail, setUserEmail] = useState('wendy00@gmail.com');
    const [userStats, setUserStats] = useState({ weight: '', height: '' });

    // --- DARK MODE STATE ---
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);
    // -----------------------

    // Custom Navigasi Function untuk menghantar parameter
    const navigate = (page, params = {}) => {
        setRouteParams(params);
        setActivePage(page);
    };

    // Initial Firebase Setup (Runs once)
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setUserId(user.uid);
                setUserName(user.displayName || user.email?.split('@')[0]);
                setUserEmail(user.email);
            } else {
                setUserId(null);
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    // Mock data for the dashboard layout 
    const metrics = [
        { label: 'Proteins', value: '62.5' },
        { label: 'Fats', value: '23.1' },
        { label: 'Carbs', value: '53.6' },
        { label: 'RDC', value: '12%', color: '#C30000' },
    ];
    const featureCards = [
        { title: 'ACTIVITY GOAL', icon: <Activity />, color: 'activity-card', description: "Track your runs and steps. Stay active, keep focused.", link: 'activity' },
        { title: 'HYDRATION & SLEEP', icon: <MoonStar />, color: 'hydration-card', description: "Check your rest and water intake. Boost focus and energy.", link: 'hydration' }, 
        { title: 'REMINDERS & SCHEDULE', icon: <Bell />, color: 'reminders-card', description: "Don't skip meals! Manage your busy schedule.", link: 'reminders' },
        { title: 'WELLNESS DIARY / MOOD CHECK', icon: <CheckSquare />, color: 'wellness-card', description: "Log your feelings and manage daily stress. Enjoy life to the fullest.", link: 'diary' }, 
    ];
    
    // SVG logo/mascot (untuk Welcome Area)
    const logoSvg = (
        <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 100 100" className="welcome-logo">
            <defs>
                <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor: "#FFC0CB", stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: "#FF69B4", stopOpacity: 1}} />
                </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="#FFF"/>
            <path d="M 30 50 C 30 30 70 30 70 50 L 70 70 C 70 80 60 85 50 85 C 40 85 30 80 30 70 Z" fill="url(#g1)" stroke="#C30000" strokeWidth="3"/>
            <circle cx="42" cy="45" r="5" fill="#000"/>
            <circle cx="58" cy="45" r="3" fill="#000"/>
            <path d="M 40 65 Q 50 75 60 65" stroke="#C30000" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </svg>
    );

    const renderPage = () => {
        // Peta navigasi menggunakan switch/case (simulasi router)
        switch (activePage) {
            case 'onboarding': return <OnboardingPage navigate={navigate} />; 
            case 'welcome': return <WelcomePage navigate={navigate} />;
            case 'login': return <Login navigate={navigate} setUserName={setUserName} setUserEmail={setUserEmail} isAuthReady={isAuthReady} />;
            case 'register': return <Register navigate={navigate} setUserName={setUserName} setUserEmail={setUserEmail} isAuthReady={isAuthReady} />;
            case 'forgot-password': return <ForgotPasswordPage navigate={navigate} isAuthReady={isAuthReady} />;
            case 'dashboard':
            case 'menu': 
                return <DashboardContent metrics={metrics} featureCards={featureCards} logoSvg={logoSvg} navigate={navigate} userName={userName} />;
            case 'activity': return <ActivityTrackerPage navigate={navigate} userId={userId} />; 
            case 'weekly-progress': return <ActivityPage />;
            case 'reminders': return <RemindersPage navigate={navigate} />; 
            case 'nutrition': 
            case 'hydration': return <HydrationSleepPage navigate={navigate} />;
            case 'sleep':  return <SleepTrackerPage navigate={navigate} userId={userId} />;
            case 'diary': return <MoodSelectPage navigate={navigate} />;
            case 'diary-entry': return <DiaryEntryPage navigate={navigate} routeParams={routeParams} userId={userId} />;
            case 'history': return <HistoryPage userId={userId} isAuthReady={isAuthReady} navigate={navigate} />; 
            case 'profile':
            case 'settings': return <ProfilePage navigate={navigate} userName={userName} userEmail={userEmail} setUserName={setUserName} setUserEmail={setUserEmail} isAuthReady={isAuthReady} darkMode={darkMode}
                    setDarkMode={setDarkMode}/>;
            case 'tasks': return <TasksPage navigate={navigate} />;
            case 'wellness-tools': return <WellnessToolsPage navigate={navigate} userStats={userStats} setUserStats={setUserStats} />;
            case 'search': return <SearchPage navigate={navigate} />;
            default:
                return (
                    <div className="p-8 text-center bg-gray-100 min-h-screen">
                        <h2 className="text-2xl font-bold mt-20 text-indigo-700">{activePage.toUpperCase()} (Coming Soon)</h2>
                        <p className="mt-4 text-gray-600">This page is a placeholder for your intended route (Current User ID: {userId || 'N/A'}).</p>
                        <button onClick={() => navigate('dashboard')} className="btn-placeholder mt-8 bg-indigo-500">Go to Dashboard</button>
                    </div>
                );
        }
    };

    const isBottomNavVisible = ['dashboard', 'activity', 'history', 'reminders', 'profile', 'nutrition', 'diary', 'hydration', 'sleep', 'tasks'].some(page => activePage.startsWith(page));
    // Kalau Splash aktif, tunjuk skrin intro je
    if (showSplash) {
        return <SplashScreen />;
    }

    return (
        <div className="app-wrapper min-h-screen">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap'); 
                
                body {
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
    /* 👇 STRAWBERRY MATCHA UNTUK SATU SKRIN 👇 */
    background: linear-gradient(180deg, #FFDEE9 0%, #B5FFFC 100%);
    background-attachment: fixed; /* Supaya warna dia kekal cantik bila scroll */
}
                .app-wrapper { max-width: 480px; margin: 0 auto; box-shadow: 0 0 20px rgba(0,0,0,0.1); background-color: white; }
                .btn-placeholder { padding: 12px 24px; border-radius: 9999px; font-weight: 600; color: white; display: block; width: 100%; cursor: pointer; text-align: center; }
                .back-btn svg { stroke: #4A4A4A; }
                .back-btn { background: none; border: none; cursor: pointer; padding: 0; }
                
                /* ONBOARDING STYLES */
                .onboarding-page-container {min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between;align-items: center;
                background: linear-gradient(180deg, #FFDEE9 0%, #B5FFFC 100%);
                padding: 40px 25px 20px 25px;
                position: relative;
                }
                .onboarding-logo-title { font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 700; color: #C30000; margin-bottom: 5px; }
                .onboarding-subtitle-top { font-size: 1.1rem; font-weight: 600; color: #4A4A4A; margin-bottom: 50px; }
                .onboarding-graphic-area { margin-bottom: 150px; }
                .onboarding-bottom-section { width: 100%; display: flex; flex-direction: column; align-items: flex-start; flex-grow: 1; justify-content: flex-end; }
                .onboarding-text-block { text-align: left; margin-bottom: 30px; }
                .onboarding-title-bottom { font-size: 1.5rem; font-weight: 900; color: #000; margin-bottom: 5px; line-height: 1.3; }
                .onboarding-instruction { font-size: 1rem; color: #333; font-weight: 500; }
                .onboarding-nav { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
                .nav-dots { display: flex; gap: 10px; }
                .dot { width: 10px; height: 10px; border-radius: 50%; background-color: #F8B4AA; opacity: 0.7; }
                .dot.active { background-color: #C30000; width: 12px; height: 12px; opacity: 1; }
                .skip-group { display: flex; align-items: center; gap: 15px; }
                .skip-btn { background: none; border: none; color: #C30000; font-size: 1.1rem; font-weight: 600; cursor: pointer; padding: 0; }
                .arrow-btn { background-color: #FFC0CB; border-radius: 50%; width: 45px; height: 45px; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
                .mock-home-bar { position: absolute; bottom: 8px; width: 130px; height: 5px; background-color: rgba(0, 0, 0, 0.3); border-radius: 5px; }

                /* LOGIN & WELCOME STYLES */
               .welcome-page-container, .login-page-container {
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                background: linear-gradient(180deg, #FFDEE9 0%, #B5FFFC 100%);
                }
                .welcome-card { padding: 40px; text-align: center; }
                .welcome-title { font-size: 2.5rem; font-weight: 900; color: #C30000; margin-bottom: 10px; }
                .welcome-subtitle { font-size: 1.1rem; color: #555; margin-bottom: 30px; }
                .welcome-button-group button { margin-bottom: 15px; }
                .btn-lg { padding: 15px; border-radius: 30px; font-size: 1.1rem; font-weight: bold; width: 100%; cursor: pointer; }
                .btn-login { background: #7E57C2; color: white; border: none; box-shadow: 0 4px 10px rgba(126, 87, 194, 0.4); }
                .btn-register { background: white; color: #7E57C2; border: 2px solid #7E57C2; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); }
                .login-form-card { padding: 40px 30px; }
                .header h1 { font-size: 2.2rem; font-weight: 800; margin-bottom: 5px; }
                .header p { line-height: 1.5; margin-bottom: 40px; }
                .input-group-icon { position: relative; margin-bottom: 25px; }
                .input-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #7e57c2; }
                .login-form-card input { width: 100%; padding: 15px 15px 15px 45px; border: 1px solid #ffccff; border-radius: 30px; background: #fff; box-shadow: 0 4px 10px rgba(255, 179, 219, 0.25); box-sizing: border-box; outline: none; }
                .forgot-pass { text-align: right; margin-bottom: 30px; }
                .btn-primary { width: 100%; padding: 15px; border: none; border-radius: 30px; background: linear-gradient(90deg, #5e35b1, #7e57c2); color: white; font-weight: bold; margin-top: 10px; box-shadow: 0 8px 20px rgba(94, 53, 177, 0.4); cursor: pointer; }
                .footer-link { text-align: center; margin-top: 30px; color: #888; }
                
                /* FORGOT PASSWORD STYLES */
                .forgot-password-page-container { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: linear-gradient(180deg, #FFC0CB 0%, #FF69B4 100%); padding: 20px; position: relative; }
                .forgot-card { width: 100%; max-width: 400px; text-align: center; z-index: 10; }
                .forgot-header { margin-bottom: 50px; }
                .logo-title { font-size: 2rem; font-weight: 900; color: #C30000; margin: 0; }
                .logo-subtitle { font-size: 0.9rem; color: #4A4A4A; }
                .forgot-body { background: white; border-radius: 20px; padding: 40px 30px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
                .title-oopss { font-size: 2.5rem; font-weight: 900; color: #C30000; margin-bottom: 5px; }
                .subtitle-forgot { font-size: 1.5rem; font-weight: 700; color: #7E57C2; margin-bottom: 30px; }
                .forgot-body .input-group-icon { margin-bottom: 30px; }
                .forgot-body .input-icon { color: #C30000; }
                .reset-input { width: 100%; padding: 15px; border: 1px solid #ddd; border-radius: 30px; box-sizing: border-box; text-align: center; font-size: 1rem; }
                .send-btn { width: 50%; padding: 12px; border: none; border-radius: 30px; background: #FF69B4; color: white; font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(255, 105, 180, 0.5); margin-bottom: 20px; }
                .instruction-text { font-size: 0.85rem; color: #555; line-height: 1.4; margin-bottom: 40px; }
                .forgot-footer { color: #4A4A4A; font-size: 0.9rem; margin-top: 30px; }
                .register-link { color: #C30000; font-weight: 600; cursor: pointer; }
                
                /* PROFILE PAGE STYLES */
                .profile-page-container { min-height: 100vh; background: linear-gradient(135deg, #fde492 0%, #ffc0cb 50%, #ff69b4 100%); padding: 20px 25px 90px 25px; box-sizing: border-box; text-align: center; }
                .profile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .profile-title { font-size: 1.8rem; font-weight: 700; color: #4A4A4A; margin: 0 auto; }
                .profile-info-section { background: rgba(255, 255, 255, 0.4); padding: 20px; border-radius: 20px; backdrop-filter: blur(5px); box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 30px; color: #C30000; }
                .avatar-wrapper { display: inline-block; margin-bottom: 10px; }
                .profile-name { font-size: 1.5rem; font-weight: 800; color: #C30000; margin-bottom: 5px; }
                .profile-email { font-size: 1rem; color: #7E57C2; font-weight: 500; margin-bottom: 20px; }
                .profile-options-section { background: white; border-radius: 20px; padding: 10px 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: left; }
                .option-item { display: flex; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee; cursor: pointer; transition: background-color 0.2s; }
                .option-item:last-child { border-bottom: none; }
                .option-item:hover { background-color: #f9f9f9; border-radius: 10px; }
                .option-icon { color: #C30000; margin-right: 15px; min-width: 24px; min-height: 24px; }
                .option-label { font-size: 1.1rem; font-weight: 600; color: #333; }
                .logout-item { color: #D32F2F; font-weight: 700; }
                .logout-item .option-icon { color: #D32F2F; }
                .profile-input { width: 100%; padding: 8px 12px; border: 1px solid #FFC0CB; border-radius: 8px; margin-bottom: 5px; text-align: center; color: #333; background: #FFF8F8; box-sizing: border-box; }
                
                /* Checklist */
                .daily-checklist-card { background: white; border-radius: 15px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin: 10px auto 30px auto; width: 90%; text-align: left; }
                .checklist-title { font-size: 1.2rem; font-weight: 700; color: #7E57C2; margin-bottom: 15px; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                .checklist-items { padding-bottom: 10px; }
                .checklist-item-row { display: flex; align-items: center; margin-bottom: 10px; padding: 5px 0; }
                .checklist-icon { margin-right: 10px; min-width: 20px; }
                .checklist-label { flex-grow: 1; font-size: 1rem; font-weight: 500; }
                .checklist-checkbox { width: 20px; height: 20px; border-radius: 4px; border: 2px solid #ccc; cursor: pointer; margin-left: 10px; }
                .checklist-checkbox:checked { background-color: #28A745; border-color: #28A745; }
                .checklist-footer { margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; text-align: center; }
                .save-checklist-btn { padding: 8px 15px; background: #6A1B9A; color: white; border: none; border-radius: 20px; font-weight: 600; cursor: pointer; }
                .checklist-status { font-weight: 600; color: #2E7D32; }

                /* DASHBOARD HOME SCREEN STYLES */
                .dashboard-container { padding: 20px 25px 90px 25px; min-height: 100vh; box-sizing: border-box; background: linear-gradient(180deg, #FFFDE7 0%, #FFE0F0 40%, #E0E0FF 100%); }
                .top-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
                .welcome-area { display: flex; align-items: center; }
                .welcome-logo { width: 35px; height: 35px; margin-right: 10px; }
                .welcome-text { font-size: 1.2rem; font-weight: 700; color: #4A4A4A; margin: 0; }
                .top-icons { display: flex; gap: 15px; font-size: 1.5rem; color: #4A4A4A; }
                .breakfast-card { background: #FFF; border-radius: 20px; padding: 20px 25px; margin-bottom: 25px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); position: relative; }
                .breakfast-title { font-size: 1.3rem; font-weight: 800; color: #C30000; margin-bottom: 5px; }
                .breakfast-calories { font-size: 0.9rem; color: #888; margin-bottom: 20px; }
                .metric-grid { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; }
                .metric-item { text-align: center; flex-basis: 25%; }
                .metric-value { font-size: 1.3rem; font-weight: 800; color: #4A4A4A; margin-bottom: 3px; }
                .metric-label { font-size: 0.8rem; color: #555; font-weight: 600; }
                .breakfast-card .top-right-icons { position: absolute; top: 20px; right: 25px; display: flex; gap: 10px; font-size: 1.2rem; color: #C30000; }
                .bottom-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F0F0F0; padding-top: 15px; font-size: 0.9rem; }
                .today-dropdown { font-weight: 600; color: #555; cursor: pointer; text-decoration: none; }
                .see-progress { font-weight: 700; color: #C30000; text-decoration: none; }
                .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .feature-card { border-radius: 15px; padding: 15px; min-height: 150px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); color: #FFF; text-decoration: none; }
                .card-title-icon { display: flex; justify-content: space-between; align-items: center; font-weight: 700; margin-bottom: 5px; }
                .card-title-icon .icon { font-size: 1.5rem; }
                .card-content { font-size: 0.85rem; margin: 5px 0 10px 0; line-height: 1.4; color: #E0E0E0; }
                .check-action { display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 0.9rem; margin-top: auto; color: white; text-decoration: none; }
                .check-arrow { font-size: 1.2rem; }
                .activity-card { background-color: #F47C7C; } 
                .hydration-card { background-color: #F8B44A; } 
                .reminders-card { background-color: #6EB48B; } 
                .wellness-card { background-color: #8C6AA1; } 

                /* Bottom Navigation Styles */
                .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: #FFF; padding: 10px 0; border-top-left-radius: 25px; border-top-right-radius: 25px; box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.1); display: flex; justify-content: space-around; align-items: center; z-index: 1000; }
                .nav-icon { display: flex; flex-direction: column; align-items: center; font-size: 1.5rem; color: #999; cursor: pointer; transition: color 0.2s; padding: 8px 15px; }
                .nav-icon.active { color: #C30000; }
                
                /* MODAL STYLES */
                .modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; padding: 20px; }
                .nutrition-modal-content { background: white; border-radius: 20px; padding: 30px; width: 100%; max-width: 400px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .modal-header h2 { font-size: 1.5rem; font-weight: 700; color: #C30000; }
                .modal-subtitle { font-size: 1rem; color: #555; margin-bottom: 20px; }
                .food-input-textarea { width: 100%; min-height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 10px; resize: vertical; box-sizing: border-box; margin-bottom: 15px; }
                .process-btn { width: 100%; padding: 12px; border: none; border-radius: 25px; background: #2E7D32; color: white; font-weight: bold; cursor: pointer; transition: background 0.2s; }
                .process-btn:disabled { background: #ccc; cursor: not-allowed; }
                .status-message { text-align: center; margin-bottom: 10px; font-weight: 600; }
                .meal-selection-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
                .meal-select-btn { padding: 12px; border-radius: 10px; background: #F0F0F0; border: 2px solid transparent; font-weight: 600; color: #333; cursor: pointer; transition: all 0.2s; }
                .meal-select-btn:hover { background: #E0E0E0; }

                /* TASKS PAGE STYLES */
                .tasks-page-container-v2 { min-height: 100vh; background: linear-gradient(135deg, #fde492 0%, #ffc0cb 50%, #ff69b4 100%); padding: 20px 25px 90px 25px; box-sizing: border-box; color: #4A4A4A; }
                .tasks-header-v2 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .tasks-title-v2 { font-size: 2.5rem; font-weight: 900; color: #000; margin: 0; flex-grow: 1; text-align: center; }
                .date-display { display: flex; align-items: center; font-size: 0.9rem; color: #555; font-weight: 600; }
                .calendar-strip { display: flex; justify-content: space-around; align-items: center; background: white; border-radius: 15px; padding: 10px 0; margin-bottom: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .calendar-day { display: flex; flex-direction: column; align-items: center; padding: 8px 5px; cursor: pointer; border-radius: 10px; transition: background-color 0.2s; }
                .calendar-day:hover { background-color: #f0f0f0; }
                .calendar-day.selected { background-color: #7E57C2; color: white; }
                .calendar-day .day-name { font-size: 0.8rem; font-weight: 700; margin-bottom: 3px; }
                .calendar-day .day-num { font-size: 1.1rem; font-weight: 800; }
                .no-tasks-placeholder { text-align: center; padding: 40px 20px; border-radius: 15px; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-bottom: 30px; }
                .tasks-list-v2 { background: white; border-radius: 15px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 30px; }
                .list-title { font-size: 1.2rem; font-weight: 700; color: #C30000; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                .task-row-v2 { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
                .task-row-v2:last-child { border-bottom: none; }
                .task-checkbox-v2 { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #7E57C2; margin-right: 15px; cursor: pointer; appearance: none; -webkit-appearance: none; outline: none; }
                .task-checkbox-v2:checked { background-color: #7E57C2; border-color: #7E57C2; position: relative; }
                .task-checkbox-v2:checked::after { content: '✓'; color: white; font-size: 14px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); line-height: 1; }
                .task-text { font-size: 1rem; font-weight: 500; color: #4A4A4A; }
                .task-text.completed { text-decoration: line-through; color: #999; }
                .new-task-input-section { display: flex; align-items: center; gap: 10px; background: white; border-radius: 30px; padding: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .new-task-input { flex-grow: 1; padding: 10px 15px; border: none; border-radius: 20px; outline: none; font-size: 1rem; }
                .add-task-btn { background: #C30000; color: white; border: none; border-radius: 50%; width: 45px; height: 45px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: opacity 0.2s; }
                .add-task-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                
                /* REMINDERS PAGE STYLES */
                .reminders-page-container { padding: 20px 25px 90px 25px; min-height: 100vh; box-sizing: border-box; background: linear-gradient(180deg, #FFF8E1 0%, #FFD1FF 100%); }
                .reminders-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .reminders-title { font-size: 1.8rem; font-weight: 800; color: #C30000; margin: 0 auto; }
                .set-reminders-title { font-size: 1.5rem; font-weight: 600; color: #C30000; margin-bottom: 25px; text-align: left; }
                .reminders-list { display: flex; flex-direction: column; gap: 15px; }
                .reminder-card { background: white; border-radius: 15px; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .reminder-label-group { display: flex; align-items: center; gap: 15px; }
                .reminder-name { font-size: 1.1rem; font-weight: 600; color: #333; }
                .save-reminder-btn { width: 100%; padding: 15px; border: none; border-radius: 30px; background: #FFB3C1; color: #C30000; font-size: 1rem; font-weight: bold; cursor: pointer; margin-top: 40px; box-shadow: 0 4px 10px rgba(195, 0, 0, 0.2); }
                .mood-page-container { padding: 20px 25px; min-height: 100vh; box-sizing: border-box; background: linear-gradient(180deg, #FAD0C4 0%, #FFD1FF 100%); text-align: center; }
                .mood-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .mood-title { font-size: 1.8rem; font-weight: 800; color: #C30000; margin: 0 auto; }
                .kawaii-face { margin-bottom: 50px; }
                .mood-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; max-width: 300px; margin: 0 auto; }
                .mood-card { padding: 10px; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s; border: 3px solid; background-color: white; }
                .selected-mood { border-color: #C30000 !important; box-shadow: 0 0 0 4px rgba(211, 47, 47, 0.3); }
                .mood-emoji { display: block; width: 100%; height: auto; object-fit: contain; margin: 0 auto; }
                .mood-prompt { font-size: 1.6rem; font-weight: 800; color: #C30000; margin-top: 50px; }
                .diary-entry-page-container { min-height: 100vh; box-sizing: border-box; background: #FFF7F9; }
                .diary-image-wrapper { padding-bottom: 20px; background-color: #FAD0C4; border-bottom-left-radius: 50% 30px; border-bottom-right-radius: 50% 30px; overflow: hidden; }
                .diary-hero-image { display: block; width: 90%; max-width: 300px; height: auto; margin: 0 auto; }
                .diary-content-wrapper { padding: 40px 25px 90px 25px; border-top-left-radius: 30px; border-top-right-radius: 30px; margin-top: -30px; z-index: 10; position: relative; }
                .diary-quote { color: white; font-size: 1.3rem; font-weight: 600; line-height: 1.4; margin-bottom: 30px; text-align: center; }
                .diary-textarea-style { width: 100%; min-height: 200px; padding: 15px; border-radius: 15px; border: none; outline: none; resize: none; font-size: 1rem; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 20px; box-sizing: border-box; }
                .diary-save-btn { width: 100%; padding: 15px; border: none; border-radius: 30px; background: linear-gradient(90deg, #E91E63, #FF69B4); color: white; font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 0 5px 15px rgba(233, 30, 99, 0.4); transition: all 0.2s; }
                .diary-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .save-message { text-align: center; margin-top: 20px; font-weight: 700; }
                
                .history-page-container (background: linear-gradient(180deg, #FFDEE9 0%, #B5FFFC 100%);); min-height: 100vh; padding: 20px 25px 90px 25px; box-sizing: border-box; }
                .history-header-style { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .history-title-style { font-size: 2.2rem; font-weight: 800; color: #C30000; margin: 0; margin-left: 20px; flex-grow: 1; text-align: left; }
                .history-subtitle { font-size: 0.9rem; color: #555; margin-top: -15px; margin-bottom: 30px; text-align: center; }
                .search-container { position: relative; margin-bottom: 30px; }
                .search-input { width: 100%; padding: 12px 15px 12px 45px; border: 1px solid #FFC0CB; border-radius: 30px; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); font-size: 1rem; outline: none; box-sizing: border-box; }
                .search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #C30000; }
                .recent-logs-title { font-size: 1.5rem; font-weight: 700; color: #C30000; margin-bottom: 20px; text-align: left; }
                .logs-list-wrapper { display: flex; flex-direction: column; gap: 15px; }
                .log-card { background-color: #ffffff; padding: 15px 20px; border-radius: 12px; border-left: 5px solid; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05); position: relative; }
                .log-type { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; display: block; }
                .log-entry { font-size: 1rem; color: #555; margin: 5px 0 10px 0; line-height: 1.5; }
                .analysis-entry { color: #4A4A4A; margin-bottom: 10px; }
                .log-date { font-size: 0.8rem; color: #999; display: block; text-align: right; }
                .hydration-page-container { min-height: 100vh; box-sizing: border-box; background: linear-gradient(180deg, #E8F5E9 0%, #B3E0EB 100%); padding: 20px 25px 90px 25px; }
                .hydration-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .hydration-title { font-size: 1.8rem; font-weight: 800; color: #1A531A; margin: 0 auto; }
                .water-tracker-section { text-align: left; margin-bottom: 30px; }
                .water-count { font-size: 2rem; font-weight: 900; color: #000; margin-bottom: 5px; }
                .water-description { font-size: 0.9rem; color: #4A4A4A; margin-bottom: 25px; }
                .water-description-success { font-size: 1.1rem; font-weight: 700; color: #2E7D32; margin-bottom: 25px; text-align: center; padding: 5px; border-radius: 5px; background: #C8E6C9; }
                .water-drop-grid-v2 { display: grid; gap: 15px 10px; margin: 0 auto 30px auto; max-width: 350px; }
                .droplet-item, .plus-item { display: flex; justify-content: center; align-items: center; }
                .water-plus-btn-v2 { background: #FFF; border: 2px solid #17A2B8; color: #17A2B8; border-radius: 50%; width: 30px; height: 30px; font-size: 1.4rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: all 0.2s; }
                .water-plus-btn-v2.active { border-color: #388E3C; color: #388E3C; }
                .hidden-plus { visibility: hidden; }
                .reminder-toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; margin-bottom: 15px; font-size: 1rem; font-weight: 600; color: #333; }
                .reminder-time-selector { position: relative; margin-bottom: 30px; }
                .time-dropdown-v2 { width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid #ccc; appearance: none; -webkit-appearance: none; background: white; font-size: 1rem; font-weight: 500; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
                .dropdown-arrow-v2 { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); pointer-events: none; }
                .daily-goal-card-v2 { background: #E8F5E9; border-radius: 15px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: left; margin-bottom: 30px; }
                .daily-goal-title { font-size: 1.2rem; font-weight: 700; color: #000; margin-bottom: 15px; }
                .goal-metrics-v2 { display: flex; justify-content: space-around; margin-bottom: 20px; background: white; padding: 15px 10px; border-radius: 10px; box-shadow: inset 0 0 5px rgba(0,0,0,0.05); }
                .goal-metrics-v2 div { text-align: center; }
                .metric-avg-v2, .metric-min-v2, .metric-max-v2 { font-size: 1.1rem; font-weight: 800; color: #000; margin-bottom: 3px; }
                .metric-label-small { font-size: 0.75rem; color: #555; text-transform: uppercase; }
                .change-goal-btn-v2 { width: 100%; padding: 15px; border: none; border-radius: 30px; background: #000; color: white; font-size: 1rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.4); }
                .sleep-tracker-link-v2 { width: 100%; padding: 15px; border: none; border-radius: 30px; background: #7E57C2; color: white; font-size: 1rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(126, 87, 194, 0.4); }
                .sleep-page-container { min-height: 100vh; box-sizing: border-box; background: linear-gradient(180deg, #F0E0FF 0%, #A188AE 100%); padding: 20px 25px 90px 25px; }
                .sleep-title { font-size: 1.8rem; font-weight: 800; color: #4A4A4A; margin: 0 auto; }
                .current-date-v2 { font-size: 1.4rem; font-weight: 700; color: #4A4A4A; margin-bottom: 25px; text-align: left; }
                .tracking-card-purple { background: #7E57C2; color: white; border-radius: 15px; padding: 20px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: left; display: flex; flex-direction: column; justify-content: space-between; }
                .day-name-card { font-size: 1.5rem; font-weight: 900; margin-bottom: 5px; }
                .sleep-time-display { font-size: 1rem; font-weight: 500; margin-bottom: 15px; }
                .sleep-time-inputs-v2 { display: flex; gap: 10px; align-items: center; margin-bottom: 20px; font-size: 0.9rem; font-weight: 500; }
                .sleep-time-inputs-v2 label { white-space: nowrap; }
                .time-input-sleep { background: rgba(255, 255, 255, 0.2); border: none; border-radius: 8px; padding: 8px 10px; color: white; text-align: center; width: 100px; }
                .statistics-title { font-size: 1.5rem; font-weight: 700; color: #4A4A4A; margin-bottom: 20px; text-align: left; }
                .statistics-title-weekly { font-size: 1.5rem; font-weight: 700; color: #4A4A4A; margin-top: 30px; margin-bottom: 20px; text-align: left; }
                .stat-card-pink { background: #FFC0CB; border-radius: 15px; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); text-align: left; }
                .stat-label-sleep { font-size: 0.9rem; color: #7E57C2; font-weight: 600; margin-bottom: 5px; }
                .stat-value-sleep { font-size: 1.5rem; font-weight: 800; color: #4A4A4A; margin-bottom: 10px; }
                .progress-bar-wrap-sleep { background: #E0E0E0; border-radius: 5px; height: 8px; overflow: hidden; }
                .progress-bar-sleep { height: 100%; background: #7E57C2; transition: width 0.5s; }
                .weekly-sleep-card-purple { background: white; border-radius: 15px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center; }
                .chart-placeholder { height: 200px; width: 100%; }
                .screen-time-input-row { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; margin-bottom: 10px; font-size: 1rem; color: #4A4A4A; font-weight: 500; background: rgba(255, 255, 255, 0.5); padding: 10px; border-radius: 10px; }
                .screen-time-input { width: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 5px; text-align: center; }
                .activity-page-container { padding: 20px 25px 90px 25px; min-height: 100vh; box-sizing: border-box; background: linear-gradient(180deg, #FFEBEB 0%, #FFD1E0 100%); }
                .activity-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .activity-title { font-size: 1.5rem; font-weight: 700; color: #C30000; margin: 0 auto; }
                .section-title { font-size: 1.3rem; font-weight: 700; color: #4A4A4A; margin-bottom: 15px; text-align: left; }
                .current-activity-card { background-color: #F47C7C; border-radius: 15px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; flex-direction: column; align-items: flex-start; color: white; position: relative; min-height: 180px; }
                .activity-details { flex-grow: 1; padding-right: 15px; }
                .activity-name { font-size: 1.2rem; font-weight: 800; margin-bottom: 5px; }
                .activity-distance { font-size: 2.8rem; font-weight: 900; line-height: 1; margin-bottom: 5px; }
                .activity-time { font-size: 0.9rem; font-weight: 500; margin-bottom: 15px; }
                .checkout-btn { background: #C30000; color: white; border: none; border-radius: 20px; padding: 8px 15px; font-weight: bold; cursor: pointer; font-size: 0.9rem; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
                .activity-icon-large { color: white; opacity: 0.9; position: absolute; top: 20px; right: 20px; }
                .daily-stats-card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
                .daily-stats-card-grid .stat-item { background: #FFD1A6; border-radius: 15px; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: center; }
                .stat-icon-foot, .stat-icon-fire { color: #C30000; margin-bottom: 5px; }
                .stat-value-sm { font-size: 1.4rem; font-weight: 800; color: #4A4A4A; line-height: 1.2; }
                .stat-label-sm { font-size: 0.8rem; color: #777; font-weight: 600; }
                .schedule-list { display: flex; flex-direction: column; gap: 10px; }
                .schedule-card { background: white; border-radius: 15px; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #FFC0CB; position: relative; }
                .schedule-info { text-align: left; display: flex; flex-direction: column; align-items: flex-start; }
                .schedule-name { font-size: 1.2rem; font-weight: 700; color: #333; display: block; margin-bottom: 5px; }
                .cals-per-min-label { font-size: 0.8rem; color: #555; margin-bottom: 10px; }
                .start-btn { padding: 5px 15px; border: none; border-radius: 20px; background: #D32F2F; color: white; font-size: 0.85rem; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
                .stop-btn { background: #FF69B4; }
                .schedule-icon { color: #C30000; opacity: 0.9; position: absolute; right: 20px; top: 50%; transform: translateY(-50%); }
                .gemini-analysis-box { background: #FFF; border-radius: 15px; padding: 15px; margin-top: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border: 1px solid #7E57C2; }
                .analysis-title { font-size: 1rem; font-weight: 700; color: #7E57C2; margin-bottom: 10px; display: flex; align-items: center; }
                .analysis-text { font-size: 0.9rem; color: #4A4A4A; line-height: 1.5; }
                .time-log-container { background: #F8F8F8; border-radius: 15px; padding: 20px; margin-top: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .time-log-title { font-size: 1.1rem; font-weight: 700; color: #333; margin-bottom: 10px; }
                .time-input-group { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
                .time-input-group label { font-weight: 600; color: #555; }
                .time-input { padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; width: 45%; text-align: center; }
                .calculation-result { display: flex; justify-content: space-between; margin: 15px 0 20px 0; padding: 10px; background: #EFEBE9; border-radius: 8px; font-size: 0.95rem; font-weight: 500; color: #333; }
                .log-activity-btn { width: 100%; padding: 12px; border: none; border-radius: 25px; background: #7E57C2; color: white; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(126, 87, 194, 0.4); }
                .search-page-container { min-height: 100vh; background: linear-gradient(135deg, #fde492 0%, #ffc0cb 50%, #ff69b4 100%); padding: 20px 25px 90px 25px; box-sizing: border-box; }
                .search-header-style { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .search-main-content { display: flex; flex-direction: column; }
                .search-title { font-size: 2.2rem; font-weight: 800; color: #C30000; margin: 0; margin-bottom: 5px; }
                .search-subtitle { font-size: 1.1rem; color: #555; margin-bottom: 30px; }
                .search-input-wrapper { position: relative; margin-bottom: 20px; }
                .search-icon-input { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #C30000; }
                .search-input-field { width: 100%; padding: 15px 15px 15px 45px; border-radius: 30px; border: none; outline: none; font-size: 1rem; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .back-to-dashboard-btn { background: #7E57C2; color: white; padding: 12px; border-radius: 30px; border: none; font-weight: bold; cursor: pointer; width: 100%; box-shadow: 0 4px 10px rgba(126, 87, 194, 0.4); }
                .illustration-wrapper { margin-top: 40px; display: flex; justify-content: center; }

                /* --- DARK MODE: MIDNIGHT TECH THEME 🌃 --- */
                
                /* 1. Background Utama: Gelap Gelita (Midnight Blue) */
                html.dark body { background: #020617 !important; }
                
                .dark .app-wrapper { background: #020617 !important; }
                
                /* 2. Background Page: Gradien Hitam ke Biru Gelap */
                .dark .dashboard-container, 
                .dark .profile-page-container,
                .dark .history-page-container,
                .dark .activity-page-container,
                .dark .reminders-page-container,
                .dark .sleep-page-container,
                .dark .tasks-page-container-v2,
                .dark .search-page-container,
                .dark .diary-entry-page-container,
                .dark .welcome-page-container, 
                .dark .login-page-container,
                .dark .forgot-password-page-container { 
                    /* Warna "Deep Space" */
                    background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%) !important; 
                }

                /* 3. Kad-kad Menu: Warna Kelabu Besi (Slate) */
                .dark .breakfast-card, 
                .dark .feature-card,
                .dark .reminder-card,
                .dark .log-card,
                .dark .daily-goal-card-v2,
                .dark .tasks-list-v2,
                .dark .profile-options-section,
                .dark .daily-checklist-card,
                .dark .tracking-card-purple,
                .dark .weekly-sleep-card-purple,
                .dark .search-input-wrapper input,
                .dark .welcome-card,
                .dark .login-form-card,
                .dark .forgot-card {
                    background-color: #1E293B !important; /* Slate 800 */
                    border: 1px solid #334155 !important; /* Border halus */
                    color: #E2E8F0 !important; /* Tulisan Putih/Kelabu Cerah */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
                }

                /* 4. Tulisan & Ikon Jadi Putih/Biru Neon */
                .dark .welcome-text, 
                .dark .profile-title, 
                .dark .history-title-style,
                .dark .activity-title,
                .dark .reminders-title,
                .dark .sleep-title,
                .dark .tasks-title-v2,
                .dark .search-title,
                .dark .section-title,
                .dark .recent-logs-title,
                .dark .daily-goal-title,
                .dark .option-label,
                .dark .reminder-name,
                .dark .checklist-label,
                .dark .list-title,
                .dark .task-text,
                .dark .metric-value,
                .dark h1, .dark h2, .dark h3 {
                    color: #F8FAFC !important; /* Putih Bersih */
                }
                
                .dark .metric-label,
                .dark .profile-email,
                .dark .log-entry,
                .dark .card-content,
                .dark p, .dark span {
                    color: #94A3B8 !important; /* Kelabu Cool */
                }
                
                /* 5. Ikon-ikon penting jadi Biru Elektrik (Accent) */
                .dark .back-btn svg,
                .dark .top-icons svg,
                .dark .menu-icon-btn svg,
                .dark .option-icon,
                .dark .checklist-icon {
                    color: #38BDF8 !important; /* Sky Blue Neon */
                    stroke: #38BDF8 !important;
                }
                
                /* Butang-butang jadi gelap */
                .dark button {
                    opacity: 0.9;
                }
                `}
            </style>

            {/* Render the current active page */}
            {renderPage()}

            {/* 4. BOTTOM NAVIGATION BAR (Only visible on main app screens) */}
            {isBottomNavVisible && (
                <nav className="bottom-nav">
                    {/* Activity */}
                    <div className={`nav-icon ${activePage.startsWith('activity') ? 'active' : ''}`} onClick={() => navigate('activity')}>
                        <Activity size={24} />
                    </div>
                    {/* History / Metrics */}
                    <div className={`nav-icon ${activePage === 'history' ? 'active' : ''}`} onClick={() => navigate('history')}>
                        <Clock size={24} />
                    </div>
                    {/* Home / Dashboard */}
                    <div className={`nav-icon ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => navigate('dashboard')}>
                        <Home size={24} />
                    </div>
                    {/* Reminders / Notifications */}
                    <div className={`nav-icon ${activePage === 'reminders' ? 'active' : ''}`} onClick={() => navigate('reminders')}>
                        <Bell size={24} />
                    </div>
                    {/* Profile / Settings */}
                    <div className={`nav-icon ${activePage === 'profile' ? 'active' : ''}`} onClick={() => navigate('profile')}>
                        <Settings size={24} />
                    </div>
                </nav>
            )}
        </div>
    );
}

export default App;