import React, { useEffect, useState, useRef, useMemo } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, serverTimestamp, addDoc, doc, deleteDoc, getDocFromServer, writeBatch, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { Trophy, Users, Timer, Activity, LogOut, Plus, ChevronRight, Medal, Search, TrendingUp, BarChart3, Trash2, ClipboardList, CheckCircle2, FileText, Download, Mail, Lock, UserPlus, Languages, Camera, Settings, Star, Share2, Phone, Sparkles, Brain, Bot, Wand2, MessageSquareText, Send, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { auth, db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { cn } from './lib/utils';
import { Student, PerformanceLog, TestType, Benchmark, CoachProfile, COMMON_SPORTS } from './types';
const BENCHMARKS: Benchmark[] = [
  { testType: 'sprint_100m', level: 'District', threshold: 13.5, label: 'District Level Ready' },
  { testType: 'sprint_100m', level: 'State', threshold: 12.5, label: 'State Level Ready' },
  { testType: 'sprint_100m', level: 'National', threshold: 11.5, label: 'National Level Ready' },
  { testType: 'sprint_200m', level: 'District', threshold: 28.0, label: 'District Level Ready' },
  { testType: 'sprint_200m', level: 'State', threshold: 26.0, label: 'State Level Ready' },
  { testType: 'long_jump', level: 'District', threshold: 4.5, label: 'District Level Ready' },
  { testType: 'long_jump', level: 'State', threshold: 5.5, label: 'State Level Ready' },
  { testType: 'high_jump', level: 'District', threshold: 1.2, label: 'District Level Ready' },
  { testType: 'high_jump', level: 'State', threshold: 1.4, label: 'State Level Ready' },
  { testType: 'shot_put', level: 'District', threshold: 8.0, label: 'District Level Ready' },
  { testType: 'shot_put', level: 'State', threshold: 10.0, label: 'State Level Ready' },
  { testType: 'vertical_jump', level: 'District', threshold: 40, label: 'District Level Ready' },
  { testType: 'vertical_jump', level: 'State', threshold: 55, label: 'State Level Ready' },
];

const TEST_LABELS: Record<TestType, string> = {
  sprint_100m: '100m Sprint',
  sprint_200m: '200m Sprint',
  sprint_400m: '400m Sprint',
  long_jump: 'Long Jump',
  high_jump: 'High Jump',
  shot_put: 'Shot Put',
  vertical_jump: 'Vertical Jump',
  beep_test: 'Beep Test (Laps)'
};
import { exportFullDataPDF, exportStudentPDF } from './lib/pdf-export';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

// --- Connection Test ---
// ... (omitted for brevity in logic check, but keeping in real edit)

// --- Translations ---
const TRANSLATIONS = {
  en: {
    app_name: 'Kreeda-Prerana Scout',
    dashboard: 'Dashboard',
    students: 'Students',
    trial_logger: 'Trial Logger',
    batch_entry: 'Batch Entry',
    analytics: 'Analytics',
    logout: 'Logout',
    add_student: 'Add Student',
    search_placeholder: 'Search athletes...',
    best_results: 'Best Results',
    achievements: 'Achievements',
    district: 'District',
    state: 'State',
    national: 'National',
    coach_profile: 'Coach Profile',
    school_name: 'School / Institution',
    save: 'Save',
    cancel: 'Cancel',
    name: 'Name',
    age: 'Age',
    sport: 'Sport',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    photo: 'Photo',
    home: 'Home',
    analysis: 'Analysis',
    batch: 'Batch',
    total_athletes: 'Total Athletes',
    best_100m: 'Best 100m Dash',
    best_long_jump: 'Best Long Jump',
    recent_trials: 'Recent Trials',
    view_all: 'View All',
    talent_card: 'Talent Card',
    share_whatsapp: 'Share on WhatsApp',
    talent_curve: 'Talent Curve',
    participation: 'Participation',
    gold: 'Gold',
    silver: 'Silver',
    bronze: 'Bronze',
    select_athlete: 'Select Athlete',
    test_category: 'Test Category',
    precision_timer: 'Precision Timer',
    save_record: 'Save Record',
    start: 'Start',
    stop: 'Stop',
    dronacharya_ai: 'Dronacharya AI',
    guru_insights: 'Guru Insights',
    ai_report_prompt: 'Analyzing student data for insights...',
    focus_needed: 'Focus Needed',
    rising_stars: 'Rising Stars',
    ask_guru: 'Consult Guru',
    leaderboard: 'Leaderboard',
    global_rank: 'Global Ranking',
    school_rank: 'School Ranking',
    all_schools: 'All Schools',
    my_school: 'My School',
    age_group: 'Age Group',
    grade: 'Grade Level',
  },
  kn: {
    app_name: 'ಕ್ರೀಡಾ-ಪ್ರೇರಣ',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    students: 'ವಿದ್ಯಾರ್ಥಿಗಳು',
    trial_logger: 'ಲಾಗರ್',
    batch_entry: 'ಬ್ಯಾಚ್ ನಮೂದು',
    analytics: 'ವಿಶ್ಲೇಷಣೆ',
    logout: 'ನಿರ್ಗಮನ',
    add_student: 'ವಿದ್ಯಾರ್ಥಿ ಸೇರಿಸಿ',
    search_placeholder: 'ಕ್ರೀಡಾಪಟುಗಳನ್ನು ಹುಡುಕಿ...',
    best_results: 'ಉತ್ತಮ ಫಲಿತಾಂಶಗಳು',
    achievements: 'ಸಾಧನೆಗಳು',
    district: 'ಜಿಲ್ಲಾ',
    state: 'ರಾಜ್ಯ',
    national: 'ರಾಷ್ಟ್ರೀಯ',
    coach_profile: 'ತರಬೇತುದಾರರ ವಿವರ',
    school_name: 'ಶಾಲೆ / ಸಂಸ್ಥೆ',
    save: 'ಉಳಿಸಿ',
    cancel: 'ರದ್ದುಗೊಳಿಸಿ',
    name: 'ಹೆಸರು',
    age: 'ವಯಸ್ಸು',
    sport: 'ಕ್ರೀಡೆ',
    gender: 'ಲಿಂಗ',
    male: 'ಪುರುಷ',
    female: 'ಮಹಿಳೆ',
    other: 'ಇತರ',
    photo: 'ಭಾವಚಿತ್ರ',
    home: 'ಮನೆ',
    analysis: 'ವಿಶ್ಲೇಷಣೆ',
    batch: 'ಬ್ಯಾಚ್',
    total_athletes: 'ಒಟ್ಟು ಕ್ರೀಡಾಪಟುಗಳು',
    best_100m: 'ಉತ್ತಮ ೧೦೦ ಮೀ ಓಟ',
    best_long_jump: 'ಉತ್ತಮ ಉದ್ದ ಜಿಗಿತ',
    recent_trials: 'ಇತ್ತೀಚಿನ ಪರೀಕ್ಷೆಗಳು',
    view_all: 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ',
    talent_card: 'ಪ್ರತಿಭೆ ಕಾರ್ಡ್',
    share_whatsapp: 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ',
    talent_curve: 'ಪ್ರತಿಭೆ ವಕ್ರರೇಖೆ',
    participation: 'ಭಾಗವಹಿಸುವಿಕೆ',
    gold: 'ಚಿನ್ನ',
    silver: 'ಬೆಳ್ಳಿ',
    bronze: 'ಕಂಚು',
    select_athlete: 'ಕ್ರೀಡಾಪಟುವನ್ನು ಆರಿಸಿ',
    test_category: 'ಪರೀಕ್ಷಾ ವರ್ಗ',
    precision_timer: 'ನಿಖರ ಟೈಮರ್',
    save_record: 'ದಾಖಲೆಯನ್ನು ಉಳಿಸಿ',
    start: 'ಪ್ರಾರಂಭಿಸಿ',
    stop: 'ನಿಲ್ಲಿಸಿ',
    dronacharya_ai: 'ದ್ರೋಣಾಚಾರ್ಯ AI',
    guru_insights: 'ಗುರು ಒಳನೋಟಗಳು',
    ai_report_prompt: 'ಒಳನೋಟಗಳಿಗಾಗಿ ವಿದ್ಯಾರ್ಥಿಗಳ ಮಾಹಿತಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',
    focus_needed: 'ಗಮನ ಹರಿಸಬೇಕಾದವರು',
    rising_stars: 'ಉದಯೋನ್ಮುಖ ನಕ್ಷತ್ರಗಳು',
    ask_guru: 'ಗುರುಗಳ ಸಲಹೆ ಕೇಳಿ',
    leaderboard: 'ನಾಯಕತ್ವದ ಪಟ್ಟಿ',
    global_rank: 'ಜಾಗತಿಕ ಶ್ರೇಯಾಂಕ',
    school_rank: 'ಶಾಲಾ ಶ್ರೇಯಾಂಕ',
    all_schools: 'ಎಲ್ಲಾ ಶಾಲೆಗಳು',
    my_school: 'ನನ್ನ ಶಾಲೆ',
    age_group: 'ವಯೋಮಾನ',
    grade: 'ತರಗತಿ',
  }
};

// --- Helpers ---
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

function BadgeDisplay({ student, logs, lang, t }: { student: Student, logs: PerformanceLog[], lang: 'en' | 'kn', t: (k: any) => string }) {
  const studentLogs = logs.filter(l => l.studentId === student.id);
  const achievements = BENCHMARKS.filter(b => {
    const relevantLogs = studentLogs.filter(l => l.testType === b.testType);
    if (relevantLogs.length === 0) return false;
    
    if (b.testType === 'sprint_100m') {
      return relevantLogs.some(l => l.value <= b.threshold);
    } else {
      return relevantLogs.some(l => l.value >= b.threshold);
    }
  });

  if (achievements.length === 0) return null;

  // Get highest achievement level
  const levels = achievements.map(a => a.level);
  const hasNational = levels.includes('National');
  const hasState = levels.includes('State');
  const hasDistrict = levels.includes('District');

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {hasNational && (
        <div className="bg-amber-100 text-amber-700 border border-amber-200 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-tighter">
          <Star className="w-2 h-2 fill-current" /> {t('gold')}
        </div>
      )}
      {hasState && (
        <div className="bg-slate-100 text-slate-700 border border-slate-200 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-tighter">
          <Star className="w-2 h-2 fill-current" /> {t('silver')}
        </div>
      )}
      {hasDistrict && (
        <div className="bg-orange-100 text-orange-700 border border-orange-200 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-tighter">
          <Star className="w-2 h-2 fill-current" /> {t('bronze')}
        </div>
      )}
    </div>
  );
}
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// --- Components ---

function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-screen" className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Kreeda-Prerana Scout</h1>
          <p className="text-slate-500 text-sm mt-2">Grassroots Sports Talent Tracker</p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Full Name</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Coach Name" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input required value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="coach@school.edu" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input required value={password} onChange={e => setPassword(e.target.value)} type="password" underline-none className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="••••••••" />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            {loading ? <Activity className="w-5 h-5 animate-spin" /> : (isRegister ? <><UserPlus className="w-5 h-5" /> Create Account</> : <><LogOut className="w-5 h-5" /> Sign In</>)}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-bold">Or continue with</span></div>
        </div>

        <button 
          type="button" 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" alt="Google" className="w-5 h-5" />
          Google
        </button>

        <p className="text-center mt-8 text-sm text-slate-500">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => setIsRegister(!isRegister)} className="ml-2 text-blue-600 font-bold hover:underline">
            {isRegister ? 'Sign In' : 'Register Now'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

function TalentCurve({ logs, testType }: { logs: PerformanceLog[], testType: TestType }) {
  const data = logs
    .filter(l => l.testType === testType)
    .sort((a, b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0))
    .map(l => ({
      date: l.timestamp?.toDate ? format(l.timestamp.toDate(), 'MMM d') : 'Just now',
      value: l.value
    }));

  if (data.length < 2) return <div className="h-32 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 italic">Not enough data for curve</div>;

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="date" hide />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#2563eb" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DronacharyaAI({ students, logs, t, lang, onClose }: { students: Student[], logs: PerformanceLog[], t: (k: any) => string, lang: 'en' | 'kn', onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const scrollRef = useRef<HTMLDivElement>(null);

  const studentDataSummary = useMemo(() => students.map(s => ({
    name: s.name,
    sport: s.primarySport,
    age: s.age,
    gender: s.gender,
    performance: logs.filter(l => l.studentId === s.id).map(l => ({ type: l.testType, value: l.value, date: l.timestamp?.toDate().toLocaleDateString() }))
  })), [students, logs]);

  const generateInitialReport = async () => {
    setLoading(true);
    try {
      const prompt = `Initial Assessment: Analyze athlete data: ${JSON.stringify(studentDataSummary)}. 1. Top 3 stars. 2. 3 focus students. 3. Drills. 4. Coach guidance. Language: ${lang}. Persona: Wise Dronacharya. Markdown format.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are Dronacharya AI, a legendary sports mentor. Respond with high technical precision and an encouraging tone. Always speak as a wise Guru/Dronacharya.",
        }
      });

      setMessages([{ role: 'model', text: response.text || '' }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages([{ role: 'model', text: 'Guru is currently meditating. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userQuery }]);
    setLoading(true);

    try {
      const conversationHistory = messages.map(m => `${m.role === 'user' ? 'Coach' : 'Dronacharya'}: ${m.text}`).join('\n');
      const prompt = `Context (Athlete Data): ${JSON.stringify(studentDataSummary)}\n\nConversation so far:\n${conversationHistory}\n\nCoach Query: ${userQuery}\n\nRespond as Dronacharya (Wise Guru) in ${lang === 'en' ? 'English' : 'Kannada'}. Keep it technical yet encouraging. Use Markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are Dronacharya AI. You solve the queries of the coach with wisdom and data-driven insights.",
        }
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || '' }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'I apologize, the connection to the cosmic knowledge is weak. Could you repeat that?' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInitialReport();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="fixed inset-0 bg-midnight/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        className="bg-[#151619] border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_-10px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden flex flex-col h-[85vh] text-white"
      >
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 p-6 md:p-8 border-b border-white/5 flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-pulse" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-amber-500 p-3 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase font-display">{t('dronacharya_ai')}</h2>
              <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] font-mono whitespace-nowrap">{t('guru_insights')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all border border-white/5">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        <div ref={scrollRef} className="p-4 md:p-8 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          {messages.map((msg, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              key={idx} 
              className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}
            >
              <div className={cn(
                "max-w-[90%] p-4 md:p-6 rounded-3xl text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-electric text-white rounded-tr-none" 
                  : "bg-white/5 border border-white/10 text-slate-300 rounded-tl-none prose prose-invert prose-sm max-w-none"
              )}>
                {msg.role === 'model' ? (
                  <div className="whitespace-pre-wrap font-medium font-sans">
                    {msg.text}
                  </div>
                ) : (
                  <p className="font-bold">{msg.text}</p>
                )}
              </div>
              <p className={cn(
                "text-[9px] font-black uppercase mt-2 tracking-widest opacity-30 font-mono",
                msg.role === 'user' ? "text-right" : "text-left"
              )}>
                {msg.role === 'user' ? 'The Coach' : 'The Guru'}
              </p>
            </motion.div>
          ))}
          
          {loading && (
            <div className="flex items-center gap-3 text-amber-500/50 animate-pulse">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] font-mono">Consulting the Knowledge</p>
            </div>
          )}
        </div>

        <div className="p-4 md:p-8 bg-black/40 border-t border-white/5 shrink-0">
          <div className="flex gap-4">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask the Guru about your athletes..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:border-amber-500/50 transition-all placeholder:text-white/20"
            />
            <button 
              disabled={loading || !input.trim()}
              onClick={handleSend}
              className="p-4 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 shadow-[0_10px_20px_rgba(245,158,11,0.2)]"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[9px] text-center mt-4 text-white/20 font-black uppercase tracking-[0.5em] font-mono">Dronacharya AI Talent Intelligence</p>
        </div>
      </motion.div>
    </div>
  );
}

function TalentCard({ student, logs, t, lang, onClose, coachProfile, user }: { student: Student, logs: PerformanceLog[], t: (k: any) => string, lang: 'en' | 'kn', onClose: () => void, coachProfile: CoachProfile | null, user: User }) {
  const studentLogs = logs.filter(l => l.studentId === student.id);
  const bestSprint = studentLogs.filter(l => l.testType === 'sprint_100m').sort((a,b) => a.value - b.value)[0];
  
  const achievements = BENCHMARKS.filter(b => {
    const relevantLogs = studentLogs.filter(l => l.testType === b.testType);
    if (relevantLogs.length === 0) return false;
    if (b.testType === 'sprint_100m') return relevantLogs.some(l => l.value <= b.threshold);
    return relevantLogs.some(l => l.value >= b.threshold);
  });

  const getMedal = (level: string) => {
    if (level === 'National') return { label: t('gold'), color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Star className="w-3 h-3 fill-amber-500" /> };
    if (level === 'State') return { label: t('silver'), color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <Star className="w-3 h-3 fill-slate-400" /> };
    return { label: t('bronze'), color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Star className="w-3 h-3 fill-orange-500" /> };
  };

  const handleShare = () => {
    const text = `🏆 *${student.name}* - Talent Card\nSport: ${student.primarySport}\nAge: ${student.age}\nGender: ${student.gender}\nCheck out this profile on Kreeda-Prerana Scout!`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-midnight/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] w-full max-w-[340px] overflow-hidden relative border border-white/5 max-h-[85vh] flex flex-col"
      >
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="bg-midnight p-5 pb-10 text-white relative">
            <button 
              onClick={onClose} 
              className="absolute top-4 left-4 p-1.5 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-all z-20 border border-white/10 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {lang === 'en' ? 'Back' : 'ಹಿಂದೆ'}
            </button>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-electric/20 rounded-full blur-[60px] -mr-24 -mt-24" />
            
            <div className="flex flex-col items-center text-center relative z-10 pt-4">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt="" className="w-20 h-20 rounded-[1.2rem] object-cover border-4 border-white/10 shadow-2xl mb-3" />
              ) : (
                <div className="w-20 h-20 rounded-[1.2rem] bg-white/5 flex items-center justify-center text-2xl font-black border-4 border-white/5 mb-3 font-display">
                  {student.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-black tracking-tighter font-display mb-1 uppercase leading-none">{student.name}</h2>
                <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] font-mono mb-2">ID: {student.id.toUpperCase()}</p>
                <p className="text-electric text-[8px] font-black uppercase tracking-[0.4em] font-mono leading-none">{student.primarySport} SPECIALIST</p>
                
                <div className="flex justify-center gap-2 mt-3">
                  <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest font-mono">{student.age} {t('age')}</span>
                  {student.grade && <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest font-mono">{student.grade} Grade</span>}
                  <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest font-mono">{t(student.gender?.toLowerCase())}</span>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-5 left-0 w-full px-6 flex justify-center gap-2">
              {achievements.length > 0 ? achievements.slice(0, 3).map((a, i) => {
                const medal = getMedal(a.level);
                return (
                  <div key={i} className={cn("px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest border font-display", medal.color)}>
                    {medal.icon}
                    {medal.label}
                  </div>
                );
              }) : (
                <div className="px-4 py-2 bg-slate-900 border border-white/10 text-slate-400 rounded-xl shadow-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 font-display">
                  <CheckCircle2 className="w-3 h-3" />
                  {t('participation')}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 pt-10 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[9px] font-display">{t('talent_curve')}</h3>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-electric rounded-full animate-pulse" />
                  <p className="text-[9px] font-black text-electric uppercase tracking-widest font-mono">Real-time Analytics</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 h-32">
                <TalentCurve logs={studentLogs} testType="sprint_100m" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 text-white p-4 rounded-[1.5rem] border border-white/5 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                  <Timer className="w-8 h-8" />
                </div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 font-mono">Personal Best</p>
                <p className="text-2xl font-black font-display tracking-tighter">{bestSprint ? `${bestSprint.value}s` : 'N/A'}</p>
              </div>
              <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform text-slate-900">
                  <Activity className="w-8 h-8" />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 font-mono font-display">Data Points</p>
                <p className="text-2xl font-black font-display tracking-tighter text-slate-900">{studentLogs.length}</p>
              </div>
            </div>

            <div className="flex gap-3 pb-2">
              <button 
                onClick={handleShare}
                className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-xl hover:bg-emerald-700 shadow-[0_10px_30px_-5px_rgba(5,150,105,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[9px] font-display"
              >
                <Share2 className="w-4 h-4" />
                {t('share_whatsapp')}
              </button>
              <button 
                onClick={() => exportStudentPDF(student, logs, coachProfile?.schoolName, user.displayName || 'Coach')}
                className="p-4 bg-midnight text-white rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 border border-white/5"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Activity className="w-10 h-10 text-blue-600 animate-pulse" />
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'students' | 'logger' | 'analytics' | 'batch' | 'profile' | 'leaderboard'>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<PerformanceLog[]>([]);
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [lang, setLang] = useState<'en' | 'kn'>('en');
  const [showAI, setShowAI] = useState(false);

  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[lang][key] || key;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Sync Data
  useEffect(() => {
    if (!user) return;

    const qStudents = query(collection(db, 'students'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'students');
    });

    const qLogs = query(collection(db, 'performanceLogs'), where('teacherId', '==', user.uid), orderBy('timestamp', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as PerformanceLog)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'performanceLogs');
    });
    
    const unsubCoach = onSnapshot(doc(db, 'coaches', user.uid), (snap) => {
      if (snap.exists()) {
        setCoachProfile(snap.data() as CoachProfile);
      }
    });

    return () => {
      unsubStudents();
      unsubLogs();
      unsubCoach();
    };
  }, [user]);

  if (loading) return <Loader />;
  if (!user) return <AuthScreen />;

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-20 md:pb-0 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-midnight border-r border-white/10 p-6 sticky top-0 h-screen shrink-0 text-white shadow-[20px_0_60px_-15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3 mb-10 px-2 transition-all hover:scale-105 cursor-pointer">
          <div className="bg-electric p-2 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-white tracking-tighter uppercase text-sm leading-none font-display">Kreeda-Prerana Scout</h1>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 tracking-widest uppercase font-mono">Talent ID System</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <NavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<Activity />} label={t('dashboard')} />
          <NavItem active={view === 'students'} onClick={() => setView('students')} icon={<Users />} label={t('students')} />
          <NavItem active={view === 'logger'} onClick={() => setView('logger')} icon={<Timer />} label={t('trial_logger')} />
          <NavItem active={view === 'batch'} onClick={() => setView('batch')} icon={<ClipboardList />} label={t('batch_entry')} />
          <NavItem active={view === 'analytics'} onClick={() => setView('analytics')} icon={<BarChart3 />} label={t('analytics')} />
          <NavItem active={view === 'leaderboard'} onClick={() => setView('leaderboard')} icon={<Trophy />} label={t('leaderboard')} />
        </nav>

        <div className="mb-4">
          <button 
            onClick={() => setShowAI(true)}
            className="w-full flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white rounded-2xl hover:shadow-[0_10px_30px_rgba(249,115,22,0.3)] transition-all active:scale-[0.98] group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:scale-150 transition-transform">
              <Sparkles className="w-20 h-20" />
            </div>
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Brain className="w-5 h-5" />
            </div>
            <div className="text-left relative z-10">
              <p className="text-[10px] font-black uppercase tracking-tighter opacity-80 leading-none font-display">AI Mentor</p>
              <p className="text-sm font-black whitespace-nowrap font-display">{t('dronacharya_ai')}</p>
            </div>
            <Wand2 className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
          <button 
            onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5 font-display"
          >
            <Languages className="w-3 h-3" />
            {lang === 'en' ? 'ಕನ್ನಡ (KN)' : 'English (EN)'}
          </button>
          
          <button 
            onClick={() => setView('profile')}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl transition-all border font-display uppercase tracking-widest text-[10px] font-black",
              view === 'profile' ? "bg-white text-midnight border-white" : "bg-transparent border-white/10 text-slate-400 hover:text-white"
            )}
          >
            <Settings className="w-3 h-3" />
            <span>{t('coach_profile')}</span>
          </button>

          <div className="flex items-center gap-3 px-3 py-2 mt-4 pt-4 border-t border-white/5">
            {user.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-9 h-9 rounded-full object-cover border border-white/20 shadow-sm" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center font-black text-xs uppercase border border-white/10">
                {user.displayName?.charAt(0) || user.email?.charAt(0)}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-white truncate uppercase tracking-widest font-display">{user.displayName || 'Coach'}</p>
              <p className="text-[9px] text-slate-500 truncate leading-none mt-0.5 font-mono">AUTHORIZED PERSONNEL</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-400 transition-all"
          >
            <LogOut className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="md:hidden bg-midnight border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-50 text-white">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-electric" />
            <span className="font-black text-white tracking-tighter uppercase text-sm font-display">Kreeda-Prerana Scout</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter max-w-[100px] truncate font-display">{coachProfile?.schoolName}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => signOut(auth)}
                className="p-2 text-slate-400 hover:text-red-400 transition-all border border-white/10 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button onClick={() => setView('profile')}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white/20 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-black text-xs uppercase border border-white/10 px-2">
                    {user.displayName?.charAt(0) || user.email?.charAt(0)}
                  </div>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && <Dashboard key="dash" user={user} students={students} logs={logs} setView={setView} setSelectedStudent={setSelectedStudent} lang={lang} t={t} coachProfile={coachProfile} />}
            {view === 'students' && <StudentList key="stud" user={user} students={students} logs={logs} lang={lang} t={t} coachProfile={coachProfile} onSelect={(s) => { setSelectedStudent(s); setView('logger'); }} />}
            {view === 'logger' && <TrialLogger key="log" user={user} students={students} selectedStudent={selectedStudent} t={t} />}
            {view === 'batch' && <BatchEntry key="batch" user={user} students={students} />}
            {view === 'analytics' && <Analytics key="ana" logs={logs} students={students} coachProfile={coachProfile} user={user} />}
            {view === 'leaderboard' && <GlobalLeaderboard key="lead" user={user} currentSchool={coachProfile?.schoolName} lang={lang} t={t} />}
            {view === 'profile' && <ProfileSettings key="prof" user={user} t={t} lang={lang} />}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav id="mobile-nav" className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around p-3 z-50">
        <MobileNavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<Activity />} label={t('home')} />
        <MobileNavItem active={view === 'students'} onClick={() => setView('students')} icon={<Users />} label={t('students')} />
        <MobileNavItem active={view === 'leaderboard'} onClick={() => setView('leaderboard')} icon={<Trophy />} label={t('leaderboard')} />
        <MobileNavItem active={view === 'batch'} onClick={() => setView('batch')} icon={<ClipboardList />} label={t('batch')} />
        <button onClick={() => setLang(lang === 'en' ? 'kn' : 'en')} className="flex flex-col items-center gap-1 text-slate-400">
          <Languages className="w-5 h-5 text-blue-600" />
          <span className="text-[10px] font-bold">ಕನ್ನಡ</span>
        </button>
      </nav>
    </div>
  );
}

// --- Navigation Utils ---

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-display uppercase tracking-widest text-[10px] font-black outline-none group relative overflow-hidden",
        active ? "bg-white text-midnight shadow-[0_10px_30px_rgba(255,255,255,0.1)]" : "text-slate-400 hover:text-white"
      )}
    >
      <div className={cn("transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </div>
      <span>{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-glow" 
          className="absolute inset-0 bg-white opacity-10 pointer-events-none" 
        />
      )}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all outline-none",
        active ? "text-blue-600" : "text-slate-400"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </button>
  );
}

// --- Dashboard View ---

function Dashboard({ students, logs, setView, setSelectedStudent, lang, t, coachProfile }: { user: User, students: Student[], logs: PerformanceLog[], setView: (v: any) => void, setSelectedStudent: (s: any) => void, lang: 'en' | 'kn', t: (k: any) => string, coachProfile: CoachProfile | null, key?: string }) {
  const recentLogs = logs.slice(0, 5);
  const bestSprint = logs.filter(l => l.testType === 'sprint_100m').sort((a,b) => a.value - b.value)[0];
  const bestJump = logs.filter(l => l.testType === 'long_jump').sort((a,b) => b.value - a.value)[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
      <div id="welcome-section" className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-200 pb-10">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] font-display">Intelligence Hub</p>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter font-display leading-[0.85]">{t('dashboard')}</h1>
          <p className="text-slate-500 font-medium tracking-tight text-lg">
            {coachProfile?.schoolName 
              ? `${coachProfile.schoolName} • ${students.length} athletes scouted`
              : `Tracking ${students.length} athletes across your school.`}
          </p>
        </div>
        <button 
          onClick={() => setView('students')}
          className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all active:scale-95 text-sm uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" />
          {t('add_student')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatCard 
          icon={<Users className="w-6 h-6 text-blue-600" />}
          label={t('total_athletes')}
          value={students.length}
          color="bg-blue-50"
        />
        <StatCard 
          icon={<Activity className="w-6 h-6 text-emerald-600" />}
          label={t('best_100m')}
          value={bestSprint ? `${bestSprint.value}s` : 'N/A'}
          color="bg-emerald-50"
        />
        <StatCard 
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          label={t('best_long_jump')}
          value={bestJump ? `${bestJump.value}m` : 'N/A'}
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AchievementAlerts students={students} logs={logs} t={t} lang={lang} />
        
        <div id="recent-trials" className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 text-xl tracking-tight">{t('recent_trials')}</h3>
            <button onClick={() => setView('analytics')} className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1">
              {t('view_all')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {recentLogs.length > 0 ? recentLogs.map(log => {
              const student = students.find(s => s.id === log.studentId);
              return (
                <div id={`log-${log.id}`} key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-100 transition-all cursor-default group">
                  <div className="flex items-center gap-4">
                    {student?.photoUrl ? (
                      <img src={student.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-slate-500 text-xs border border-slate-200 uppercase group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                        {student?.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-900">{student?.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{log.testType.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-blue-600 text-lg leading-tight">{log.value}{log.testType === 'sprint_100m' ? 's' : 'm'}</p>
                    <p className="text-[10px] text-slate-400 capitalize font-medium">{log.timestamp?.toDate ? format(log.timestamp.toDate(), 'MMM d, h:mm a') : 'Just now'}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-20 flex flex-col items-center gap-4">
                <div className="p-4 bg-slate-50 rounded-full text-slate-200">
                  <Activity className="w-8 h-8" />
                </div>
                <p className="text-slate-400 text-sm font-medium italic">No trials recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Student View ---

function StudentList({ user, students, logs, lang, t, onSelect, coachProfile }: { user: User, students: Student[], logs: PerformanceLog[], lang: 'en' | 'kn', t: (key: any) => string, onSelect: (s: Student) => void, coachProfile: CoachProfile | null, key?: string }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [sport, setPrimarySport] = useState('Athletics');
  const [photo, setPhoto] = useState('');
  const [grade, setGrade] = useState('');
  const [search, setSearch] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [selectedForCard, setSelectedForCard] = useState<Student | null>(null);
  const [showAI, setShowAI] = useState(false);

  const startEdit = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setAge(student.age.toString());
    setGrade(student.grade || '');
    setGender(student.gender);
    setPrimarySport(student.primarySport);
    setPhoto(student.photoUrl || '');
    setShowAdd(true);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await resizeImage(file);
      setPhoto(base64);
    }
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !grade) return;
    try {
      if (editingStudent) {
        await setDoc(doc(db, 'students', editingStudent.id), {
          name,
          age: Number(age),
          gender,
          grade,
          primarySport: sport,
          photoUrl: photo,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        setEditingStudent(null);
      } else {
        await addDoc(collection(db, 'students'), {
          name,
          age: Number(age),
          gender,
          grade,
          primarySport: sport,
          teacherId: user.uid,
          createdAt: serverTimestamp(),
          photoUrl: photo
        });
      }
      setName('');
      setAge('');
      setGrade('');
      setGender('Male');
      setPhoto('');
      setShowAdd(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'students');
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'students', id));
      setStudentToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
    }
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('students')}</h2>
          <p className="text-sm text-slate-500">Manage your scouted athletes and their records.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => exportFullDataPDF(students, logs, coachProfile?.schoolName || user.displayName || 'Our School')}
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-xl font-semibold hover:bg-slate-50 border border-slate-200 transition-all active:scale-95 text-sm"
          >
            <Download className="w-4 h-4" />
            {lang === 'en' ? 'PDF' : 'ಪಿಡಿಎಫ್'}
          </button>
          <button 
            onClick={() => {
              setEditingStudent(null);
              setName('');
              setAge('');
              setGrade('');
              setGender('Male');
              setPhoto('');
              setShowAdd(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors active:scale-95"
          >
            <Plus className="w-5 h-5" />
            {t('add_student')}
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder={t('search_placeholder')} 
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="athletes-grid">
        {filtered.map(student => (
          <motion.div 
            layout
            key={student.id} 
            id={`athlete-card-${student.id}`}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col gap-2">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.name} className="w-16 h-16 rounded-[20px] object-cover border border-slate-100 shadow-lg shadow-slate-200" />
                ) : (
                  <div className="w-16 h-16 bg-slate-900 rounded-[20px] shadow-lg shadow-slate-200 flex items-center justify-center font-black text-electric text-2xl uppercase font-display border border-white/10">
                    {student.name.charAt(0)}
                  </div>
                )}
                <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md w-max font-mono">ID: {student.id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(student);
                  }}
                  className="p-2 text-slate-300 hover:text-blue-500 transition-all rounded-xl hover:bg-blue-50 active:scale-95 border border-transparent hover:border-blue-100"
                  title="Edit Profile"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setStudentToDelete(student);
                  }}
                  className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-xl hover:bg-red-50 active:scale-95 border border-transparent hover:border-red-100"
                  title="Delete Profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-black text-slate-900 text-xl leading-tight mb-1 font-display uppercase tracking-tight">{student.name}</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-4 font-mono">{student.age} {t('age')} • Grade {student.grade} • {student.primarySport}</p>
            
            <BadgeDisplay student={student} logs={logs} lang={lang} t={t} />
            
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setSelectedForCard(student)}
                className="p-3 bg-midnight text-white hover:bg-slate-800 rounded-2xl transition-all outline-none shadow-lg shadow-slate-200 border border-white/5"
                title="Talent Card"
              >
                <Star className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onSelect(student)}
                className="flex-1 flex items-center justify-between px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-electric transition-all group/btn outline-none shadow-lg shadow-slate-200 font-display"
              >
                {lang === 'en' ? 'Track Performance' : 'ಪರಿಶೀಲಿಸಿ'}
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {studentToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 to-orange-500" />
              
              <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {lang === 'en' ? 'Delete Athlete Profile?' : 'ಕ್ರೀಡಾಪಟುವನ್ನು ಅಳಿಸಲಿಕ್ಕಿದೆಯೇ?'}
              </h3>
              
              <p className="text-slate-600 mb-8 leading-relaxed">
                {lang === 'en' 
                  ? `Are you sure you want to delete ${studentToDelete.name}? This will remove their profile from the active list. Performance records will be retained in archives.`
                  : `${studentToDelete.name} ಅವರನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ಇದು ಅವರನ್ನು ಸಕ್ರಿಯ ಪಟ್ಟಿಯಿಂದ ತೆಗೆದುಹಾಕುತ್ತದೆ.`}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStudentToDelete(null)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Cancel' : 'ರದ್ದುಮಾಡಿ'}
                </button>
                <button
                  onClick={() => deleteStudent(studentToDelete.id)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95 cursor-pointer"
                >
                  {lang === 'en' ? 'Delete' : 'ಅಳಿಸಿ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedForCard && (
          <TalentCard 
            student={selectedForCard} 
            logs={logs} 
            t={t} 
            lang={lang} 
            coachProfile={coachProfile}
            user={user}
            onClose={() => setSelectedForCard(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAI && (
          <DronacharyaAI 
            students={students} 
            logs={logs} 
            t={t} 
            lang={lang} 
            onClose={() => setShowAI(false)} 
          />
        )}
      </AnimatePresence>

      {/* Floating AI Assistant Button */}
      <button 
        id="dronacharya-fab"
        onClick={() => setShowAI(true)}
        className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[120] w-16 h-16 bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 text-white rounded-2xl shadow-[0_20px_50px_rgba(245,158,11,0.3)] flex items-center justify-center group hover:scale-110 active:scale-95 transition-all outline-none border-2 border-white/30 backdrop-blur-md"
        title="Dronacharya AI"
      >
        <div className="absolute inset-0 bg-white/20 rounded-2xl scale-0 group-hover:scale-100 transition-transform duration-500" />
        <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        
        <div className="absolute bottom-full mb-3 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block w-max">
          <div className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl shadow-2xl border border-white/10">
            {t('ask_guru')}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.form 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onSubmit={addStudent}
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative"
            >
              <button type="button" onClick={() => setShowAdd(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingStudent ? (lang === 'en' ? 'Edit Athlete' : 'ತಿದ್ದುಪಡಿ ಮಾಡಿ') : t('add_student')}</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    {photo ? (
                      <img src={photo} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-dashed border-slate-300">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                    <label className="absolute -bottom-2 -right-2 p-1.5 bg-blue-600 text-white rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition-all">
                      <Plus className="w-3 h-3" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{t('photo')}</p>
                    <p className="text-xs text-slate-400">Optional athlete photo</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">{t('name')}</label>
                  <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="Student Name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">{t('age')}</label>
                  <input required value={age} onChange={e => setAge(e.target.value)} type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="Age" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">{t('grade')}</label>
                  <select required value={grade} onChange={e => setGrade(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all">
                    <option value="">-- Select Grade --</option>
                    {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(g => (
                      <option key={g} value={g}>{g} Grade</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">{t('gender')}</label>
                  <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all">
                    <option value="Male">{t('male')}</option>
                    <option value="Female">{t('female')}</option>
                    <option value="Other">{t('other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">{t('sport')}</label>
                  <select value={sport} onChange={e => setPrimarySport(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all">
                    {COMMON_SPORTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-[0.98] mt-4">
                  {editingStudent ? (lang === 'en' ? 'Update Athlete' : 'ಅಪ್‌ಡೇಟ್ ಮಾಡಿ') : t('add_student')}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Logger View ---

function TrialLogger({ user, students, selectedStudent: initialStudent, t }: { user: User, students: Student[], selectedStudent: Student | null, t: (k: any) => string, key?: string }) {
  const [studentId, setStudentId] = useState(initialStudent?.id || '');
  const [testType, setTestType] = useState<TestType>('sprint_100m');
  const [value, setValue] = useState('');
  
  // Stopwatch Logic
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startStop = () => {
    if (isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      const finalTime = (time / 100).toFixed(2);
      setValue(finalTime);
      setIsActive(false);
    } else {
      setTime(0);
      setIsActive(true);
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 10);
    }
  };

  const saveTrial = async () => {
    if (!studentId || !value) return;
    try {
      await addDoc(collection(db, 'performanceLogs'), {
        studentId,
        testType,
        value: Number(value),
        teacherId: user.uid,
        timestamp: serverTimestamp()
      });
      setValue('');
      setTime(0);
      alert('Performance record saved!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'performanceLogs');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-8">
      <div id="logger-header">
        <h2 className="text-2xl font-bold text-slate-900">{t('trial_logger')}</h2>
        <p className="text-slate-500 text-sm">Capture millisecond-accurate timing and distances.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('select_athlete')}</label>
            <select 
              id="student-select"
              value={studentId} 
              onChange={e => setStudentId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              <option value="">-- {t('select_athlete')} --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.age}y)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('test_category')}</label>
            <select 
              id="test-type-select"
              value={testType} 
              onChange={e => setTestType(e.target.value as TestType)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              {(Object.keys(TEST_LABELS) as TestType[]).map(type => (
                <option key={type} value={type}>{TEST_LABELS[type]}</option>
              ))}
            </select>
          </div>
        </div>

        {testType.startsWith('sprint') ? (
          <div id="chrono-container" className="flex flex-col items-center py-10 bg-slate-900 rounded-3xl text-white shadow-inner">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">{TEST_LABELS[testType]} - {t('precision_timer')}</p>
            <div className="text-6xl md:text-8xl font-mono font-bold tracking-tighter mb-10 tabular-nums">
              {(time / 100).toFixed(2)}<span className="text-blue-500 text-4xl">s</span>
            </div>
            <div className="flex gap-4">
              <button 
                id="timer-toggle-btn"
                onClick={startStop}
                className={cn(
                  "px-12 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg outline-none",
                  isActive ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                )}
              >
                {isActive ? t('stop') : t('start')}
              </button>
              <button onClick={() => { setTime(0); setValue(''); }} className="px-10 py-4 rounded-2xl font-bold bg-white/10 hover:bg-white/20 transition-all border border-white/10 outline-none">
                Reset
              </button>
            </div>
          </div>
        ) : (
          <div id="distance-entry" className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="max-w-[240px] mx-auto">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                {testType === 'beep_test' ? 'Total Laps' : testType === 'vertical_jump' ? 'Height (CM)' : 'Distance (Meters)'}
              </label>
              <input 
                id="distance-input"
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                className="w-full text-center text-5xl font-bold bg-transparent outline-none text-slate-900 placeholder:text-slate-200"
                value={value}
                onChange={e => setValue(e.target.value)}
              />
            </div>
          </div>
        )}

        <button 
          id="save-trial-btn"
          disabled={!studentId || !value}
          onClick={saveTrial}
          className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98] outline-none"
        >
          {t('save_record')}
        </button>
      </div>

      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <Medal className="w-5 h-5" /> Target Benchmarks
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {BENCHMARKS.filter(b => b.testType === testType).map((b, i) => (
            <div key={i} className="flex justify-between text-sm text-blue-700 bg-white/50 p-2 rounded-lg">
              <span className="font-medium">{b.level}:</span>
              <span className="font-bold">{b.threshold}{testType === 'sprint_100m' ? 's' : 'm'}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// --- Batch Entry View ---

function BatchEntry({ user, students }: { user: User, students: Student[], key?: string }) {
  const [testType, setTestType] = useState<TestType>('sprint_100m');
  const [batchData, setBatchData] = useState<{ [studentId: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleValueChange = (sid: string, val: string) => {
    setBatchData(prev => ({ ...prev, [sid]: val }));
  };

  const saveBatch = async () => {
    const validEntries = Object.entries(batchData).filter(([_, v]) => v && !isNaN(Number(v)));
    if (validEntries.length === 0) return;

    setIsSaving(true);
    const batch = writeBatch(db);
    
    validEntries.forEach(([sid, val]) => {
      const logRef = doc(collection(db, 'performanceLogs'));
      batch.set(logRef, {
        studentId: sid,
        testType,
        value: Number(val),
        teacherId: user.uid,
        timestamp: serverTimestamp()
      });
    });

    try {
      await batch.commit();
      setBatchData({});
      alert(`Success! Recorded ${validEntries.length} performance logs.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'performanceLogs/batch');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Batch Entry</h2>
          <p className="text-slate-500">Record trials for your entire class (up to 30 students).</p>
        </div>
        <select 
          value={testType} 
          onChange={e => setTestType(e.target.value as TestType)}
          className="bg-white px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none w-full sm:w-auto"
        >
          {(Object.keys(TEST_LABELS) as TestType[]).map(type => (
            <option key={type} value={type}>{TEST_LABELS[type]}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Athlete Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Result ({testType.startsWith('sprint') ? 'sec' : testType === 'beep_test' ? 'laps' : testType === 'vertical_jump' ? 'cm' : 'm'})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.slice(0, 30).map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {s.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-800">{s.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={batchData[s.id] || ''}
                    onChange={(e) => handleValueChange(s.id, e.target.value)}
                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && (
          <div className="p-12 text-center text-slate-400 italic">Add students first to start batch recording.</div>
        )}
      </div>

      <div className="flex justify-end">
        <button 
          onClick={saveBatch}
          disabled={isSaving || Object.keys(batchData).length === 0}
          className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <Activity className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          Commit Batch Record
        </button>
      </div>
    </motion.div>
  );
}

// --- Analytics View ---

function Analytics({ logs, students, coachProfile, user }: { logs: PerformanceLog[], students: Student[], coachProfile: CoachProfile | null, user: User, key?: string }) {
  const [selectedType, setTestType] = useState<TestType>('sprint_100m');
  
  const relevantLogs = logs
    .filter(l => l.testType === selectedType)
    .sort((a,b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));

  const chartData = relevantLogs.map(l => ({
    name: format(l.timestamp?.toDate?.() || new Date(), 'MMM dd'),
    value: l.value,
    student: students.find(s => s.id === l.studentId)?.name || 'Unknown'
  }));

  const ranking = students.map(s => {
    const studentLogs = logs.filter(l => l.studentId === s.id && l.testType === selectedType);
    const bestValue = selectedType === 'sprint_100m' 
      ? Math.min(...studentLogs.map(l => l.value), Infinity)
      : Math.max(...studentLogs.map(l => l.value), -Infinity);
    return { ...s, bestValue: bestValue === Infinity || bestValue === -Infinity ? null : bestValue };
  }).filter(s => s.bestValue !== null).sort((a,b) => {
    if (selectedType === 'sprint_100m') return a.bestValue! - b.bestValue!;
    return b.bestValue! - a.bestValue!;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Performance Analytics</h2>
          <p className="text-slate-500">Visualizing talent curves and school rankings.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => exportFullDataPDF(students, logs, coachProfile?.schoolName || user.displayName || 'Our School')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all active:scale-95 text-sm"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
          <select 
            value={selectedType} 
            onChange={e => setTestType(e.target.value as TestType)}
            className="bg-white px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none flex-1 sm:flex-initial"
          >
            {(Object.keys(TEST_LABELS) as TestType[]).map(type => (
              <option key={type} value={type}>{TEST_LABELS[type]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div id="chart-container" className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[440px]">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" /> Talent Curve (Improvement Timeline)
          </h3>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis reversed={selectedType === 'sprint_100m'} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(v: any, n: any, props: any) => [`${v}${selectedType === 'sprint_100m' ? 's' : 'm'}`, props.payload.student]}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-xs text-slate-400 italic">Showing historical progress across all trials for the selected category.</p>
        </div>

        <div id="leaderboard" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> School Leaderboard
          </h3>
          <div className="space-y-3">
            {ranking.map((s, i) => (
              <div id={`rank-${i+1}`} key={s.id} className={cn(
                "flex items-center justify-between p-4 rounded-2xl transition-all",
                i === 0 ? "bg-amber-50 border border-amber-100" : "bg-slate-50 border border-transparent"
              )}>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "w-6 text-center font-black",
                    i === 0 ? "text-amber-600" : "text-slate-400"
                  )}>{i + 1}</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{s.primarySport}</p>
                  </div>
                </div>
                <p className="font-black text-slate-900">{s.bestValue}{selectedType === 'sprint_100m' ? 's' : 'm'}</p>
              </div>
            ))}
            {ranking.length === 0 && <div className="text-center py-20 text-slate-300 font-medium italic">No data yet</div>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Generic Stat UI ---

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-start gap-4 hover:shadow-xl hover:shadow-slate-200 transition-all relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform text-slate-900">
        {icon}
      </div>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-inner", color)}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 font-display">{label}</p>
        <p className="text-4xl font-black text-slate-900 tracking-tighter font-display">{value}</p>
      </div>
    </motion.div>
  );
}

// --- Achievement Alerts for Dashboard ---

function AchievementAlerts({ students, logs, t, lang }: { students: Student[], logs: PerformanceLog[], t: (k: any) => string, lang: 'en' | 'kn' }) {
  const allAchievements = students.flatMap(s => {
    const studentLogs = logs.filter(l => l.studentId === s.id);
    return BENCHMARKS.filter(b => {
      const relevantLogs = studentLogs.filter(l => l.testType === b.testType);
      if (b.testType === 'sprint_100m') return relevantLogs.some(l => l.value <= b.threshold);
      return relevantLogs.some(l => l.value >= b.threshold);
    }).map(b => ({ student: s, benchmark: b }));
  }).sort((a,b) => b.benchmark.threshold - a.benchmark.threshold).slice(0, 5);

  if (allAchievements.length === 0) return null;

  return (
    <div className="bg-midnight rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-white/5">
      <div className="absolute top-0 right-0 w-64 h-64 bg-electric/20 rounded-full blur-[90px] -mr-32 -mt-32" />
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-electric rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            <Medal className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tighter uppercase font-display">{t('achievements')}</h3>
            <p className="text-[10px] font-bold text-electric uppercase tracking-[0.3em] font-mono leading-none mt-1">Elite detection active</p>
          </div>
        </div>
      </div>
      <div className="space-y-3 relative z-10">
        {allAchievements.map((ach, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="flex items-center justify-between text-sm bg-white/5 p-4 rounded-2xl backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all cursor-default"
          >
            <div className="flex items-center gap-4">
              {ach.student.photoUrl ? (
                <img src={ach.student.photoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/20" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-midnight border border-white/10 flex items-center justify-center font-black text-electric font-display">{ach.student.name.charAt(0)}</div>
              )}
              <div>
                <p className="font-black uppercase tracking-tight text-white">{ach.student.name}</p>
                <p className="text-slate-500 text-[9px] uppercase tracking-widest font-black font-mono">{ach.benchmark.label}</p>
              </div>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-[9px] font-black tracking-[0.1em] uppercase",
              ach.benchmark.level === 'National' ? "bg-amber-500 text-white" :
              ach.benchmark.level === 'State' ? "bg-electric text-white" : "bg-emerald-500 text-white"
            )}>
              {lang === 'en' ? ach.benchmark.level : (ach.benchmark.level === 'National' ? 'ರಾಷ್ಟ್ರೀಯ' : ach.benchmark.level === 'State' ? 'ರಾಜ್ಯ' : 'ಜಿಲ್ಲಾ')}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- Coach Profile Settings ---

// --- Leaderboard View ---

function GlobalLeaderboard({ user, currentSchool, lang, t }: { user: User, currentSchool?: string, lang: 'en' | 'kn', t: (k: any) => string, key?: string }) {
  const [logs, setLogs] = useState<PerformanceLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [coaches, setCoaches] = useState<{ [id: string]: CoachProfile }>({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<TestType>('sprint_100m');
  const [scope, setScope] = useState<'Global' | 'School'>('Global');
  const [ageGroup, setAgeGroup] = useState<'All' | 'U12' | 'U15' | 'U18'>('All');
  const [primarySport, setPrimarySport] = useState<string>('All');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');

  useEffect(() => {
    setLoading(true);
    // Fetch all logs and students for the leaderboard
    // In a real production app, we would use a more optimized query (e.g., top 100)
    const unsubLogs = onSnapshot(collection(db, 'performanceLogs'), (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as PerformanceLog)));
    });

    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
    });

    const unsubCoaches = onSnapshot(collection(db, 'coaches'), (snap) => {
      const coachMap: { [id: string]: CoachProfile } = {};
      snap.forEach(doc => {
        coachMap[doc.id] = doc.data() as CoachProfile;
      });
      setCoaches(coachMap);
      setLoading(false);
    });

    return () => {
      unsubLogs();
      unsubStudents();
      unsubCoaches();
    };
  }, []);

  const ranking = useMemo(() => {
    let filteredStudents = students;
    
    // Scope Filter
    if (scope === 'School') {
      filteredStudents = students.filter(s => s.teacherId === user.uid);
    }

    // Age Filter
    if (ageGroup !== 'All') {
      const maxAge = parseInt(ageGroup.replace('U', ''));
      const minAge = ageGroup === 'U12' ? 0 : ageGroup === 'U15' ? 12 : 15;
      filteredStudents = filteredStudents.filter(s => s.age <= maxAge && s.age > minAge);
    }

    // Sport Filter implicitly handled by combined dropdown or kept separate if user wants?
    // User asked to merge sport and test type into ONE dropdown.
    // However, metrics are associated with types. We'll filter the students by sport
    // IF the user selects a sport-specific metric or we just filter the list.
    
    return filteredStudents.map(s => {
      const studentLogs = logs.filter(l => l.studentId === s.id && l.testType === filterType);
      const isSprint = filterType.startsWith('sprint');
      const bestValue = isSprint 
        ? Math.min(...studentLogs.map(l => l.value), Infinity)
        : Math.max(...studentLogs.map(l => l.value), -Infinity);
      
      const teacher = coaches[s.teacherId];
      
      return { 
        ...s, 
        bestValue: bestValue === Infinity || bestValue === -Infinity ? null : bestValue,
        schoolName: teacher?.schoolName || 'Grassroots Academy'
      };
    }).filter(s => s.bestValue !== null).sort((a,b) => {
      const isSprint = filterType.startsWith('sprint');
      if (isSprint) return a.bestValue! - b.bestValue!;
      return b.bestValue! - a.bestValue!;
    });
  }, [students, logs, coaches, filterType, scope, ageGroup, selectedGrade, user.uid]);

  const availableGrades = useMemo(() => {
    const grades = new Set(students.map(s => s.grade).filter(Boolean));
    return Array.from(grades).sort();
  }, [students]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-10">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] font-display">Competetive Intelligence</p>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter font-display leading-[0.85]">{t('leaderboard')}</h1>
          <p className="text-slate-500 font-medium tracking-tight text-lg">Ranking the finest grassroots talent in the region.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex">
            <button 
              onClick={() => setScope('Global')}
              className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", scope === 'Global' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
            >
              {t('all_schools')}
            </button>
            <button 
              onClick={() => setScope('School')}
              className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", scope === 'School' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
            >
              {t('my_school')}
            </button>
          </div>
          
          <select 
            value={ageGroup} 
            onChange={e => setAgeGroup(e.target.value as any)}
            className="bg-white px-4 py-2 border border-slate-200 rounded-xl font-bold text-[10px] uppercase tracking-widest outline-none"
          >
            <option value="All">{t('age_group')}: ALL</option>
            <option value="U12">U-12</option>
            <option value="U15">U-15</option>
            <option value="U18">U-18</option>
          </select>

          <select 
            value={selectedGrade} 
            onChange={e => setSelectedGrade(e.target.value)}
            className="bg-white px-4 py-2 border border-slate-200 rounded-xl font-bold text-[10px] uppercase tracking-widest outline-none"
          >
            <option value="All">{t('grade')}: ALL</option>
            {availableGrades.map(g => (
              <option key={g} value={g}>{g.toUpperCase()}</option>
            ))}
          </select>

          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value as TestType)}
            className="bg-white px-4 py-2 border-2 border-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest outline-none text-blue-600 shadow-lg shadow-blue-50"
          >
            {(Object.keys(TEST_LABELS) as TestType[]).map((type) => (
              <option key={type} value={type}>{TEST_LABELS[type].toUpperCase()} - RANKING</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center space-y-4">
          <Activity className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gathering global results...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {ranking.map((res, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              key={res.id} 
              className={cn(
                "group flex items-center justify-between p-6 rounded-[2rem] border transition-all hover:scale-[1.01]",
                i === 0 ? "bg-amber-50 border-amber-200 shadow-xl shadow-amber-100/50" : 
                i === 1 ? "bg-slate-50 border-slate-200" :
                i === 2 ? "bg-orange-50 border-orange-200" : "bg-white border-slate-100 hover:border-blue-200"
              )}
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl font-display transition-transform group-hover:rotate-12",
                  i === 0 ? "bg-amber-500 text-white shadow-lg shadow-amber-200" :
                  i === 1 ? "bg-slate-400 text-white shadow-lg shadow-slate-200" :
                  i === 2 ? "bg-orange-500 text-white shadow-lg shadow-orange-200" : "bg-slate-100 text-slate-400"
                )}>
                  {i + 1}
                </div>
                <div className="flex items-center gap-4">
                  {res.photoUrl ? (
                    <img src={res.photoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-slate-400 border border-slate-200 uppercase font-display">
                      {res.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-black text-slate-900 leading-none mb-1 uppercase tracking-tighter text-lg font-display">{res.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded font-mono">{res.schoolName}</span>
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest font-mono">Age {res.age} • Grade {res.grade}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-3xl font-black font-display tracking-tighter",
                  i === 0 ? "text-amber-600" : "text-slate-900"
                )}>
                  {res.bestValue}
                  <span className="text-xs uppercase ml-1 opacity-50">
                    {filterType.startsWith('sprint') ? 's' : (filterType === 'beep_test' || filterType === 'vertical_jump') ? '' : 'm'}
                  </span>
                </p>
                <div className="flex gap-1 justify-end mt-1">
                  {i === 0 && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                  {i === 1 && <Star className="w-3 h-3 text-slate-400 fill-slate-400" />}
                  {i === 2 && <Star className="w-3 h-3 text-orange-500 fill-orange-500" />}
                </div>
              </div>
            </motion.div>
          ))}
          {ranking.length === 0 && (
            <div className="py-40 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
              <p className="text-slate-300 font-medium italic">No performance records found for this category.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ProfileSettings({ user, t, lang }: { user: User, t: (k: any) => string, lang: 'en' | 'kn', key?: string }) {
  const [name, setName] = useState(user.displayName || '');
  const [photo, setPhoto] = useState(user.photoURL || '');
  const [school, setSchool] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const resetData = async () => {
    setIsSaving(true);
    try {
      // 1. Delete all students for this coach
      const studentSnap = await getDocs(query(collection(db, 'students'), where('teacherId', '==', user.uid)));
      for (const d of studentSnap.docs) {
        try {
          await deleteDoc(doc(db, 'students', d.id));
        } catch (e) {
          console.error(`Failed to delete student ${d.id}:`, e);
        }
      }

      // 2. Delete all performance logs for this coach
      const logSnap = await getDocs(query(collection(db, 'performanceLogs'), where('teacherId', '==', user.uid)));
      for (const d of logSnap.docs) {
        try {
          await deleteDoc(doc(db, 'performanceLogs', d.id));
        } catch (e) {
          console.error(`Failed to delete log ${d.id}:`, e);
        }
      }

      // 3. Delete coach profile
      try {
        await deleteDoc(doc(db, 'coaches', user.uid));
      } catch (e) {
        console.error(`Failed to delete coach profile:`, e);
      }
      
      setShowConfirmReset(false);
      window.location.reload();
    } catch (err) {
      console.error("Reset failed:", err);
      handleFirestoreError(err, OperationType.DELETE, 'batch_reset');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    async function loadCoachProfile() {
      try {
        const coachDoc = await getDoc(doc(db, 'coaches', user.uid));
        if (coachDoc.exists()) {
          const data = coachDoc.data();
          setSchool(data.schoolName || '');
          setBio(data.bio || '');
        }
      } catch (err) {
        console.error("Error loading coach profile:", err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadCoachProfile();
  }, [user.uid]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await resizeImage(file);
      setPhoto(base64);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName: name, photoURL: photo });
      await setDoc(doc(db, 'coaches', user.uid), {
        schoolName: school,
        bio: bio,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert('Profile details synchronized successfully!');
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (initialLoading) return <Loader />;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-10 pb-24 px-4 md:px-0">
      <div className="border-b border-slate-200 pb-8 md:pb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 bg-electric rounded-full animate-pulse" />
          <p className="text-[10px] font-black text-electric uppercase tracking-[0.4em] font-mono">Profile Registry</p>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter font-display uppercase leading-none">{t('coach_profile')}</h2>
        <p className="text-slate-500 mt-4 text-base md:text-lg font-medium max-w-xl leading-relaxed">Modify your coaching credentials and school affiliation for official reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="md:sticky md:top-10 flex flex-col items-center gap-6 md:gap-8 w-full">
            <div className="relative group">
              <div className="absolute inset-0 bg-electric/10 rounded-[3rem] md:rounded-[4rem] blur-2xl group-hover:bg-electric/20 transition-all" />
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-[3rem] md:rounded-[4rem] p-3 bg-midnight shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] border border-white/5 overflow-hidden relative z-10 transition-transform group-hover:scale-[1.02]">
                {photo ? (
                  <img src={photo} alt="Profile" className="w-full h-full rounded-[2.5rem] md:rounded-[3.5rem] object-cover shadow-2xl" />
                ) : (
                  <div className="w-full h-full rounded-[2.5rem] md:rounded-[3.5rem] bg-white text-midnight flex items-center justify-center text-5xl md:text-7xl font-black font-display uppercase tracking-tighter">
                    {name.charAt(0) || user.email?.charAt(0)}
                  </div>
                )}
              </div>
              <label className="absolute bottom-4 right-4 md:bottom-6 md:right-6 p-4 md:p-5 bg-electric text-white rounded-2xl md:rounded-3xl cursor-pointer shadow-2xl hover:bg-blue-600 transition-all hover:scale-110 active:scale-95 border-4 border-midnight z-20">
                <Camera className="w-5 h-5 md:w-7 md:h-7" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-display">Credential Photo</p>
              <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase opacity-50">Authorized personnel only</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-8">
          <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-14 border border-slate-100 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.05)] space-y-8 md:space-y-12">
            <div className="space-y-8 md:space-y-10">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1 font-display leading-none">Full Name</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full px-6 md:px-8 py-5 md:py-6 bg-slate-50 border border-slate-200 rounded-2xl md:rounded-[2rem] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-lg placeholder:text-slate-300"
                  placeholder="E.g. Coach Vishwakarma"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1 font-display leading-none">School or Institution</label>
                <input 
                  value={school} 
                  onChange={e => setSchool(e.target.value)}
                  className="w-full px-6 md:px-8 py-5 md:py-6 bg-slate-50 border border-slate-200 rounded-2xl md:rounded-[2rem] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-lg placeholder:text-slate-300"
                  placeholder="E.g. Kreeda High Performance Center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1 font-display leading-none">Mission Statement</label>
                <textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)}
                  className="w-full px-6 md:px-8 py-5 md:py-6 bg-slate-50 border border-slate-200 rounded-2xl md:rounded-[2rem] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 h-40 md:h-48 resize-none leading-relaxed text-lg placeholder:text-slate-300"
                  placeholder="Describe your vision for your athletes..."
                />
              </div>
              <div className="pt-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1 font-display leading-none">System Identity</label>
                <div className="px-6 md:px-8 py-5 md:py-6 bg-slate-100 border border-slate-200 rounded-2xl md:rounded-[2rem] text-slate-500 font-mono text-xs md:text-sm flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="flex items-center gap-3 truncate">
                    <Lock className="w-4 h-4 opacity-30 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Encrypted</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-6 md:py-8 bg-slate-900 text-white font-black rounded-2xl md:rounded-[2.5rem] hover:bg-slate-800 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-[10px] font-display"
            >
              {isSaving ? <Activity className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              {lang === 'en' ? 'Commit Changes' : 'ದಾಖಲಾತಿಗಳನ್ನು ನವೀಕರಿಸಿ'}
            </button>

            <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center">{lang === 'en' ? 'Danger Zone' : 'ಅಪಾಯಕಾರಿ ವಲಯ'}</p>
              
              {!showConfirmReset ? (
                <button 
                  onClick={() => setShowConfirmReset(true)}
                  className="w-full py-4 bg-white border-2 border-red-100 text-red-500 font-black rounded-2xl hover:bg-red-50 transition-all active:scale-[0.98] uppercase tracking-widest text-[9px] font-display flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {lang === 'en' ? 'Reset Account & Wipe All Data' : 'ಖಾತೆ ಮರುಹೊಂದಿಸಿ ಮತ್ತು ಎಲ್ಲಾ ಡೇಟಾವನ್ನು ಅಳಿಸಿ'}
                </button>
              ) : (
                <div className="space-y-3 p-6 bg-red-50 rounded-2xl border-2 border-red-100">
                  <p className="text-center text-[10px] font-black text-red-600 uppercase tracking-widest">
                    {lang === 'en' ? 'Are you absolutely sure?' : 'ನೀವು ಇತ್ತೀಚೆಗೆ ಖಚಿತವಾಗಿದ್ದೀರಾ?'}
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowConfirmReset(false)}
                      className="flex-1 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 text-[10px] uppercase tracking-widest"
                    >
                      {lang === 'en' ? 'Cancel' : 'ರದ್ದು ಮಾಡಿ'}
                    </button>
                    <button 
                      onClick={resetData}
                      disabled={isSaving}
                      className="flex-1 py-3 bg-red-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-red-200 disabled:opacity-50"
                    >
                      {isSaving ? '...' : (lang === 'en' ? 'YES, DELETE' : 'ಹೌದು, ಅಳಿಸಿ')}
                    </button>
                  </div>
                </div>
              )}

              <p className="text-center text-[9px] text-slate-400 font-medium px-6 leading-relaxed">
                {lang === 'en' 
                  ? 'Warning: This action is irreversible. All student profiles, performance records, and coaching credentials will be permanently erased from the network.' 
                  : 'ಎಚ್ಚರಿಕೆ: ಈ ಕ್ರಿಯೆಯು ಬದಲಾಯಿಸಲಾಗದು. ನಿಮ್ಮ ಖಾತೆಗೆ ಸಂಬಂಧಿಸಿದ ಎಲ್ಲಾ ವಿದ್ಯಾರ್ಥಿ ಪ್ರೊಫೈಲ್‌ಗಳು, ಕಾರ್ಯಕ್ಷಮತೆಯ ದಾಖಲೆಗಳನ್ನು ಫೈರ್‌ಬೇಸ್‌ನಿಂದ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲಾಗುತ್ತದೆ.'}
              </p>
            </div>

            <button 
              onClick={() => signOut(auth)}
              className="w-full py-4 text-red-500 font-black rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[9px] font-display border border-red-100"
            >
              <LogOut className="w-4 h-4" />
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
