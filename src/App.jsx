import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// Mengimport semua ikon dari Lucide React
import { 
    Search, Bell, Plus, Edit2, Zap, Utensils,
    Activity, MoonStar, CheckSquare, Settings, LogIn, UserPlus, Home, Clock, ChevronDown, Droplet, Footprints, X, Mail, Lock, User, Bike, Dribbble, Dumbbell, Flame, Watch, MessageSquareText
} from 'lucide-react';

// ====================================================================
// --- GEMINI API INTEGRATION FUNCTION ---
// ====================================================================

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=";
const API_KEY = ""; // Kunci API akan disediakan oleh persekitaran semasa runtime

const fetchGeminiResponse = async (prompt, systemInstruction) => {
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
    };

    try {
        const response = await fetch(GEMINI_API_URL + API_KEY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, Gemini gagal menjana respons.";

    } catch (error) {
        console.error("Gemini API call failed:", error);
        return "Ralat sambungan AI. Sila cuba sebentar lagi.";
    }
};

// ====================================================================
// --- 1. FIREBASE SETUP & AUTHENTICATION HOOK ---
// ====================================================================
// Mengeluarkan import modular Firebase. Anda MESTI menggunakan sintaks global Canvas.

let db;
let auth;
let isFirebaseSetup = false;

// Fungsi untuk menyediakan Firebase secara global
const setupFirebase = async () => {
    try {
        // Hanya lakukan inisialisasi jika pemboleh ubah global wujud
        if (typeof firebase !== 'undefined' && typeof __firebase_config !== 'undefined') {
            const firebaseConfig = JSON.parse(__firebase_config);
            const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initialAuthToken : null;

            // Inisialisasi app, auth, dan firestore menggunakan sintaks global (Canvas environment)
            const app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth(app);
            db = firebase.firestore(app);
            isFirebaseSetup = true;

            // Logik Autentikasi
            if (initialAuthToken) {
                await auth.signInWithCustomToken(initialAuthToken);
            } else {
                await auth.signInAnonymously();
            }

            // firebase.firestore.setLogLevel('debug'); // Boleh diaktifkan untuk debugging
        } else {
            console.warn("Firebase global variables not found. Running in mock mode.");
        }
    } catch (error) {
        console.error("Firebase setup failed:", error);
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


// Mock AI Calculation (Logik Inti Permintaan Pengguna)
const calculateNutrition = (foodInput) => {
    const inputLower = foodInput.toLowerCase();
    let isHealthy = true;
    let calories = 0;
    let proteins = 0;
    let fats = 0;
    let carbs = 0;
    
    // Kata kunci untuk Makanan Kurang Sihat (Junk/Goreng/Manis)
    if (inputLower.includes('goreng') || inputLower.includes('nasi lemak') || inputLower.includes('manis') || inputLower.includes('fast food') || inputLower.includes('kek')) {
        isHealthy = false;
        calories = Math.floor(Math.random() * 400) + 500; // 500-900 kcal
        proteins = Math.floor(Math.random() * 15) + 5;
        fats = Math.floor(Math.random() * 30) + 15;
        carbs = Math.floor(Math.random() * 60) + 40;
    } 
    // Kata kunci untuk Makanan Sihat (Sayur/Panggang/Buah)
    else if (inputLower.includes('panggang') || inputLower.includes('sayur') || inputLower.includes('salad') || inputLower.includes('ikan') || inputLower.includes('ayam') || inputLower.includes('buah')) {
        isHealthy = true;
        calories = Math.floor(Math.random() * 200) + 200; // 200-400 kcal
        proteins = Math.floor(Math.random() * 30) + 15;
        fats = Math.floor(Math.random() * 10) + 2;
        carbs = Math.floor(Math.random() * 30) + 20;
    }
    // Nilai Default
    else {
        isHealthy = true;
        calories = 300;
        proteins = 20;
        fats = 10;
        carbs = 30;
    }
    
    // RDC (Recommended Daily Consumption) - Mock Calculation
    const totalDailyCalories = 2000;
    const rdcPercentage = Math.round((calories / totalDailyCalories) * 100);

    return {
        isHealthy,
        meal: foodInput,
        calories: calories.toFixed(0),
        proteins: proteins.toFixed(1),
        fats: fats.toFixed(1),
        carbs: carbs.toFixed(1),
        rdc: rdcPercentage.toFixed(0),
    };
};

// ====================================================================
// --- NUTRITION LOGGING MODAL ---
// ====================================================================

const NutritionModal = ({ onClose, onLogMeal, mealTime }) => {
    const [foodInput, setFoodInput] = useState('');
    const [status, setStatus] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async () => {
        if (!foodInput.trim()) {
            setStatus("Please enter the food consumed.");
            return;
        }

        setIsProcessing(true);
        setStatus('Calculating nutrition values...');

        // Simulasi kelewatan pemprosesan AI
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        const nutritionData = calculateNutrition(foodInput);
        
        onLogMeal(nutritionData, mealTime); // Hantar mealTime kembali
        onClose();
    };

    return (
        <div className="modal-backdrop">
            <div className="nutrition-modal-content">
                <div className="modal-header">
                    <h2>Log {mealTime}</h2>
                    <X className="cursor-pointer text-gray-500" size={24} onClick={onClose} />
                </div>
                
                <p className="modal-subtitle">What did you eat for {mealTime}?</p>

                <textarea
                    placeholder="E.g., Chicken Fried Rice, Iced Milk Tea"
                    value={foodInput}
                    onChange={(e) => {
                        setFoodInput(e.target.value);
                        setStatus('');
                    }}
                    className="food-input-textarea"
                    disabled={isProcessing}
                />
                
                <p className={`status-message ${status.includes('Please') || status.includes('enter') ? 'text-red-500' : 'text-green-600'}`}>{status}</p>

                <button onClick={handleProcess} className="process-btn" disabled={isProcessing || !foodInput.trim()}>
                    {isProcessing ? 'Processing...' : 'Calculate Nutrition'}
                </button>
            </div>
        </div>
    );
};

// --- KOMPONEN BARU: Pemilih Waktu Makan ---
const MealTimeSelector = ({ onSelect, onClose }) => {
    const mealTimes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

    return (
        <div className="modal-backdrop">
            <div className="nutrition-modal-content">
                <div className="modal-header">
                    <h2>Select Meal Time</h2>
                    <X className="cursor-pointer text-gray-500" size={24} onClick={onClose} />
                </div>
                
                <p className="modal-subtitle">Choose the meal time you want to log:</p>
                
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


// ====================================================================
// --- 3. PAGES / COMPONENTS ---
// ====================================================================

// --- ActivityTrackerPage (KOMPONEN BARU: Activity Goal) ---
const ActivityTrackerPage = ({ navigate }) => {
    
    // Status Aktiviti
    const [isTracking, setIsTracking] = useState(false);
    const [activityName, setActivityName] = useState('Cycling'); // Aktiviti semasa
    const [currentDistanceKm, setCurrentDistanceKm] = useState(0.00);
    const [currentSteps, setCurrentSteps] = useState(0);
    const [currentCalories, setCurrentCalories] = useState(0);

    // State untuk Log Masa (timestamp)
    const [startTime, setStartTime] = useState(null); 
    const [endTime, setEndTime] = useState(null);

    // State untuk Log Masa Manual (untuk input UI)
    const [manualStartTimeInput, setManualStartTimeInput] = useState('00:00'); 
    const [manualEndTimeInput, setManualEndTimeInput] = useState('00:00');


    const [geminiAnalysis, setGeminiAnalysis] = useState('Press "Start" to begin tracking.');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Data Mock Jadual
    const mockSchedule = [
        { name: 'Cycling', caloriesPerMinute: 8, icon: <Bike size={40} />, speedKMPH: 15, uiIcon: <Bike size={60} /> },
        { name: 'Running', caloriesPerMinute: 10, icon: <Footprints size={40} />, speedKMPH: 8, uiIcon: <Footprints size={60} /> },
        { name: 'Badminton', caloriesPerMinute: 6, icon: <Dribbble size={40} />, speedKMPH: 4, uiIcon: <Dribbble size={60} /> },
        { name: 'Swimming', caloriesPerMinute: 7, icon: <Dumbbell size={40} />, speedKMPH: 3, uiIcon: <Dumbbell size={60} /> }, // Menggunakan Dumbbell untuk Swimming
    ];

    // MENGIRA JARAK DAN KALORI BERDASARKAN MASA (Logik Inti)
    // Fungsi ini kini menerima start/end time secara eksplisit
    const calculateMetrics = useCallback((start, end, activity) => {
        if (!start || !end) return { duration: '0h 0m', distance: 0, calories: 0, distanceUnit: 'km', totalSteps: 0, durationHours: 0, timeLabel: '0h 0m' };

        const durationMs = end - start;
        let durationHours = durationMs / (1000 * 60 * 60);

        if (durationHours <= 0) return { duration: '0h 0m', distance: 0, calories: 0, distanceUnit: 'km', totalSteps: 0, durationHours: 0, timeLabel: '0h 0m' };
        
        // --- Konstanta Simulasi Kelajuan Berbeza ---
        const activityData = mockSchedule.find(a => a.name === activity);
        const speedKMPH = activityData?.speedKMPH || 5; 
        const calsPerMinute = activityData?.caloriesPerMinute || 5;

        
        // Pengiraan:
        const totalMinutes = durationHours * 60;
        let distance = durationHours * speedKMPH;
        let distanceUnit = 'km';

        // Tukar ke meter jika jarak sangat pendek
        if (distance < 1) {
            distance = distance * 1000;
            distanceUnit = 'm';
        }

        const activityCalories = totalMinutes * calsPerMinute;
        const steps = distance * 1300; // Simulasi langkah
        const stepsCalories = steps * 0.04; // Kalori dari langkah
        const totalCaloriesBurned = activityCalories + stepsCalories;


        const hours = Math.floor(durationHours);
        const minutes = Math.floor((durationHours - hours) * 60);

        return {
            duration: `${hours}h ${minutes}m`,
            distance: distance.toFixed(2),
            calories: totalCaloriesBurned.toFixed(0),
            distanceUnit: distanceUnit,
            totalSteps: Math.floor(steps),
            durationHours: durationHours,
            timeLabel: `${hours}h ${minutes}m`,
        };
    }, [mockSchedule]);

    
    // Auto-update UI semasa penjejakan
    useEffect(() => {
        let interval;
        if (isTracking && startTime) {
            interval = setInterval(() => {
                // Pengiraan metrik semasa berjalan
                const metrics = calculateMetrics(startTime, Date.now(), activityName);
                setCurrentDistanceKm(parseFloat(metrics.distance));
                setCurrentCalories(parseInt(metrics.calories));
                setCurrentSteps(parseInt(metrics.totalSteps));
            }, 1000); // Kemas kini setiap saat
        }
        return () => clearInterval(interval);
    }, [isTracking, startTime, activityName, calculateMetrics]);


    const handleLogActivity = async () => {
        // Tentukan masa yang akan digunakan (Log Manual diutamakan)
        let actualStartTime, actualEndTime;

        // Mendapatkan metrik berdasarkan input manual
        const today = new Date().toDateString();
        actualStartTime = new Date(today + ' ' + manualStartTimeInput).getTime();
        actualEndTime = new Date(today + ' ' + manualEndTimeInput).getTime();

        // Check if end time is before start time (meaning crossing midnight)
        if (actualEndTime <= actualStartTime) actualEndTime += 86400000; // Tambah 24 jam

        const metrics = calculateMetrics(actualStartTime, actualEndTime, activityName);
        
        if (metrics.durationHours <= 0) {
            alert('Aktiviti mesti mempunyai durasi masa yang sah untuk log manual.');
            return;
        }
        
        // --- Log Aktiviti ---
        setCurrentDistanceKm(parseFloat(metrics.distance));
        setCurrentCalories(parseInt(metrics.calories));
        setCurrentSteps(parseInt(metrics.totalSteps)); 
        
        // Panggil Gemini untuk analisis
        setIsAnalyzing(true);
        setGeminiAnalysis("Analyzing your performance... 🤖");

        const prompt = `Analyze this user's fitness performance: Activity: ${activityName}, Duration: ${metrics.durationHours} hours, Distance: ${metrics.distance} ${metrics.distanceUnit}, Calories Burned: ${metrics.calories}. Provide a concise performance analysis (1 paragraph) and one specific suggestion for improvement for the next session. Respond in English.`;
        const systemInstruction = "You are a personalized, encouraging AI Fitness Coach. Your analysis must be positive yet informative.";

        const analysis = await fetchGeminiResponse(prompt, systemInstruction);
        setGeminiAnalysis(analysis);
        setIsAnalyzing(false);

        // Reset inputs setelah log
        setManualStartTimeInput('00:00');
        setManualEndTimeInput('00:00');
        alert(`Activity Logged: ${activityName}, ${metrics.distance} ${metrics.distanceUnit}, ${metrics.calories} kcal. Analysis received.`);
    };
    
    // Logik Butang Mula/Berhenti
    const handleStartStop = (name) => {
        if (!isTracking) {
            // MULA MENJEJAK
            setActivityName(name);
            setStartTime(Date.now());
            setEndTime(null);
            setIsTracking(true);
            setCurrentDistanceKm(0.00); // Reset UI apabila mula
            setCurrentSteps(0);
            setCurrentCalories(0);
            setGeminiAnalysis('Tracking in progress. Press Stop to complete session.');

        } else if (activityName === name) {
            // BERHENTI MENJEJAK AKTIVITI SAMA
            const stopTime = Date.now();
            setEndTime(stopTime);
            setIsTracking(false);
            
            // Panggil Log Activity untuk mengira dan mendapatkan analisis AI (Menggunakan Start/Stop Logik)
            const metrics = calculateMetrics(startTime, stopTime, activityName);
            
            // Kita kemas kini UI dahulu
            setCurrentDistanceKm(parseFloat(metrics.distance));
            setCurrentCalories(parseInt(metrics.calories));
            setCurrentSteps(parseInt(metrics.totalSteps)); 

            // Panggil Gemini untuk analisis
            setIsAnalyzing(true);
            setGeminiAnalysis("Analyzing your performance... 🤖");

            const prompt = `Analyze this user's fitness performance: Activity: ${activityName}, Duration: ${metrics.durationHours} hours, Distance: ${metrics.distance} ${metrics.distanceUnit}, Calories Burned: ${metrics.calories}. Provide a concise performance analysis (1 paragraph) and one specific suggestion for improvement for the next session. Respond in English.`;
            const systemInstruction = "You are a personalized, encouraging AI Fitness Coach. Your analysis must be positive yet informative.";

            fetchGeminiResponse(prompt, systemInstruction).then(analysis => {
                setGeminiAnalysis(analysis);
                setIsAnalyzing(false);
                alert(`Activity Logged: ${activityName}, ${metrics.distance} ${metrics.distanceUnit}, ${metrics.calories} kcal. Analysis received.`);
            });
            
            // Reset state masa start/stop
            setStartTime(null);
            setEndTime(null);

        }
    };
    
    // UI Helpers
    const activityData = mockSchedule.find(a => a.name === activityName);
    const mainIcon = activityData ? activityData.uiIcon : <Activity size={60} />;
    
    const timeDisplay = useMemo(() => {
        // Jika sedang menjejak, tunjukkan masa real-time
        if (isTracking && startTime) {
            const currentDurationMs = Date.now() - startTime;
            const hours = Math.floor(currentDurationMs / (1000 * 60 * 60));
            const minutes = Math.floor((currentDurationMs / (1000 * 60)) % 60);
            const seconds = Math.floor((currentDurationMs / 1000) % 60);
            return `${hours}h ${minutes}m ${seconds}s`; // Tambah saat untuk feedback real-time
        }
        
        // Paparkan durasi 0h 0m jika belum ada log atau sesi belum tamat sepenuhnya
        const metrics = calculateMetrics(startTime, endTime, activityName);
        if (currentDistanceKm > 0 && metrics.duration !== '0h 0m') {
             return metrics.duration;
        }
        return '0h 0m';
    }, [isTracking, startTime, endTime, activityName, currentDistanceKm, calculateMetrics]);

    // Menghasilkan metrik untuk Log Manual secara dinamik
    const manualMetrics = calculateMetrics(
        new Date(new Date().toDateString() + ' ' + manualStartTimeInput).getTime(),
        new Date(new Date().toDateString() + ' ' + manualEndTimeInput).getTime(),
        activityName
    );

    const getCurrentIcon = () => {
        const activity = mockSchedule.find(a => a.name === activityName);
        return activity ? activity.uiIcon : <Activity size={60} />;
    };


    return (
        <div className="activity-page-container">
            {/* Header */}
            <header className="activity-header">
                <button onClick={() => navigate('dashboard')} className="back-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </button>
                <h1 className="activity-title">Activity Alert</h1>
                <ChevronDown className="text-gray-500 cursor-pointer" size={24} />
            </header>

            <main className="activity-main-content">
                
                <h2 className="section-title">Activities</h2>
                
                {/* 1. KAD AKTIVITI TERKINI (Current Activity Stats) */}
                <div className="current-activity-card" style={{backgroundColor: '#F47C7C' }}>
                    <div className="activity-details">
                        <h3 className="activity-name">{activityName}</h3>
                        <p className="activity-distance">{currentDistanceKm.toFixed(2)} km</p>
                        <p className="activity-time">Time: {timeDisplay}</p>
                        
                        {/* Butang Checkout hanya dipaparkan jika sesi tamat */}
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

                {/* 3. JADUAL AKTIVITI (SECTION 2: My Schedule) */}
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
                    <p className="analysis-text">{isAnalyzing ? 'Analyzing your performance... 🧠' : geminiAnalysis}</p>
                </div>
                
                {/* LOG DURATION MANUAL (Diletakkan di bawah untuk UI yang kemas) */}
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
                    
                    {/* Hasil Pengiraan Durasi */}
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
// --- Placeholder Components ASAS (Wajib ada) ---

const WelcomePage = ({ navigate }) => (
    <div className="welcome-page-container">
        <div className="welcome-card floating-card">
            <h1 className="welcome-title">Welcome to WellSpace!</h1> {/* <-- PERUBAHAN NAMA APLIKASI */}
            <p className="welcome-subtitle">Your personalized wellness journey starts here.</p>
            
            <div className="welcome-button-group">
                <button onClick={() => navigate('login')} className="btn-lg btn-login">
                    Login
                </button>
                <button onClick={() => navigate('register')} className="btn-lg btn-register">
                    Register
                </button>
            </div>
        </div>
    </div>
);

// --- Register Page (KOMPONEN BARU: Signup) ---
const Register = ({ navigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [retypePassword, setRetypePassword] = useState('');
    const [status, setStatus] = useState('');

    const handleRegister = () => {
        setStatus('Processing registration...');
        if (!email || !password || !retypePassword) {
            setStatus('Please fill in all fields.');
            return;
        }
        if (password !== retypePassword) {
            setStatus('Passwords do not match.');
            return;
        }
        // Logik Pendaftaran Firebase sebenar akan berada di sini.
        // Untuk tujuan demo, navigasi ke Login selepas simulasi kejayaan
        setTimeout(() => {
            setStatus('Registration successful! Redirecting to Login...');
            navigate('login');
        }, 1500);
    };

    return (
        <div className="login-page-container"> {/* Menggunakan gaya container yang sama */}
            <div className="login-form-card floating-card">
                <header className="header text-center">
                    <h1 className="text-red-700">We Say Hello!</h1>
                    <p className="text-gray-600">Register with your email and preferred password.</p>
                </header>

                <div className="input-group-icon">
                    <Mail className="input-icon" size={20} />
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="input-group-icon">
                    <Lock className="input-icon" size={20} />
                    <input 
                        type="password" 
                        placeholder="Create a Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="input-group-icon">
                    <Lock className="input-icon" size={20} />
                    <input 
                        type="password" 
                        placeholder="Retype Password" 
                        value={retypePassword}
                        onChange={(e) => setRetypePassword(e.target.value)}
                    />
                </div>
                
                {/* Butang Daftar (Menggunakan gaya yang sama seperti Log In) */}
                <button onClick={handleRegister} className="btn-primary">
                    Sign Up
                </button>
                
                {status && <p className="status-message-auth mt-4 text-sm font-semibold">{status}</p>}

                <div className="footer-link">
                    Already Have an Account? <a onClick={() => navigate('login')} className="text-red-500 cursor-pointer font-semibold">Enter</a>
                </div>
            </div>
        </div>
    );
};


// --- Login Page (Diubahsuai dengan reka bentuk Floating Card) ---
const Login = ({ navigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('');

    // Fungsi simulasi login
    const handleLogin = () => {
        setStatus('Logging in...');
        if (!email || !password) {
            setStatus('Please fill in both email and password.');
            return;
        }

        // Simulasi Logik Login: Autentikasi sebenar akan berlaku di sini
        // Untuk tujuan demo: Berjaya jika kedua-dua medan diisi, dan terus ke dashboard.
        setTimeout(() => {
            setStatus('Login successful! Redirecting to Dashboard...');
            navigate('dashboard');
        }, 1500);
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
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="input-group-icon">
                    <Lock className="input-icon" size={20} />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="forgot-pass">
                    <a onClick={() => navigate('forgot-password')} className="text-red-500 cursor-pointer text-sm font-semibold">Forgot Password?</a>
                </div>

                <button onClick={handleLogin} className="btn-primary">
                    Log In
                </button>
                
                {status && <p className="status-message-auth mt-4 text-sm font-semibold">{status}</p>}

                <div className="footer-link">
                    Don't Have an Account? <a onClick={() => navigate('register')} className="text-red-500 cursor-pointer font-semibold">Sign Up</a>
                </div>
            </div>
        </div>
    );
};


// --- KOMPONEN BARU: ForgotPasswordPage ---
const ForgotPasswordPage = ({ navigate }) => {
    const [identifier, setIdentifier] = useState('');
    const [status, setStatus] = useState('');

    const handleSendLink = () => {
        setStatus('Sending request...');
        if (!identifier.trim()) {
            setStatus('Please enter your email, phone number, or username.');
            return;
        }

        // Logik Firebase untuk menghantar pautan penetapan semula akan diletakkan di sini.
        setTimeout(() => {
            setStatus('A reset link has been sent to your email.');
            // Setelah berjaya, kembali ke Login
            setTimeout(() => navigate('login'), 2500);
        }, 1500);
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
                        <input 
                            type="text" 
                            placeholder="Username, Email or Phone Number" 
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="reset-input"
                        />
                    </div>

                    <button onClick={handleSendLink} className="send-btn">
                        Send
                    </button>
                    
                    <p className="instruction-text">
                        Enter your email, phone, or username and we'll send you a link to change a new password
                    </p>

                    {status && <p className={`status-message-reset mt-4 text-sm font-semibold ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{status}</p>}

                </div>
                
                <div className="forgot-footer">
                    Don't have an account? <a onClick={() => navigate('register')} className="register-link">Register</a>
                </div>
            </div>
        </div>
    );
};


const ActivityPage = () => (
    <div className="p-8 text-center bg-yellow-50 min-h-screen">
        <h2 className="text-2xl font-bold mt-20">Activity Goal Tracking</h2>
        <p className="mt-4 text-gray-600">Log your runs, steps, and exercises here.</p>
    </div>
);

const ProfilePage = () => (
    <div className="p-8 text-center bg-green-50 min-h-screen">
        <h2 className="text-2xl font-bold mt-20">User Profile / Settings</h2>
        <p className="mt-4 text-gray-600">Manage account information and preferences.</p>
    </div>
);


// --- KOMPONEN BARU: RemindersPage ---
const RemindersPage = ({ navigate }) => {
    // State untuk menguruskan togol bagi setiap amaran
    const [reminders, setReminders] = useState({
        breakfast: true,
        activity: false,
        water: true,
        lunch: true,
    });

    const handleToggle = (key) => {
        setReminders(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const reminderItems = [
        { key: 'breakfast', label: 'Breakfast Alert', icon: <Utensils size={24} />, color: '#D32F2F' },
        { key: 'activity', label: 'Activity Alert', icon: <Footprints size={24} />, color: '#C30000' }, // MENGGUNAKAN Footprints
        { key: 'water', label: 'Water Alert', icon: <Droplet size={24} />, color: '#17A2B8' },
        { key: 'lunch', label: 'Lunch Alert', icon: <Bell size={24} />, color: '#FBC02D' },
    ];

    return (
        <div className="reminders-page-container">
            <header className="reminders-header">
                <button onClick={() => navigate('dashboard')} className="back-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </button>
                <h1 className="reminders-title">WellSpace</h1>
                <div className="w-6"></div> {/* Placeholder for alignment */}
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
                            {/* Custom Toggle Switch */}
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


// --- KOMPONEN BARU: SleepTrackerPage (Peta ke /sleep) ---
const SleepTrackerPage = ({ navigate }) => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
    const formattedDay = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    
    // State untuk input pengguna
    const [sleepTime, setSleepTime] = useState('22:30'); // 10:30pm
    const [wakeTime, setWakeTime] = useState('06:30'); // 6:30am
    const [screenTimeHours, setScreenTimeHours] = useState(2); // Mock screen time, mempengaruhi Quality
    
    // Mock data untuk carta (Mon-Fri)
    const mockWeeklySleep = useMemo(() => [6.5, 7.0, 5.5, 7.5, 8.0], []);

    // 1. Mengira Durasi Tidur (Duration)
    const sleepDuration = useMemo(() => {
        // Gabungkan tarikh hari ini dengan masa input
        const sleepDate = new Date(today.toDateString() + ' ' + sleepTime);
        let wakeDate = new Date(today.toDateString() + ' ' + wakeTime);

        // Jika waktu bangun lebih awal dari waktu tidur (berarti tidur hingga hari berikutnya)
        if (wakeDate <= sleepDate) {
            wakeDate.setDate(wakeDate.getDate() + 1);
        }

        const diffTime = Math.abs(wakeDate.getTime() - sleepDate.getTime());
        const diffHours = diffTime / (1000 * 60 * 60);

        if (diffHours > 24 || diffHours < 0) return "N/A"; // Pencegahan ralat logik
        
        const hours = Math.floor(diffHours);
        const minutes = Math.round((diffHours - hours) * 60);
        
        return `${hours}j ${minutes}m`;
    }, [sleepTime, wakeTime]);


    // 2. Mengira Kualiti Tidur (Quality) berdasarkan Durasi dan Screen Time
    const sleepQuality = useMemo(() => {
        let diffHours = 0;
        try {
             const sleepDate = new Date(today.toDateString() + ' ' + sleepTime);
             let wakeDate = new Date(today.toDateString() + ' ' + wakeTime);
             if (wakeDate <= sleepDate) {
                 wakeDate.setDate(wakeDate.getDate() + 1);
             }
             diffHours = Math.abs(wakeDate.getTime() - sleepDate.getTime()) / (1000 * 60 * 60);
        } catch (e) {
            return "N/A";
        }
        
        let qualityBase = 0; // Kualiti berdasarkan jam (7-9 jam adalah optimum)
        
        if (diffHours >= 7 && diffHours <= 9) {
            qualityBase = 90;
        } else if (diffHours > 6) {
            qualityBase = 75;
        } else {
            qualityBase = 50;
        }
        
        // Sesuaikan kualiti berdasarkan masa skrin (screenTimeHours)
        // Setiap 1 jam screen time = -5% kualiti
        const qualityAdjustment = screenTimeHours * 5;
        
        let finalQuality = Math.max(0, qualityBase - qualityAdjustment);
        return `${finalQuality}%`;

    }, [sleepTime, wakeTime, screenTimeHours]);

    // Menghalakan ke halaman seterusnya (contoh: Dashboard)
    const handleStartTracking = () => {
        // Logik simpan data tidur ke Firestore akan dilaksanakan di sini
        alert(`Sleep logged: ${sleepTime} to ${wakeTime}. Quality: ${sleepQuality}`);
        navigate('dashboard');
    };


    return (
        <div className="sleep-page-container">
            <header className="sleep-header">
                <button onClick={() => navigate('hydration')} className="back-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </button>
                <h1 className="sleep-title">Sleep Tracker</h1>
                <ChevronDown className="text-gray-500 cursor-pointer" size={24} />
            </header>

            <main className="sleep-main-content">
                <h2 className="current-date">{formattedDate}</h2>

                {/* Tracking Input Card */}
                <div className="tracking-card">
                    <p className="day-name">{formattedDay}</p>
                    
                    {/* Input Masa */}
                    <div className="sleep-time-inputs">
                        <label>Sleep time:</label>
                        <input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
                        -
                        <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
                    </div>

                    <button onClick={handleStartTracking} className="start-tracking-btn">
                        Start Tracking
                    </button>
                </div>
                
                {/* Input Screen Time (Untuk simulasi Quality) */}
                <div className="screen-time-input-row">
                    <label>Screen Time Last Night (Hours):</label>
                    <input 
                        type="number" 
                        min="0" 
                        max="10"
                        value={screenTimeHours} 
                        onChange={(e) => setScreenTimeHours(parseInt(e.target.value))} 
                        className="screen-time-input"
                    />
                </div>
                
                <h2 className="statistics-title">Statistics</h2>

                {/* Quality & Duration Cards */}
                <div className="stats-grid">
                    <div className="stat-card quality-card">
                        <p className="stat-label">Quality</p>
                        <p className="stat-value">{sleepQuality}</p>
                        <div className="progress-bar-wrap">
                            {/* Bar kemajuan berdasarkan Quality */}
                            <div className="progress-bar" style={{ width: `${sleepQuality}` }}></div>
                        </div>
                    </div>
                    <div className="stat-card duration-card">
                        <p className="stat-label">Duration</p>
                        <p className="stat-value">{sleepDuration}</p>
                        <div className="progress-bar-wrap">
                            {/* Bar kemajuan Durasi (berdasarkan 7 jam) */}
                            <div className="progress-bar" style={{ width: `${Math.min(100, (parseFloat(sleepDuration) / 7.5) * 100)}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Carta Weekly Sleep */}
                <div className="weekly-sleep-card">
                    <h3 className="weekly-sleep-title">Weekly Sleep</h3>
                    {/* Placeholder Carta Vektor (Guna SVG ringkas) */}
                    <div className="chart-placeholder">
                        <svg viewBox="0 0 400 200" className="w-full h-auto">
                            {/* Garisan asas */}
                            <line x1="50" y1="180" x2="380" y2="180" stroke="#999" strokeWidth="2" />
                            {/* Label hari */}
                            {['Mon', 'Tues', 'Wed', 'Thurs', 'Fri'].map((day, index) => (
                                <text key={day} x={70 + index * 70} y="195" fontSize="14" fill="#555">{day}</text>
                            ))}
                            {/* Plot data mock */}
                            {mockWeeklySleep.map((hours, index) => (
                                <circle key={index} cx={70 + index * 70} cy={180 - (hours * 18)} r="5" fill="#C30000" />
                            ))}
                            {/* Sambungan garisan */}
                            {mockWeeklySleep.slice(0, -1).map((hours, index) => (
                                <line 
                                    key={index}
                                    x1={70 + index * 70} 
                                    y1={180 - (hours * 18)} 
                                    x2={70 + (index + 1) * 70} 
                                    y2={180 - (mockWeeklySleep[index+1] * 18)} 
                                    stroke="#C30000" 
                                    strokeWidth="2" 
                                />
                            ))}
                            <text x="10" y="100" fontSize="12" fill="#555" transform="rotate(-90, 10, 100)">hours</text>
                        </svg>
                    </div>
                </div>
            </main>
        </div>
    );
};


// --- KOMPONEN BARU: HydrationSleepPage (Peta ke /nutrition) ---
const HydrationSleepPage = ({ navigate }) => {
    const [dailyGoal, setDailyGoal] = useState(15);
    const [waterCount, setWaterCount] = useState(0); // Bermula dari 0
    const [isReminderOn, setIsReminderOn] = useState(false);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [newGoalInput, setNewGoalInput] = useState(15); // Untuk input sementara
    const GLASS_VOLUME_LITERS = 0.25; // 250ml per glass

    const handleWaterClick = () => {
        if (waterCount < dailyGoal) {
            setWaterCount(waterCount + 1);
        }
    };

    const handleGoalChange = () => {
        const goal = parseInt(newGoalInput);
        if (goal > 0 && goal <= 50) {
            setDailyGoal(goal);
            // Tetapkan semula kiraan jika ia melebihi matlamat baru
            if (waterCount > goal) {
                setWaterCount(goal);
            }
        }
        setIsEditingGoal(false);
    };

    // MENGIRA METRIK ISIPADU AIR SECARA DINAMIK
    const hydrationMetrics = useMemo(() => {
        const goalInLiters = dailyGoal * GLASS_VOLUME_LITERS;
        return {
            average: (goalInLiters * 0.8).toFixed(1), // 80% dari matlamat
            minimum: (goalInLiters * 0.6).toFixed(1), // 60% dari matlamat
            maximum: (goalInLiters * 1.3).toFixed(2), // 130% dari matlamat
        };
    }, [dailyGoal]);


    // Fungsi untuk melukis ikon titisan air
    const renderWaterDrops = () => {
        const drops = [];
        for (let i = 0; i < dailyGoal; i++) {
            const isFilled = i < waterCount;
            drops.push(
                <div key={i} className="water-drop-wrapper">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                        fill={isFilled ? "#17A2B8" : "none"}
                        stroke={isFilled ? "#17A2B8" : "#999"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="water-drop-icon"
                    >
                        <path d="M12 2.69L12 21.31C12 22.18 11.18 22.82 10.31 22.31L1.69 17.69C0.82 17.18 0.18 16.36 0.69 15.69L5.31 4.31C5.82 3.44 6.64 2.8 7.51 3.31L16.13 7.93C17 8.44 17.64 9.26 17.13 9.93L12 2.69Z" transform="translate(3 0)" />
                    </svg>
                    {/* Butang + di bawah titisan air */}
                    <button 
                        onClick={handleWaterClick} 
                        disabled={isFilled}
                        className={`water-plus-btn ${isFilled ? 'filled' : ''}`}
                    >
                        +
                    </button>
                </div>
            );
        }
        return drops;
    };


    return (
        <div className="hydration-page-container">
            {/* Header */}
            <header className="hydration-header">
                <button onClick={() => navigate('dashboard')} className="back-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </button>
                <h1 className="hydration-title">Water Alert</h1>
                <ChevronDown className="text-gray-500 cursor-pointer" size={24} />
            </header>

            <div className="water-tracker-section">
                <h2 className="water-count">{waterCount} / {dailyGoal} glasses</h2>
                <p className="water-description">Helps meet your hydration goal and boosts focus, directly addressing fatigue.</p>
                
                {/* Visual Tracker (Ikon titisan air) */}
                <div className="water-drop-grid">
                    {renderWaterDrops()}
                </div>

                {/* Reminder Toggle */}
                <div className="reminder-toggle-row">
                    <p>Remind me to drink water</p>
                    <label className="switch">
                        <input type="checkbox" checked={isReminderOn} onChange={() => setIsReminderOn(!isReminderOn)} />
                        <span className="slider round"></span>
                    </label>
                </div>
                
                <div className="reminder-time-selector">
                    <select className="time-dropdown">
                        <option>Every 30 minutes</option>
                        <option>Every 60 minutes</option>
                        <option>Every 90 minutes</option>
                    </select>
                    <ChevronDown size={20} className="text-gray-500 dropdown-arrow" />
                </div>
            </div>

            {/* Daily Goal Card */}
            <div className="daily-goal-card">
                <h3>Daily Goal: {dailyGoal} glasses</h3>
                <div className="goal-metrics">
                    {/* Nilai Dinamik */}
                    <div><p className="metric-avg">{hydrationMetrics.average} l/d</p><span className="metric-label-small">AVERAGE</span></div>
                    <div><p className="metric-min">{hydrationMetrics.minimum} l/d</p><span className="metric-label-small">MINIMUM</span></div>
                    <div><p className="metric-max">{hydrationMetrics.maximum} l/d</p><span className="metric-label-small">MAXIMUM</span></div>
                </div>

                {isEditingGoal ? (
                    <div className="goal-edit-area">
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={newGoalInput}
                            onChange={(e) => setNewGoalInput(e.target.value)}
                            className="goal-input"
                            placeholder="New Goal (1-50)"
                        />
                        <button onClick={handleGoalChange} className="save-goal-btn" disabled={!newGoalInput}>
                            Set Goal
                        </button>
                        <button onClick={() => setIsEditingGoal(false)} className="cancel-goal-btn">
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button onClick={() => { setNewGoalInput(dailyGoal); setIsEditingGoal(true); }} className="change-goal-btn">
                        Change Daily Goal
                    </button>
                )}
            </div>
            
            {/* BUTTON BARU: Ke Sleep Tracker */}
            <button onClick={() => navigate('sleep')} className="sleep-tracker-link">
                Go to Sleep Tracking
            </button>
            
        </div>
    );
};


// --- Mood Selection Page Component ---
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
        
        // Navigasi ke Diary Entry Page dengan mood
        setTimeout(() => navigate('diary-entry', { mood: moodName }), 200); 
    };

    return (
        <div className="mood-page-container">
            <header className="mood-header">
                <button onClick={() => navigate('dashboard')} className="back-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </button>
                <h1 className="mood-title">Mood&Wellness</h1>
                <Bell className="text-gray-500 cursor-pointer" size={24} onClick={() => navigate('reminders')} />
            </header>

            <div className="content-area">
                <div className="kawaii-face">
                    <span className="text-7xl">^_^</span>
                </div>
                
                <div className="mood-grid">
                    {moodOptions.map((mood) => (
                        <div
                            key={mood.name}
                            className={`mood-card ${selectedMood === mood.name ? 'selected-mood' : ''}`}
                            style={{ backgroundColor: mood.background, borderColor: selectedMood === mood.name ? '#C30000' : '#FFF' }}
                            onClick={() => handleMoodSelect(mood.name)}
                        >
                            {/* Menggantikan ikon dengan emoji untuk mudah */}
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

// --- Halaman Diary Entry Baru ---
const DiaryEntryPage = ({ navigate, routeParams, userId }) => {
    const mood = routeParams?.mood || 'Happy';
    const { quote, color } = getQuote(mood);
    const [entry, setEntry] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false); // State untuk Gemini

    const handleSave = async () => {
        if (!entry.trim()) {
            setSaveMessage("Sila tulis sesuatu sebelum menyimpan.");
            return;
        }

        setIsSaving(true);
        setSaveMessage('');

        // Tentukan ID aplikasi secara dalaman untuk keselamatan
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        // 1. Panggil Gemini untuk ringkasan
        setIsAnalyzing(true);
        const prompt = `Analyze the emotional tone of this diary entry and provide a concise one-sentence summary and a related motivational quote (2-3 sentences total). The user selected the mood: ${mood}. The entry is: "${entry}". Respond in English.`;
        const systemInstruction = "You are a supportive Wellness Coach AI. Your response must be comforting and actionable, starting with the summary and ending with a quote.";
        
        let geminiResponse = '';
        try {
            geminiResponse = await fetchGeminiResponse(prompt, systemInstruction);
        } catch (e) {
            geminiResponse = "Could not generate analysis.";
        }
        setIsAnalyzing(false);


        if (db && userId) {
            try {
                // Konfigurasi path Firestore (Private Data)
                const collectionPath = `artifacts/${appId}/users/${userId}/diary_logs`;
                
                // Simpan data
                await db.collection(collectionPath).add({
                    mood: mood,
                    entry: entry,
                    date: firebase.firestore.FieldValue.serverTimestamp(),
                    type: 'Diary',
                    color: color,
                    analysis: geminiResponse, // Simpan analisis Gemini
                });

                setSaveMessage(`Berjaya disimpan! ${geminiResponse}`);
                setTimeout(() => {
                    // Navigasi ke History page setelah berjaya
                    navigate('history');
                }, 2000);
            } catch (error) {
                console.error("Error saving diary entry:", error);
                setSaveMessage(`Ralat semasa menyimpan: ${error.message}`);
                setIsSaving(false);
            }
        } else {
            // Mock Save (Jika Firebase tidak berfungsi)
            setSaveMessage(`Mock Save Berjaya! Mood: ${mood}. ${geminiResponse}`);
            setTimeout(() => navigate('history'), 2500);
        }
    };

    return (
        <div className="diary-entry-page-container">
            <div className="diary-image-wrapper">
                {/* Ilustrasi placeholder */}
                <img src="https://placehold.co/300x250/FAD0C4/C30000?text=Mind+and+Heart" alt="Mind and Wellness" className="diary-hero-image" />
            </div>

            <div className="diary-content-wrapper" style={{ backgroundColor: color }}>
                {/* Kata-kata Motivasi */}
                <p className="diary-quote">"{quote}"</p>
                
                {/* Medan Input */}
                <textarea
                    placeholder="Type your feelings..."
                    value={entry}
                    onChange={(e) => {
                        setEntry(e.target.value);
                        setSaveMessage('');
                    }}
                    className="diary-textarea-style"
                    disabled={isSaving || isAnalyzing}
                />

                {/* Butang Simpan */}
                <button 
                    onClick={handleSave} 
                    className="diary-save-btn" 
                    disabled={isSaving || !entry.trim() || isAnalyzing}
                >
                    {isAnalyzing ? 'Analyzing... 🧠' : isSaving ? 'Saving...' : 'Save (Get Analysis ✨)'}
                </button>

                {/* Mesej Status/Motivasi Selepas Simpan */}
                {saveMessage && (
                    <div className="save-message" style={{ color: 'white' }}>
                        {saveMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Halaman HistoryPage (Mengemaskini untuk Membaca Firestore) ---
const HistoryPage = ({ userId, isAuthReady, navigate }) => { 
    const [recentLogs, setRecentLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';


    useEffect(() => {
        if (!isAuthReady || !userId || !db) return;

        setIsLoading(true);
        const collectionPath = `artifacts/${appId}/users/${userId}/diary_logs`;
        
        // Listener masa nyata (onSnapshot) untuk data log
            // ... (Kekalkan logika Firestore sedia ada) ...
        const unsubscribe = db.collection(collectionPath)
            .orderBy('date', 'desc')
            .limit(10)
            .onSnapshot(snapshot => {
                const logs = snapshot.docs.map(doc => {
                    const data = doc.data();
                    // Mengambil warna log dari Firestore
                    const moodColor = QUOTES_BY_MOOD[data.mood]?.color || '#555'; 
                    
                    const date = data.date ? data.date.toDate().toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBA';
                    return {
                        id: doc.id,
                        type: data.type || 'Log',
                        mood: data.mood || 'N/A',
                        entry: data.entry || 'No entry',
                        date: date,
                        color: moodColor,
                        analysis: data.analysis || '', // Mengambil analisis Gemini
                    };
                });
                setRecentLogs(logs);
                setIsLoading(false);
            }, error => {
                console.error("Error listening to logs:", error);
                setIsLoading(false);
            });

        return () => unsubscribe();
    }, [userId, isAuthReady]);

    return (
        <div className="history-page-container floating-card"> 
            <header className="header-style">
                <button onClick={() => navigate('dashboard')} className="menu-icon-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </button>
                <h1 className="title-style" style={{marginLeft: '20px'}}>Unified History</h1>
            </header>

            <main className="history-main-content">
                <h2 style={{color: '#333', textAlign: 'left', marginBottom: '20px', fontSize: '1.2rem'}}>Recent Logs ({recentLogs.length})</h2>
                
                {isLoading && <p className="text-center text-gray-500">Loading history...</p>}
                
                <div className="logs-list-wrapper">
                    {recentLogs.length > 0 ? (
                        recentLogs.map((log) => (
                            <div key={log.id} className="log-card" style={{borderColor: log.color}}>
                                <span className="log-type" style={{color: log.color}}>{log.type}: {log.mood}</span>
                                <p className="log-entry">{log.entry}</p>
                                {log.analysis && <p className="analysis-entry mt-2 text-xs font-medium italic" style={{color: log.color}}>{log.analysis}</p>}
                                <span className="log-date">{log.date}</span>
                            </div>
                        ))
                    ) : (
                        !isLoading && <p className="text-center text-gray-500">No entries yet. Start writing your diary!</p>
                    )}
                </div>
            </main>
        </div>
    );
};


// --- Dashboard Content ---
const DashboardContent = ({ metrics, featureCards, logoSvg, navigate }) => {
    // State untuk memegang data nutrisi terkini (untuk dipaparkan pada kad Breakfast)
    const [currentNutrition, setCurrentNutrition] = useState({
        meal: 'Breakfast',
        calories: '340',
        proteins: '62.5',
        fats: '23.1',
        carbs: '53.6',
        rdc: '12',
        isHealthy: true, // Untuk warna dinamik
    });
    
    // State untuk mengawal modal
    const [isMealSelectorOpen, setIsMealSelectorOpen] = useState(false);
    const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
    const [modalMealTime, setModalMealTime] = useState('Breakfast');

    // Mula proses log dengan memilih waktu makan
    const handleStartLog = () => {
        setIsMealSelectorOpen(true);
    };

    // Setelah waktu makan dipilih
    const handleMealTimeSelected = (time) => {
        setModalMealTime(time);
        setIsMealSelectorOpen(false);
        setIsNutritionModalOpen(true);
    };


    // Fungsi untuk melog makanan dari modal
    const handleLogMeal = (data, mealTime) => {
        setCurrentNutrition({
            meal: mealTime, 
            ...data
        });
        setIsNutritionModalOpen(false);
    };

    // Menentukan warna metrik berdasarkan penilaian kesihatan (isHealthy)
    const getMetricColor = (isHealthy) => isHealthy ? '#2E7D32' : '#D32F2F';

    // Data Metrik untuk Kad (Menggunakan State Nutrisi)
    const cardMetrics = [
        { label: 'Proteins', value: currentNutrition.proteins, color: getMetricColor(currentNutrition.isHealthy) },
        { label: 'Fats', value: currentNutrition.fats, color: getMetricColor(currentNutrition.isHealthy) },
        { label: 'Carbs', value: currentNutrition.carbs, color: getMetricColor(currentNutrition.isHealthy) },
        { label: 'RDC', value: `${currentNutrition.rdc}%`, color: getMetricColor(currentNutrition.isHealthy) },
    ];


    return (
        <div className="dashboard-container">
            {/* 1. MODAL PEMILIH WAKTU MAKAN */}
            {isMealSelectorOpen && <MealTimeSelector onClose={() => setIsMealSelectorOpen(false)} onSelect={handleMealTimeSelected} />}

            {/* 2. MODAL LOG NUTRISI */}
            {isNutritionModalOpen && <NutritionModal onClose={() => setIsNutritionModalOpen(false)} onLogMeal={handleLogMeal} mealTime={modalMealTime} />}

            {/* 3. TOP HEADER */}
            <header className="top-header">
                <div className="welcome-area">
                    {logoSvg}
                    <h1 className="welcome-text">WELCOME <strong>WENDY!</strong></h1>
                </div>
                <div className="top-icons">
                    <Search className="cursor-pointer" size={24} onClick={() => navigate('search')} />
                    <Bell className="cursor-pointer" size={24} onClick={() => navigate('reminders')} />
                </div>
            </header>

            {/* 4. BREAKFAST CARD (Daily Metrics) */}
            <div className="breakfast-card">
                {/* Top Section */}
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="breakfast-title">{currentNutrition.meal}</h2>
                        <p className="breakfast-calories">{currentNutrition.calories} calories</p>
                    </div>
                    <div className="top-right-icons">
                        {/* Butang Log Makanan BARU */}
                        <Plus 
                            className="cursor-pointer" 
                            size={20} 
                            onClick={handleStartLog}
                        />
                        <Edit2 className="cursor-pointer" size={20} />
                    </div>
                </div>
                
                {/* Metrics Grid */}
                <div className="metric-grid">
                    {cardMetrics.map((metric) => (
                        <div key={metric.label} className="metric-item">
                            {/* Menentukan warna secara dinamik */}
                            <p className="metric-value" style={{color: metric.color}}>{metric.value}</p>
                            <p className="metric-label">{metric.label}</p>
                        </div>
                    ))}
                </div>

                {/* Bottom Row */}
                <div className="bottom-row">
                    <a href="#" className="today-dropdown">
                        Today <span className="ml-1">↓</span>
                    </a>
                    <a onClick={() => navigate('weekly-progress')} className="see-progress cursor-pointer">
                        See Progress
                    </a>
                </div>
            </div>

            {/* 5. FEATURE CARDS (2x2 Grid) */}
            <div className="feature-grid">
                {featureCards.map((card) => (
                    // Menggunakan onClick untuk simulasi navigasi
                    <div 
                        key={card.title} 
                        className={`feature-card ${card.color} cursor-pointer`}
                        onClick={() => navigate(card.link)}
                    >
                        {/* Card Title & Icon */}
                        <div className="card-title-icon">
                            <h3 className="text-sm uppercase tracking-wider">{card.title}</h3>
                            <span className="icon">{card.icon}</span>
                        </div>
                        
                        {/* Card Content */}
                        <p className="card-content">
                            {card.description}
                        </p>

                        {/* Action Button (CHECK) */}
                        <a className="check-action text-white">
                            CHECK
                            <span className="check-arrow">→</span>
                        </a>
                    </div>
                ))}
            </div>
            
            {/* Hidden footer space to ensure content doesn't get covered by fixed nav */}
            <div className="h-20"></div> 
        </div>
    );
};


// ====================================================================
// --- 4. MAIN APP COMPONENT (Router Implementation) ---
// ====================================================================
const App = () => {
    const [activePage, setActivePage] = useState('welcome'); 
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userId, setUserId] = useState(null);
    const [routeParams, setRouteParams] = useState({}); // State baru untuk route parameters

    // Custom Navigasi Function untuk menghantar parameter
    const navigate = (page, params = {}) => {
        setRouteParams(params);
        setActivePage(page);
    };

    // Initial Firebase Setup (Runs once)
    useEffect(() => {
        const initialize = async () => {
            await setupFirebase();
            
            if (isFirebaseSetup) {
                 // Dapatkan UID setelah autentikasi
                 firebase.auth().onAuthStateChanged(user => {
                     setUserId(user ? user.uid : crypto.randomUUID());
                     setIsAuthReady(true);
                 });
            } else {
                 setUserId(crypto.randomUUID());
                 setIsAuthReady(true);
            }
        };
        initialize();
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
        // MENGEMASKINI: Menggunakan HydrationSleepPage untuk Nutrition
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
            <circle cx="58" cy="45" r="5" fill="#000"/>
            <path d="M 40 65 Q 50 75 60 65" stroke="#C30000" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </svg>
    );

    const renderPage = () => {
        // Peta navigasi menggunakan switch/case (simulasi router)
        switch (activePage) {
            case 'welcome':
                return <WelcomePage navigate={navigate} />;
            case 'login':
                return <Login navigate={navigate} />;
            case 'register': // ROUTE BARU: Register
                return <Register navigate={navigate} />;
            case 'forgot-password': // ROUTE BARU: Forgot Password
                return <ForgotPasswordPage navigate={navigate} />;
            case 'dashboard':
            case 'menu': 
                return <DashboardContent metrics={metrics} featureCards={featureCards} logoSvg={logoSvg} navigate={navigate} />;
            case 'activity':
                return <ActivityTrackerPage navigate={navigate} />; // MENGEMASKINI: Menghalakan ke ActivityTrackerPage
            case 'weekly-progress':
                return <ActivityPage />;
            case 'reminders':
                return <RemindersPage navigate={navigate} />; // MENGEMASKINI: Menghalakan ke RemindersPage
            case 'nutrition': // MENGEMASKINI: Menghalakan ke HydrationSleepPage
            case 'hydration':
                return <HydrationSleepPage navigate={navigate} />;
            case 'sleep': // ROUTE BARU
                return <SleepTrackerPage navigate={navigate} />; 
            case 'diary': // MOOD SELECTION
                return <MoodSelectPage navigate={navigate} />;
            case 'diary-entry': // DIARY ENTRY
                return <DiaryEntryPage navigate={navigate} routeParams={routeParams} userId={userId} />;
            case 'history': // HISTORY DENGAN BACAAN FIREBASE
                return <HistoryPage userId={userId} isAuthReady={isAuthReady} navigate={navigate} />; 
            case 'profile':
            case 'settings':
                return <ProfilePage />; // Guna ProfilePage sebagai placeholder untuk laluan awam lain
            case 'search':
                return (
                    <div className="p-8 text-center bg-gray-100 min-h-screen">
                        <h2 className="text-2xl font-bold mt-20 text-indigo-700">Search Page</h2>
                        <input type="text" placeholder="Start typing..." className="w-full p-3 border rounded-lg mt-4" />
                        <button onClick={() => navigate('dashboard')} className="btn-placeholder mt-8 bg-indigo-500">Back to Dashboard</button>
                    </div>
                );
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

    const isBottomNavVisible = ['dashboard', 'activity', 'history', 'reminders', 'profile', 'nutrition', 'diary', 'hydration', 'sleep'].includes(activePage);

    // Memandangkan anda menggunakan JSX, kita akan menggunakan Tailwind CSS dan gaya inline/style tag.
    return (
        <div className="app-wrapper min-h-screen">
            {/* Memuatkan Firebase secara global dan Tailwind CSS */}
            <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
            <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
            <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                {`
                /* Gaya yang diintegrasikan (Menggantikan App.css) */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
                
                body {
                    font-family: 'Inter', sans-serif;
                    margin: 0;
                    padding: 0;
                    background: linear-gradient(to bottom right, #ffe14c, #ff5c77);
                }
                .app-wrapper {
                    max-width: 480px; 
                    margin: 0 auto; 
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    background-color: white; /* Latar belakang utama untuk membungkus kandungan */
                }
                .btn-placeholder {
                    padding: 12px 24px;
                    border-radius: 9999px;
                    font-weight: 600;
                    color: white;
                    display: block;
                    width: 100%;
                    cursor: pointer;
                    text-align: center;
                }
                .back-btn svg {
                    stroke: #C30000;
                }
                
                /* --- LOGIN & WELCOME STYLES --- */
                .welcome-page-container, .login-page-container {
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: linear-gradient(to bottom right, #ffe14c, #ff5c77);
                }
                .welcome-card {
                    padding: 40px;
                    text-align: center;
                }
                .welcome-title {
                    font-size: 2.5rem;
                    font-weight: 900;
                    color: #C30000;
                    margin-bottom: 10px;
                }
                .welcome-subtitle {
                    font-size: 1.1rem;
                    color: #555;
                    margin-bottom: 30px;
                }
                .welcome-button-group button {
                    margin-bottom: 15px;
                }
                .btn-lg {
                    padding: 15px;
                    border-radius: 30px;
                    font-size: 1.1rem;
                    font-weight: bold;
                    width: 100%;
                    cursor: pointer;
                }
                .btn-login {
                    background: #7E57C2;
                    color: white;
                    border: none;
                    box-shadow: 0 4px 10px rgba(126, 87, 194, 0.4);
                }
                .btn-register {
                    background: white;
                    color: #7E57C2;
                    border: 2px solid #7E57C2;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }

                .login-form-card {
                    padding: 40px 30px;
                }
                .header h1 {
                    font-size: 2.2rem;
                    font-weight: 800;
                    margin-bottom: 5px;
                }
                .header p {
                    line-height: 1.5;
                    margin-bottom: 40px;
                }
                .input-group-icon {
                    position: relative;
                    margin-bottom: 25px; 
                }
                .input-icon {
                    position: absolute;
                    left: 15px; 
                    top: 50%;
                    transform: translateY(-50%);
                    color: #7e57c2; 
                }
                .login-form-card input {
                    width: 100%;
                    padding: 15px 15px 15px 45px;
                    border: 1px solid #ffccff; 
                    border-radius: 30px; 
                    background: #fff;
                    box-shadow: 0 4px 10px rgba(255, 179, 219, 0.25);
                    box-sizing: border-box;
                    outline: none;
                }
                .forgot-pass {
                    text-align: right; 
                    margin-bottom: 30px; 
                }
                .btn-primary {
                    width: 100%;
                    padding: 15px;
                    border: none;
                    border-radius: 30px;
                    background: linear-gradient(90deg, #5e35b1, #7e57c2); 
                    color: white;
                    font-weight: bold;
                    margin-top: 10px;
                    box-shadow: 0 8px 20px rgba(94, 53, 177, 0.4);
                    cursor: pointer;
                }
                .footer-link {
                    text-align: center; 
                    margin-top: 30px; 
                    color: #888;
                }
                
                /* --- FORGOT PASSWORD STYLES (BARU) --- */
                .forgot-password-page-container {
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: linear-gradient(180deg, #FFC0CB 0%, #FF69B4 100%); /* Pink Gradien */
                    padding: 20px;
                    position: relative;
                }
                .forgot-card {
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                    z-index: 10;
                }
                .forgot-header {
                    margin-bottom: 50px;
                }
                .logo-title {
                    font-size: 2rem;
                    font-weight: 900;
                    color: #C30000;
                    margin: 0;
                }
                .logo-subtitle {
                    font-size: 0.9rem;
                    color: #4A4A4A;
                }
                .forgot-body {
                    background: white;
                    border-radius: 20px;
                    padding: 40px 30px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                }
                .title-oopss {
                    font-size: 2.5rem;
                    font-weight: 900;
                    color: #C30000;
                    margin-bottom: 5px;
                }
                .subtitle-forgot {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #7E57C2;
                    margin-bottom: 30px;
                }
                .forgot-body .input-group-icon {
                    margin-bottom: 30px;
                }
                .forgot-body .input-icon {
                    color: #C30000;
                }
                .reset-input {
                    width: 100%;
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 30px;
                    box-sizing: border-box;
                    text-align: center;
                    font-size: 1rem;
                }
                .send-btn {
                    width: 50%;
                    padding: 12px;
                    border: none;
                    border-radius: 30px;
                    background: #FF69B4; /* Pink */
                    color: white;
                    font-size: 1.1rem;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 4px 10px rgba(255, 105, 180, 0.5);
                    margin-bottom: 20px;
                }
                .instruction-text {
                    font-size: 0.85rem;
                    color: #555;
                    line-height: 1.4;
                    margin-bottom: 40px;
                }
                .forgot-footer {
                    color: #4A4A4A;
                    font-size: 0.9rem;
                    margin-top: 30px;
                }
                .register-link {
                    color: #C30000;
                    font-weight: 600;
                    cursor: pointer;
                }


                /* --- DASHBOARD HOME SCREEN STYLES --- */
                .dashboard-container {
                    padding: 20px 25px 90px 25px;
                    min-height: 100vh;
                    box-sizing: border-box;
                    background: linear-gradient(180deg, #FFFDE7 0%, #FFE0F0 40%, #E0E0FF 100%);
                }
                /* ... (Gaya Dashboard, Logik Nutrisi, Mood, Hydration, Sleep kekal) ... */
                .top-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                }
                .welcome-area {
                    display: flex;
                    align-items: center;
                }
                .welcome-logo {
                    width: 35px;
                    height: 35px;
                    margin-right: 10px;
                }
                .welcome-text {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #4A4A4A;
                    margin: 0;
                }
                .top-icons {
                    display: flex;
                    gap: 15px;
                    font-size: 1.5rem;
                    color: #4A4A4A;
                }
                .breakfast-card {
                    background: #FFF;
                    border-radius: 20px;
                    padding: 20px 25px;
                    margin-bottom: 25px;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
                    position: relative;
                }
                .breakfast-title {
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: #C30000;
                    margin-bottom: 5px;
                }
                .breakfast-calories {
                    font-size: 0.9rem;
                    color: #888;
                    margin-bottom: 20px;
                }
                .metric-grid {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end; 
                    margin-bottom: 15px;
                }
                .metric-item {
                    text-align: center;
                    flex-basis: 25%;
                }
                .metric-value {
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: #4A4A4A;
                    margin-bottom: 3px;
                }
                .metric-label {
                    font-size: 0.8rem;
                    color: #555;
                    font-weight: 600;
                }
                .breakfast-card .top-right-icons {
                    position: absolute;
                    top: 20px;
                    right: 25px;
                    display: flex;
                    gap: 10px;
                    font-size: 1.2rem;
                    color: #C30000;
                }
                .bottom-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid #F0F0F0;
                    padding-top: 15px;
                    font-size: 0.9rem;
                }
                .today-dropdown {
                    font-weight: 600;
                    color: #555;
                    cursor: pointer;
                    text-decoration: none;
                }
                .see-progress {
                    font-weight: 700;
                    color: #C30000;
                    text-decoration: none;
                }
                .feature-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr; 
                    gap: 15px; 
                }
                .feature-card {
                    border-radius: 15px;
                    padding: 15px;
                    min-height: 150px; 
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
                    color: #FFF; 
                    text-decoration: none;
                }
                .card-title-icon {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 700;
                    margin-bottom: 5px;
                }
                .card-title-icon .icon {
                    font-size: 1.5rem;
                }
                .card-content {
                    font-size: 0.85rem;
                    margin: 5px 0 10px 0;
                    line-height: 1.4;
                    color: #E0E0E0; 
                }
                .check-action {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 800;
                    font-size: 0.9rem;
                    margin-top: auto; 
                    color: white;
                    text-decoration: none;
                }
                .check-arrow {
                    font-size: 1.2rem;
                }
                /* Card Colors (Mapping to the image provided) */
                .activity-card { background-color: #F47C7C; } /* Light Red/Coral */
                .hydration-card { background-color: #F8B44A; } /* Orange/Yellow */
                .reminders-card { background-color: #6EB48B; } /* Green/Mint */
                .wellness-card { background-color: #8C6AA1; } /* Purple/Lavender */

                /* Bottom Navigation Styles */
                .bottom-nav {
                    position: fixed;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100%;
                    max-width: 480px; 
                    background: #FFF;
                    padding: 10px 0;
                    border-top-left-radius: 25px;
                    border-top-right-radius: 25px;
                    box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.1);
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    z-index: 1000;
                }
                .nav-icon {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    font-size: 1.5rem;
                    color: #999;
                    cursor: pointer;
                    transition: color 0.2s;
                    padding: 8px 15px; 
                }
                .nav-icon.active {
                    color: #C30000;
                }
                
                /* --- MODAL STYLES --- */
                .modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                    padding: 20px;
                }
                .nutrition-modal-content {
                    background: white;
                    border-radius: 20px;
                    padding: 30px;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .modal-header h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #C30000;
                }
                .modal-subtitle {
                    font-size: 1rem;
                    color: #555;
                    margin-bottom: 20px;
                }
                .food-input-textarea {
                    width: 100%;
                    min-height: 100px;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    resize: vertical;
                    box-sizing: border-box;
                    margin-bottom: 15px;
                }
                .process-btn {
                    width: 100%;
                    padding: 12px;
                    border: none;
                    border-radius: 25px;
                    background: #2E7D32; /* Hijau */
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .process-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                .status-message {
                    text-align: center;
                    margin-bottom: 10px;
                    font-weight: 600;
                }
                .meal-selection-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-bottom: 10px;
                }
                .meal-select-btn {
                    padding: 12px;
                    border-radius: 10px;
                    background: #F0F0F0;
                    border: 2px solid transparent;
                    font-weight: 600;
                    color: #333;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .meal-select-btn:hover {
                    background: #E0E0E0;
                }

                /* --- REMINDERS PAGE STYLES (BARU) --- */
                .reminders-page-container {
                    padding: 20px 25px 90px 25px;
                    min-height: 100vh;
                    box-sizing: border-box;
                    background: linear-gradient(180deg, #FFF8E1 0%, #FFD1FF 100%);
                }
                .reminders-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .reminders-title {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: #C30000;
                    margin: 0 auto;
                }
                .set-reminders-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #C30000;
                    margin-bottom: 25px;
                    text-align: left;
                }
                .reminders-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .reminder-card {
                    background: white;
                    border-radius: 15px;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                }
                .reminder-label-group {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .reminder-name {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #333;
                }
                .save-reminder-btn {
                    width: 100%;
                    padding: 15px;
                    border: none;
                    border-radius: 30px;
                    background: #FFB3C1; /* Pink lembut */
                    color: #C30000;
                    font-size: 1rem;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 40px;
                    box-shadow: 0 4px 10px rgba(195, 0, 0, 0.2);
                }
                
                /* --- MOOD SELECTION PAGE STYLES --- */
                .mood-page-container {
                    padding: 20px 25px;
                    min-height: 100vh;
                    box-sizing: border-box;
                    background: linear-gradient(180deg, #FAD0C4 0%, #FFD1FF 100%); 
                    text-align: center;
                }
                .mood-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                }
                .mood-title {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: #C30000;
                    margin: 0 auto;
                }
                .back-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                }
                .kawaii-face {
                    margin-bottom: 50px;
                }
                .mood-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    max-width: 300px;
                    margin: 0 auto;
                }
                .mood-card {
                    padding: 10px;
                    border-radius: 20px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 3px solid; 
                    background-color: white;
                }
                .mood-card:hover {
                    box-shadow: 0 6px 15px rgba(211, 47, 47, 0.3);
                }
                .selected-mood {
                    border-color: #C30000 !important;
                    box-shadow: 0 0 0 4px rgba(211, 47, 47, 0.3);
                }
                .mood-emoji {
                    display: block;
                    width: 100%;
                    height: auto;
                    object-fit: contain;
                    margin: 0 auto;
                }
                .mood-prompt {
                    font-size: 1.6rem;
                    font-weight: 800;
                    color: #C30000;
                    margin-top: 50px;
                }

                /* --- DIARY ENTRY PAGE STYLES --- */
                .diary-entry-page-container {
                    min-height: 100vh;
                    box-sizing: border-box;
                    background: #FFF7F9; /* Latar belakang terang untuk bahagian atas */
                }
                .diary-image-wrapper {
                    padding-bottom: 20px;
                    background-color: #FAD0C4; /* Warna merah jambu lembut untuk ilustrasi */
                    border-bottom-left-radius: 50% 30px;
                    border-bottom-right-radius: 50% 30px;
                    overflow: hidden;
                }
                .diary-hero-image {
                    display: block;
                    width: 90%;
                    max-width: 300px;
                    height: auto;
                    margin: 0 auto;
                }
                .diary-content-wrapper {
                    padding: 40px 25px 90px 25px;
                    border-top-left-radius: 30px;
                    border-top-right-radius: 30px;
                    margin-top: -30px; /* Tarik ke atas untuk tumpang tindih */
                    z-index: 10;
                    position: relative;
                    /* Latar belakang ungu diatasi oleh inline style (quote color) */
                }
                .diary-quote {
                    color: white;
                    font-size: 1.3rem;
                    font-weight: 600;
                    line-height: 1.4;
                    margin-bottom: 30px;
                    text-align: center;
                }
                .diary-textarea-style {
                    width: 100%;
                    min-height: 200px;
                    padding: 15px;
                    border-radius: 15px;
                    border: none;
                    outline: none;
                    resize: none;
                    font-size: 1rem;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                    box-sizing: border-box;
                }
                .diary-save-btn {
                    width: 100%;
                    padding: 15px;
                    border: none;
                    border-radius: 30px;
                    background: linear-gradient(90deg, #E91E63, #FF69B4); /* Pink Gradient */
                    color: white;
                    font-size: 1.1rem;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 5px 15px rgba(233, 30, 99, 0.4);
                    transition: all 0.2s;
                }
                .diary-save-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .save-message {
                    text-align: center;
                    margin-top: 20px;
                    font-weight: 700;
                }
                /* --- HISTORY PAGE STYLES --- */
                .history-page-container {
                    /* Gaya floating card */
                    width: 90%;
                    max-width: 400px;
                    background-color: white; 
                    border-radius: 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    margin: 40px auto;
                    padding: 30px;
                    box-sizing: border-box;
                    min-height: auto;
                }
                .header-style {
                    display: flex;
                    align-items: center;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eee; 
                    margin-bottom: 20px;
                }

                .title-style {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #333;
                    margin: 0;
                }

                .logs-list-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 15px; 
                }

                .log-card {
                    background-color: #ffffff;
                    padding: 15px 20px;
                    border-radius: 12px;
                    border-left: 5px solid; 
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05); 
                    position: relative;
                }

                .log-type {
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 5px;
                    display: block;
                }

                .log-entry {
                    font-size: 1rem;
                    color: #555;
                    margin: 5px 0 10px 0;
                    line-height: 1.5;
                }

                .log-date {
                    font-size: 0.8rem;
                    color: #999;
                    display: block;
                    text-align: right;
                }
                
                /* --- HYDRATION PAGE STYLES (BARU) --- */
                .hydration-page-container {
                    padding: 20px 25px;
                    min-height: 100vh;
                    box-sizing: border-box;
                    background: linear-gradient(180deg, #E0F2F7 0%, #A9E4E9 100%); /* Gradien Aqua/Biru */
                }
                .hydration-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .hydration-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1976D2; /* Biru Gelap */
                    margin: 0 auto;
                }
                .water-tracker-section {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .water-count {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: #17A2B8;
                    margin-bottom: 5px;
                }
                .water-description {
                    font-size: 0.9rem;
                    color: #555;
                    margin-bottom: 25px;
                }
                .water-drop-grid {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 15px 25px;
                    margin-bottom: 30px;
                }
                .water-drop-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 50px;
                }
                .water-drop-icon {
                    margin-bottom: 5px;
                }
                .water-plus-btn {
                    background: #FFF;
                    border: 2px solid #17A2B8;
                    color: #17A2B8;
                    border-radius: 50%;
                    width: 25px;
                    height: 25px;
                    font-size: 1.2rem;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                }
                .water-plus-btn.filled {
                    background: #17A2B8;
                    color: white;
                    border-color: #17A2B8;
                }

                .reminder-toggle-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    margin-bottom: 15px;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #333;
                }
                .reminder-time-selector {
                    position: relative;
                    margin-bottom: 30px;
                }
                .time-dropdown {
                    width: 100%;
                    padding: 10px 15px;
                    border-radius: 10px;
                    border: 1px solid #ccc;
                    appearance: none;
                    -webkit-appearance: none;
                    background: white;
                    font-size: 1rem;
                    font-weight: 500;
                }
                .dropdown-arrow {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    pointer-events: none;
                }
                
                /* Goal Card */
                .daily-goal-card {
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    text-align: center;
                }
                .daily-goal-card h3 {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: #1976D2; /* Biru Gelap */
                    margin-bottom: 15px;
                }
                .goal-metrics {
                    display: flex;
                    justify-content: space-around;
                    margin-bottom: 20px;
                }
                .goal-metrics div {
                    text-align: center;
                }
                .metric-avg, .metric-min, .metric-max {
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: #333;
                    margin-bottom: 3px;
                }
                .metric-label-small {
                    font-size: 0.75rem;
                    color: #999;
                    text-transform: uppercase;
                }
                .change-goal-btn {
                    width: 100%;
                    padding: 15px;
                    border: none;
                    border-radius: 30px;
                    background: #000;
                    color: white;
                    font-size: 1rem;
                    font-weight: bold;
                    cursor: pointer;
                }
                .goal-edit-area {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .goal-input {
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 1.1rem;
                }
                .save-goal-btn {
                    width: 100%;
                    padding: 10px;
                    border: none;
                    border-radius: 20px;
                    background: #28A745; /* Hijau */
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                }
                .cancel-goal-btn {
                    width: 100%;
                    padding: 10px;
                    border: none;
                    border-radius: 20px;
                    background: #E0E0E0;
                    color: #333;
                    font-weight: bold;
                    cursor: pointer;
                }
                
                /* Toggle Switch (Sama seperti styles lama anda) */
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 45px;
                    height: 25px;
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 34px; 
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%; 
                }
                input:checked + .slider {
                    background-color: #17A2B8; /* Warna Biru Air */
                }
                input:checked + .slider:before {
                    transform: translateX(18px);
                }

                /* --- SLEEP TRACKER STYLES --- */
                .sleep-page-container {
                    padding: 20px 25px 90px 25px;
                    min-height: 100vh;
                    box-sizing: border-box;
                    background: linear-gradient(180deg, #F0E0FF 0%, #A188AE 100%); /* Gradien Ungu/Pink */
                }
                .sleep-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .sleep-title {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #6A1B9A; /* Ungu Gelap */
                    margin: 0 auto;
                }
                .current-date {
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: #4A4A4A;
                    margin-bottom: 25px;
                    text-align: left;
                }
                .tracking-card {
                    background: #7E57C2; /* Ungu Utama */
                    color: white;
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 30px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    text-align: left;
                }
                .day-name {
                    font-size: 1.5rem;
                    font-weight: 800;
                    margin-bottom: 5px;
                }
                .sleep-time-inputs {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1rem;
                    font-weight: 500;
                    margin-bottom: 15px;
                }
                .sleep-time-inputs input {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    border-radius: 8px;
                    padding: 8px 10px;
                    color: white;
                    text-align: center;
                    width: 100px;
                }
                .start-tracking-btn {
                    width: 100%;
                    padding: 12px;
                    border-radius: 25px;
                    border: none;
                    background: #FF69B4; /* Pink Aksent */
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 4px 10px rgba(255, 105, 180, 0.4);
                }
                
                .statistics-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #6A1B9A;
                    margin-bottom: 20px;
                    text-align: left;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .stat-card {
                    background: white;
                    border-radius: 15px;
                    padding: 15px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.08);
                    text-align: left;
                }
                .quality-card {
                    background-color: #FCE4EC; /* Pink Sangat Lembut */
                }
                .duration-card {
                    background-color: #E0F7FA; /* Biru Sangat Lembut */
                }
                .stat-label {
                    font-size: 0.9rem;
                    color: #6A1B9A;
                    font-weight: 600;
                    margin-bottom: 5px;
                }
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #4A4A4A;
                    margin-bottom: 10px;
                }
                .progress-bar-wrap {
                    background: #E0E0E0;
                    border-radius: 5px;
                    height: 8px;
                    overflow: hidden;
                }
                .progress-bar {
                    height: 100%;
                    background: #6A1B9A;
                    transition: width 0.5s;
                }
                
                .weekly-sleep-card {
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    text-align: left;
                }
                .weekly-sleep-title {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #6A1B9A;
                    margin-bottom: 20px;
                }
                .chart-placeholder {
                    /* Gaya untuk memastikan SVG berada di tengah dan mengisi */
                    height: 200px;
                    width: 100%;
                }
                .sleep-tracker-link {
                    width: 100%;
                    padding: 15px;
                    border: none;
                    border-radius: 30px;
                    background: #7E57C2; /* Ungu */
                    color: white;
                    font-size: 1rem;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 20px;
                    box-shadow: 0 4px 10px rgba(126, 87, 194, 0.4);
                }
                .screen-time-input-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    font-size: 1rem;
                    color: #4A4A4A;
                    font-weight: 500;
                    background: rgba(255, 255, 255, 0.5);
                    padding: 10px;
                    border-radius: 10px;
                }
                .screen-time-input {
                    width: 60px;
                    padding: 5px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    text-align: center;
                }
                
                /* --- ACTIVITY PAGE STYLES (BARU) --- */

                .activity-page-container {
                    padding: 20px 25px 90px 25px;
                    min-height: 100vh;
                    box-sizing: border-box;
                    background: linear-gradient(180deg, #FFEBEB 0%, #FFD1E0 100%); /* Gradien Merah Jambu Lembut */
                }
                .activity-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .activity-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #C30000;
                    margin: 0 auto;
                }
                .section-title {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: #4A4A4A;
                    margin-bottom: 15px;
                    text-align: left;
                }
                /* Current Activity Card */
                .current-activity-card {
                    background-color: #F47C7C; /* Warna Merah Jambu/Coral */
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column; /* Ubah ke susun atur menegak */
                    align-items: flex-start;
                    color: white;
                    position: relative;
                    min-height: 180px;
                }
                .activity-details {
                    flex-grow: 1;
                    padding-right: 15px;
                }
                .activity-name {
                    font-size: 1.2rem;
                    font-weight: 800;
                    margin-bottom: 5px;
                }
                .activity-distance {
                    font-size: 2.8rem; /* Lebih besar */
                    font-weight: 900;
                    line-height: 1;
                    margin-bottom: 5px;
                }
                .activity-time {
                    font-size: 0.9rem;
                    font-weight: 500;
                    margin-bottom: 15px;
                }
                .checkout-btn {
                    background: #C30000;
                    color: white;
                    border: none;
                    border-radius: 20px;
                    padding: 8px 15px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 0.9rem;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                }
                .activity-icon-large {
                    color: white;
                    opacity: 0.9;
                    position: absolute; /* Ikon terapung di kanan atas */
                    top: 20px;
                    right: 20px;
                }

                /* Daily Stats Card Grid */
                .daily-stats-card-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .daily-stats-card-grid .stat-item {
                    background: #FFD1A6; /* Oren Lembut */
                    border-radius: 15px;
                    padding: 15px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                    text-align: center;
                }
                .stat-icon-foot, .stat-icon-fire {
                    color: #C30000;
                    margin-bottom: 5px;
                }
                .stat-value-sm {
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: #4A4A4A;
                    line-height: 1.2;
                }
                .stat-label-sm {
                    font-size: 0.8rem;
                    color: #777;
                    font-weight: 600;
                }

                /* Schedule List */
                .schedule-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px; /* Kurangkan gap */
                }
                .schedule-card {
                    background: white;
                    border-radius: 15px;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                    border: 1px solid #FFC0CB; /* Garisan luaran lembut */
                    position: relative;
                }
                .schedule-info {
                    text-align: left;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }
                .schedule-name {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #333;
                    display: block;
                    margin-bottom: 5px;
                }
                .cals-per-min-label {
                    font-size: 0.8rem;
                    color: #555;
                    margin-bottom: 10px;
                }
                .start-btn {
                    padding: 5px 15px;
                    border: none;
                    border-radius: 20px;
                    background: #D32F2F;
                    color: white;
                    font-size: 0.85rem;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
                .stop-btn {
                    background: #FF69B4; /* Pink untuk stop */
                }
                .schedule-icon {
                    color: #C30000;
                    opacity: 0.9;
                    position: absolute;
                    right: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                
                /* Log Masa Manual (Baru) */
                .time-log-container {
                    background: #FFF;
                    border-radius: 15px;
                    padding: 20px;
                    margin-top: 30px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                    text-align: left;
                }
                .time-log-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #4A4A4A;
                    margin-bottom: 20px;
                }
                .time-input-group {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                .time-input-group label {
                    font-weight: 500;
                    color: #555;
                }
                .time-input {
                    padding: 8px 10px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    width: 150px;
                    box-sizing: border-box;
                }
                .calculation-result {
                    text-align: center;
                    margin: 15px 0;
                    font-size: 1rem;
                    font-weight: 500;
                    color: #333;
                }
                .calculation-result strong {
                    font-weight: 800;
                    color: #000;
                }
                .log-activity-btn {
                    width: 100%;
                    padding: 12px;
                    border: none;
                    border-radius: 25px;
                    background: #000;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1rem;
                }
                .log-activity-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                
                /* GEMINI ANALYSIS BOX */
                .gemini-analysis-box {
                    margin-top: 30px;
                    padding: 15px;
                    background: #EAF4FF; /* Biru Sangat Lembut */
                    border-radius: 15px;
                    border: 1px solid #C3DFFF;
                    text-align: left;
                }
                .analysis-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #1976D2;
                    margin-bottom: 10px;
                }
                .analysis-text {
                    font-size: 0.9rem;
                    color: #4A4A4A;
                    line-height: 1.4;
                }
                `}
            </style>

            {/* Render the current active page */}
            {renderPage()}

            {/* 4. BOTTOM NAVIGATION BAR (Only visible on main app screens) */}
            {isBottomNavVisible && (
                <nav className="bottom-nav">
                    {/* Activity */}
                    <div className={`nav-icon ${activePage === 'activity' ? 'active' : ''}`} onClick={() => navigate('activity')}>
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