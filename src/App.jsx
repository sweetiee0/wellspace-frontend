import React, { useState, useEffect, useMemo } from 'react';
// Mengimport semua ikon dari Lucide React
import { 
    Search, Bell, Plus, Edit2, Zap, Utensils,
    Activity, MoonStar, CheckSquare, Settings, LogIn, UserPlus, Home, Clock, ChevronDown, Droplet, Footprints, X
} from 'lucide-react';

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
            const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

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


// --- PANGKALAN DATA PEMAKANAN (MOCK) ---
const NUTRITION_DATABASE = {
    // KATEGORI KURANG SIHAT (isHealthy: false)
    'nasi lemak': { c: 550, p: 15, f: 30, b: 55, h: false },
    'mee goreng mamak': { c: 600, p: 18, f: 25, b: 65, h: false },
    'char koay teow': { c: 750, p: 20, f: 40, b: 65, h: false },
    'nasi kandar': { c: 900, p: 25, f: 55, b: 80, h: false },
    'hokkien mee (kl)': { c: 700, p: 22, f: 35, b: 60, h: false },
    'mi kari': { c: 550, p: 18, f: 25, b: 50, h: false },
    'wantan mee': { c: 450, p: 14, f: 18, b: 55, h: false },
    'kuetiau goreng kerang': { c: 650, p: 18, f: 30, b: 60, h: false },
    'nasi tomato': { c: 480, p: 16, f: 15, b: 70, h: false },
    'claypot chicken rice': { c: 600, p: 25, f: 28, b: 65, h: false },
    'bak kut teh': { c: 500, p: 30, f: 35, b: 15, h: false },
    'roti canai biasa': { c: 350, p: 8, f: 18, b: 40, h: false },
    'roti telur': { c: 450, p: 15, f: 22, b: 45, h: false },
    'murtabak ayam': { c: 550, p: 25, f: 30, b: 50, h: false },
    'pisang goreng': { c: 320, p: 3, f: 18, b: 35, h: false },
    'keropok lekor': { c: 280, p: 10, f: 15, b: 25, h: false },
    'cendol biasa': { c: 350, p: 2, f: 15, b: 50, h: false },
    'ais kacang (abc)': { c: 400, p: 5, f: 12, b: 70, h: false },
    'ayam goreng kfc/mcd': { c: 450, p: 28, f: 30, b: 20, h: false },
    'burger ramly': { c: 580, p: 22, f: 35, b: 45, h: false },
    'spaghetti carbonara': { c: 700, p: 28, f: 40, b: 50, h: false },
    // Minuman manis/tinggi gula
    'teh tarik ais': { c: 200, p: 2, f: 5, b: 35, h: false },
    'milo ais': { c: 250, p: 5, f: 8, b: 40, h: false },
    'sirap bandung ais': { c: 220, p: 0, f: 0, b: 55, h: false },
    'air sarsi ais': { c: 150, p: 0, f: 0, b: 40, h: false },
    'kopi susu ais gao': { c: 280, p: 5, f: 10, b: 45, h: false },
    
    // KATEGORI SIHAT/SEDERHANA (isHealthy: true)
    'nasi goreng kampung': { c: 400, p: 15, f: 12, b: 50, h: true },
    'nasi ayam hainan': { c: 450, p: 30, f: 10, b: 55, h: true },
    'laksa penang': { c: 380, p: 25, f: 5, b: 50, h: true },
    'laksa johor': { c: 420, p: 28, f: 10, b: 50, h: true },
    'laksam': { c: 350, p: 15, f: 10, b: 50, h: true },
    'nasi kerabu': { c: 450, p: 20, f: 15, b: 55, h: true },
    'bihun goreng': { c: 380, p: 12, f: 10, b: 50, h: true },
    'sup tulang/ekor': { c: 350, p: 35, f: 15, b: 15, h: true },
    'yong tau foo': { c: 300, p: 25, f: 10, b: 20, h: true },
    'ayam masak merah': { c: 400, p: 30, f: 18, b: 25, h: true },
    'rendang ayam': { c: 480, p: 35, f: 25, b: 20, h: true },
    'ikan bakar': { c: 300, p: 40, f: 10, b: 5, h: true },
    'asam pedas ikan': { c: 320, p: 35, f: 8, b: 15, h: true },
    'kari kepala ikan': { c: 400, p: 30, f: 20, b: 15, h: true },
    'telur dadar': { c: 150, p: 12, f: 10, b: 1, h: true },
    'sayur campur': { c: 100, p: 5, f: 5, b: 10, h: true },
    'udang goreng kunyit': { c: 250, p: 28, f: 12, b: 5, h: true },
    'rojak buah': { c: 250, p: 5, f: 5, b: 40, h: true },
    'sup ayam': { c: 180, p: 25, f: 5, b: 10, h: true },
    'air kosong ais': { c: 0, p: 0, f: 0, b: 0, h: true },
    'jus karot susu ais': { c: 180, p: 3, f: 5, b: 25, h: true },
};


const calculateNutrition = (foodInput) => {
    const inputLower = foodInput.toLowerCase().trim();
    const totalDailyCalories = 2000;
    
    // Semak pangkalan data untuk sebarang padanan yang mengandungi input pengguna
    for (const foodKey in NUTRITION_DATABASE) {
        if (inputLower.includes(foodKey)) {
            const data = NUTRITION_DATABASE[foodKey];
            const rdcPercentage = Math.round((data.c / totalDailyCalories) * 100);

            return {
                isHealthy: data.h,
                meal: foodKey.toUpperCase(),
                calories: data.c.toFixed(0),
                proteins: data.p.toFixed(1),
                fats: data.f.toFixed(1),
                carbs: data.b.toFixed(1),
                rdc: rdcPercentage.toFixed(0),
            };
        }
    }
    
    // Fallback jika makanan tidak ditemui (menggunakan logik generik sedia ada)
    return {
        isHealthy: true,
        meal: foodInput,
        calories: '300',
        proteins: '20.0',
        fats: '10.0',
        carbs: '30.0',
        rdc: '15',
    };
};

// ====================================================================
// --- NUTRITION LOGGING MODAL ---
// ====================================================================

const NutritionModal = ({ onClose, onLogMeal, mealTime }) => {
// ... (Kekalkan NutritionModal sedia ada, pastikan ia menggunakan Bahasa Inggeris)
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

// --- Placeholder Components ASAS (Wajib ada) ---
const WelcomePage = ({ navigate }) => (
// ... (Kekalkan WelcomePage sedia ada) ...
    <div className="p-8 text-center bg-gray-50 min-h-screen">
        <h2 className="text-3xl font-bold text-indigo-700 mt-20">Welcome to HealthApp!</h2>
        <p className="mt-4 text-gray-600">This is the landing page. Navigate using the simulated links below.</p>
        <div className="mt-10 space-y-4">
            <button onClick={() => navigate('login')} className="btn-placeholder bg-purple-500">Login</button>
            <button onClick={() => navigate('dashboard')} className="btn-placeholder bg-red-500">Go to Dashboard</button>
        </div>
    </div>
);

const Login = ({ navigate }) => (
// ... (Kekalkan Login sedia ada) ...
    <div className="p-8 text-center bg-white min-h-screen">
        <h2 className="text-2xl font-bold mt-20">Login Screen</h2>
        <p className="mt-4 text-gray-600">Simulated login. Would navigate to Dashboard on success.</p>
        <button onClick={() => navigate('welcome')} className="btn-placeholder mt-8 bg-gray-400">Back to Welcome</button>
    </div>
);

const ActivityPage = () => (
// ... (Kekalkan ActivityPage sedia ada) ...
    <div className="p-8 text-center bg-yellow-50 min-h-screen">
        <h2 className="text-2xl font-bold mt-20">Activity Goal Tracking</h2>
        <p className="mt-4 text-gray-600">Log your runs, steps, and exercises here.</p>
    </div>
);

const ProfilePage = () => (
// ... (Kekalkan ProfilePage sedia ada) ...
    <div className="p-8 text-center bg-green-50 min-h-screen">
        <h2 className="text-2xl font-bold mt-20">User Profile / Settings</h2>
        <p className="mt-4 text-gray-600">Manage account information and preferences.</p>
    </div>
);


// --- KOMPONEN BARU: RemindersPage ---
const RemindersPage = ({ navigate }) => {
// ... (Kekalkan RemindersPage sedia ada) ...
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
                                <span className="slider round" style={{ backgroundColor: reminders[item.key] ? item.color : '#ccc' }}></span>
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
// ... (Kekalkan SleepTrackerPage sedia ada) ...
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
                            <div className="progress-bar" style={{ width: sleepQuality }}></div>
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

    const handleSave = async () => {
        if (!entry.trim()) {
            setSaveMessage("Sila tulis sesuatu sebelum menyimpan.");
            return;
        }

        setIsSaving(true);
        setSaveMessage('');

        // Tentukan ID aplikasi secara dalaman untuk keselamatan
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

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
                });

                setSaveMessage(`Berjaya disimpan! ${quote}`);
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
            setSaveMessage(`Mock Save Berjaya! Mood: ${mood}. ${quote}`);
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
                    disabled={isSaving}
                />

                {/* Butang Simpan */}
                <button 
                    onClick={handleSave} 
                    className="diary-save-btn" 
                    disabled={isSaving || !entry.trim()}
                >
                    {isSaving ? 'Saving...' : 'Save'}
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
            case 'dashboard':
            case 'menu': 
                return <DashboardContent metrics={metrics} featureCards={featureCards} logoSvg={logoSvg} navigate={navigate} />;
            case 'activity':
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
                return <ProfilePage />;
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
                
                /* --- DASHBOARD HOME SCREEN STYLES --- */
                .dashboard-container {
                    padding: 20px 25px 90px 25px;
                    min-height: 100vh;
                    box-sizing: border-box;
                    background: linear-gradient(180deg, #FFFDE7 0%, #FFE0F0 40%, #E0E0FF 100%);
                }
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
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
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