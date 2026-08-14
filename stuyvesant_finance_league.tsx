import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, ShieldAlert, Plus, Edit2, Trash2, Calendar, 
  Megaphone, ArrowRight, Lock, User, X,
  Briefcase, Target, Layers, Map, Flag, Trophy, AlertTriangle, HelpCircle,
  LayoutDashboard, Swords, BookOpen, Settings, Bell, Search,
  ArrowUpRight, DollarSign, Link as LinkIcon, ChevronRight, Activity, Terminal, Sun, Moon, Award
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, addDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'stuy-finance-league-v10';

// --- FIREBASE PATHS (MANDATORY RULE 1) ---
const getSettingsRef = () => doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global_config');
const getAnnouncementsRef = () => collection(db, 'artifacts', appId, 'public', 'data', 'announcements');
const getCompsRef = () => collection(db, 'artifacts', appId, 'public', 'data', 'competitions');
const getChallengesRef = () => collection(db, 'artifacts', appId, 'public', 'data', 'challenges');
const getLeaderboardRef = () => collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard');

// --- DEFAULT SETTINGS ---
const DEFAULT_SETTINGS = {
  heroTitle: "Stuyvesant Finance League",
  heroSubtitle: "NYC's Premier High School Financial Competition Network",
  totalPrizePool: "$3,500",
  registrationLink: "https://forms.google.com/"
};

// --- SECURITY ---
const verifyAdmin = (pass) => {
  const target = [65, 115, 116, 101, 114, 105, 120, 38, 79, 98, 101, 108, 105, 120, 48, 55];
  if (pass.length !== target.length) return false;
  return pass.split('').every((char, i) => char.charCodeAt(0) === target[i]);
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
  
  // Real-time Database States
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [announcements, setAnnouncements] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  // Auth / Entrance State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // 1. One-time Auth Setup 
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { 
        console.error("Auth Error:", error); 
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Database Listeners
  useEffect(() => {
    if (!user) return;

    const unsubSettings = onSnapshot(getSettingsRef(), (docSnap) => {
      if (docSnap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...docSnap.data() });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    }, (err) => console.error("Settings Sync Error:", err));

    const unsubAnnouncements = onSnapshot(getAnnouncementsRef(), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setAnnouncements(items);
    });

    const unsubComps = onSnapshot(getCompsRef(), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0)); 
      setCompetitions(items);
    });

    const unsubChallenges = onSnapshot(getChallengesRef(), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setChallenges(items);
    });

    const unsubLeaderboard = onSnapshot(getLeaderboardRef(), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => (b.score || 0) - (a.score || 0));
      setLeaderboard(items);
    });

    return () => { 
      unsubSettings(); unsubAnnouncements(); unsubComps(); unsubChallenges(); unsubLeaderboard();
    };
  }, [user]);

  const handleRegistration = async (e) => {
    e.preventDefault();
    if (!username.trim() || !user) return;
    setAuthLoading(true);
    
    const adminPassed = verifyAdmin(password);
    if (adminPassed) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    try {
      await updateProfile(user, { displayName: username });
      setUser({ ...user, displayName: username });
      
      // Also add/update user in leaderboard collection
      await addDoc(getLeaderboardRef(), {
        name: username,
        score: Math.floor(Math.random() * 500) + 100, // starting rating
        role: adminPassed ? 'Administrator' : 'Analyst',
        timestamp: serverTimestamp()
      });

      setShowAuthModal(false);
      setPassword(''); 
    } catch (err) { 
      console.error("Profile update error:", err); 
    }
    setAuthLoading(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#09090b] text-white' : 'bg-[#fcfbf9] text-zinc-900'} flex items-center justify-center transition-colors duration-300`}>
        <div className="flex flex-col items-center gap-6">
          <div className="w-8 h-8 border-2 border-amber-500/50 border-t-amber-500 rounded-full animate-spin"></div>
          <span className="font-mono text-xs tracking-widest uppercase opacity-60">Initializing Platform</span>
        </div>
      </div>
    );
  }

  const hasJoined = user && user.displayName;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-[#fcfbf9] text-zinc-900'} font-sans relative overflow-hidden flex flex-col transition-colors duration-300`}>
      {/* Subtle Background Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-5" style={{ backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)", backgroundSize: "48px 48px" }}></div>

      {!hasJoined ? (
        <LandingEntrance setShowAuthModal={setShowAuthModal} theme={theme} toggleTheme={toggleTheme} />
      ) : (
        <PlatformDashboard 
          user={user} settings={settings} isAdmin={isAdmin} setIsAdmin={setIsAdmin}
          announcements={announcements} competitions={competitions} challenges={challenges}
          leaderboard={leaderboard} theme={theme} toggleTheme={toggleTheme}
        />
      )}

      {/* Structured Login Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/80' : 'bg-zinc-900/50'} backdrop-blur-sm`} onClick={() => setShowAuthModal(false)} />
          <div className={`${theme === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'} border rounded-xl p-8 w-full max-w-md relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200`}>
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-5 h-5" />
            </button>
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                Secure Terminal
              </h2>
              <p className="text-sm opacity-60">
                Enter your competitor handle and passkey to connect.
              </p>
            </div>
            <form onSubmit={handleRegistration} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider mb-1.5 opacity-70">Competitor Handle</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                  <input 
                    type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Quant_Stuy" 
                    className={`w-full ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-amber-600'} border rounded-lg py-3 pl-10 pr-4 text-sm focus:outline-none transition-all`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider mb-1.5 opacity-70">Passkey (Admin or Standard)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                  <input 
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className={`w-full ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-amber-600'} border rounded-lg py-3 pl-10 pr-4 text-sm focus:outline-none transition-all`}
                  />
                </div>
              </div>
              <button type="submit" className={`w-full ${theme === 'dark' ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'} font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm mt-6 shadow-lg border border-amber-500/30`}>
                Authorize Connection <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- LANDING ENTRANCE COMPONENT ---
function LandingEntrance({ setShowAuthModal, theme, toggleTheme }) {
  const proposalPoints = [
    { icon: <Swords/>, title: "1. The Challenge", text: "High-stakes tournaments covering stock pitching, algorithmic trading, and portfolio management with real cash prizes." },
    { icon: <Target/>, title: "2. The Vision", text: "A 3-year build starting as a pilot at Stuyvesant and scaling into a self-sustaining multi-school NYC network." },
    { icon: <Layers/>, title: "3. The Process", text: "Four core pillars: Compete in tournaments, Fundraise for prize pools, Replicate via playbooks, and Sustain." },
    { icon: <Map/>, title: "4. The Blueprint", text: "Y1: Prove the model. Y2: Expand to new chapters. Y3: Lock in the student board legacy for continuity." },
    { icon: <Flag/>, title: "5. Key Metrics", text: "Tracking active schools, total sponsored prize pools, and corporate partnerships secured." },
    { icon: <Trophy/>, title: "6. End State", text: "A fully operational league that runs independently without founder intervention, funded by steady sponsors." },
    { icon: <AlertTriangle/>, title: "7. Friction Points", text: "Maintaining continuity post-graduation, securing consistent funding, and handling school compliance." },
    { icon: <HelpCircle/>, title: "8. Requirements", text: "A dedicated faculty sponsor, initial startup capital, and warm introductions to Stuyvesant alumni in finance." }
  ];

  return (
    <div className="flex-1 overflow-y-auto z-10 custom-scrollbar scroll-smooth">
      {/* Top Banner Ticker */}
      <div className={`w-full ${theme === 'dark' ? 'bg-[#121215] border-zinc-800 text-amber-400/90' : 'bg-zinc-100 border-zinc-200 text-amber-700'} border-b text-xs font-mono py-2 px-4 flex justify-between items-center tracking-widest uppercase`}>
        <span>Stuyvesant Finance League // 2026 Season // Network Registration Open</span>
        <button onClick={toggleTheme} className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      <header className={`sticky top-0 w-full p-4 sm:px-8 flex justify-between items-center z-50 ${theme === 'dark' ? 'bg-[#09090b]/90 border-zinc-800' : 'bg-white/90 border-zinc-200'} backdrop-blur-md border-b`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="font-extrabold tracking-tight text-lg">SFL Network</span>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-6 text-sm font-medium opacity-70">
            <a href="#platform" className="hover:opacity-100 transition-opacity">Overview</a>
            <a href="#metrics" className="hover:opacity-100 transition-opacity">Metrics</a>
            <a href="#manifesto" className="hover:opacity-100 transition-opacity">Architecture</a>
          </nav>
          <div className={`h-4 w-px ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'} hidden md:block`}></div>
          <button onClick={() => setShowAuthModal(true)} className={`text-xs font-bold px-5 py-2.5 rounded-lg ${theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'} transition-all shadow-md border border-amber-500/30`}>
            Client Login
          </button>
        </div>
      </header>

      {/* Hero Section with Massive Typography */}
      <section id="platform" className="relative pt-32 pb-20 px-4 max-w-6xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-mono uppercase tracking-widest mb-8">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          Institutional Grade High School Finance
        </div>
        <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-8 leading-[1.05]">
          Financial competition,<br/>re-engineered.
        </h1>
        <p className="max-w-3xl text-xl opacity-70 font-medium leading-relaxed mb-12">
          NYC's premier competitive infrastructure for top-tier students to deploy quantitative analysis, stock pitching, and macroeconomics in high-stakes environments.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-20">
          <button onClick={() => setShowAuthModal(true)} className={`px-8 py-4 rounded-xl font-bold text-base ${theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'} transition-all shadow-xl border border-amber-500/40`}>
            Access Terminal
          </button>
          <a href="#manifesto" className={`px-8 py-4 rounded-xl font-bold text-base ${theme === 'dark' ? 'bg-[#121215] border-zinc-800 hover:border-zinc-700' : 'bg-zinc-100 border-zinc-200 hover:border-zinc-300'} border transition-all`}>
            Read The Proposal
          </a>
        </div>

        {/* Dense FinTech Mockup Terminal */}
        <div className={`w-full max-w-5xl border ${theme === 'dark' ? 'border-zinc-800 bg-[#121215]' : 'border-zinc-300 bg-white'} rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left mb-24 relative`}>
          <div className={`h-12 border-b ${theme === 'dark' ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-zinc-100'} flex items-center justify-between px-6`}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="ml-4 text-xs font-mono opacity-55">sfl-core-v2.6 // secure-channel</span>
            </div>
            <span className="text-xs font-mono text-amber-500 font-bold">STATUS: ONLINE</span>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="flex justify-between items-center border-b pb-4 opacity-70 text-xs font-mono">
                <span>ACTIVE SYNDICATE MODULES</span>
                <span>YIELD / RATING</span>
              </div>
              <div className="space-y-3">
                <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-zinc-50'} flex justify-between items-center`}>
                  <div>
                    <h4 className="font-bold text-sm">Algorithmic Trading League</h4>
                    <p className="text-xs opacity-60">High frequency quantitative models</p>
                  </div>
                  <span className="font-mono text-emerald-500 text-sm font-bold">+$1,500 Prize</span>
                </div>
                <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-zinc-50'} flex justify-between items-center`}>
                  <div>
                    <h4 className="font-bold text-sm">Q3 Global Stock Pitch</h4>
                    <p className="text-xs opacity-60">Fundamental equity analysis</p>
                  </div>
                  <span className="font-mono text-amber-500 text-sm font-bold">+$1,000 Prize</span>
                </div>
              </div>
            </div>
            <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-zinc-50'} flex flex-col justify-between`}>
              <div>
                <p className="text-xs font-mono uppercase tracking-widest opacity-60 mb-2">Network Liquidity</p>
                <h3 className="text-3xl font-black text-amber-500">$3,500</h3>
                <p className="text-xs opacity-60 mt-1">Backed by institutional partners and alumni syndicates.</p>
              </div>
              <button onClick={() => setShowAuthModal(true)} className={`w-full py-2.5 rounded-lg text-xs font-bold ${theme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'} border border-amber-500/30 mt-6`}>
                View Live Book
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section id="metrics" className={`py-24 ${theme === 'dark' ? 'bg-[#121215] border-y border-zinc-800' : 'bg-zinc-100 border-y border-zinc-200'}`}>
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="border-l-2 border-amber-500 pl-6">
            <h3 className="text-6xl font-black mb-2">$5K+</h3>
            <p className="text-sm opacity-70 font-medium">In targeted prize pools secured for competitive tournaments.</p>
          </div>
          <div className="border-l-2 border-amber-500 pl-6">
            <h3 className="text-6xl font-black mb-2">4</h3>
            <p className="text-sm opacity-70 font-medium">Core competition formats: Algos, Pitches, Portfolios, and Research.</p>
          </div>
          <div className="border-l-2 border-amber-500 pl-6">
            <h3 className="text-6xl font-black mb-2">12+</h3>
            <p className="text-sm opacity-70 font-medium">Active bounties and rolling challenges updated weekly.</p>
          </div>
        </div>
      </section>

      {/* The Architecture / Manifesto */}
      <section id="manifesto" className="relative px-4 max-w-7xl mx-auto pb-40 pt-32">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-black tracking-tight mb-4">Organization Architecture</h2>
          <p className="text-lg opacity-70 max-w-2xl mx-auto font-medium">The comprehensive structural breakdown of our transition from a single high school pilot to a self-sustaining regional financial network.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {proposalPoints.map((point, idx) => (
            <div key={idx} className={`p-8 rounded-2xl border ${theme === 'dark' ? 'bg-[#121215] border-zinc-800 hover:border-amber-500/50' : 'bg-white border-zinc-200 hover:border-amber-600/50'} transition-all duration-300 group`}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-6">
                {React.cloneElement(point.icon, { className: 'w-5 h-5' })}
              </div>
              <h3 className="font-bold mb-3 text-lg">{point.title}</h3>
              <p className="text-sm opacity-70 leading-relaxed font-medium">{point.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${theme === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-zinc-100 border-zinc-200'} py-12 text-center`}>
        <p className="text-xs font-mono opacity-50 uppercase tracking-widest">
          Stuyvesant Finance League © 2026 // Institutional Grade Terminal
        </p>
      </footer>
    </div>
  );
}

// --- PLATFORM DASHBOARD COMPONENT ---
function PlatformDashboard({ user, settings, isAdmin, setIsAdmin, announcements, competitions, challenges, leaderboard, theme, toggleTheme }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  return (
    <div className={`flex-1 flex flex-col h-screen overflow-hidden z-10 ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-[#fcfbf9]'}`}>
      
      {/* Top Headline Navigation */}
      <header className={`border-b ${theme === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'} shrink-0 z-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo Area */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight block">SFL Terminal</span>
                <span className="text-[10px] font-mono opacity-60 uppercase">Connected: {user.displayName}</span>
              </div>
              {isAdmin && (
                <span className="bg-amber-500 text-zinc-950 px-2 py-0.5 rounded text-[10px] font-mono font-black tracking-widest ml-3 border border-amber-400">
                  ROOT ADMIN
                </span>
              )}
            </div>

            {/* Top Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-2">
              <TopNavItem icon={<LayoutDashboard/>} label="Overview" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} theme={theme} />
              <TopNavItem icon={<Swords/>} label="Tournaments" active={activeTab === 'competitions'} onClick={() => setActiveTab('competitions')} badge={competitions.length} theme={theme} />
              <TopNavItem icon={<Target/>} label="Bounties" active={activeTab === 'challenges'} onClick={() => setActiveTab('challenges')} badge={challenges.length} theme={theme} />
              <TopNavItem icon={<Award/>} label="Leaderboard" active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} badge={leaderboard.length} theme={theme} />
            </nav>

            {/* Theme Toggle & User Info */}
            <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-amber-400' : 'bg-zinc-100 border-zinc-300 text-amber-600'} hover:scale-105 transition-all shadow-md`}>
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <div className={`flex items-center gap-3 pl-4 border-l ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-500 shadow-inner">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 relative">
        
        {/* Toast Notification */}
        {toast && (
          <div className={`absolute top-4 right-6 ${theme === 'dark' ? 'bg-[#121215] border-amber-500/50 text-white' : 'bg-white border-amber-600/50 text-zinc-900'} border px-6 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3 animate-in slide-in-from-top-4 z-50`}>
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)]" /> {toast}
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView 
              settings={settings} isAdmin={isAdmin} showToast={showToast}
              announcements={announcements} setIsAdmin={setIsAdmin} theme={theme}
            />
          )}

          {activeTab === 'competitions' && (
            <CompetitionsView 
              competitions={competitions} settings={settings} isAdmin={isAdmin} showToast={showToast} theme={theme}
            />
          )}

          {activeTab === 'challenges' && (
            <ChallengesView 
              challenges={challenges} isAdmin={isAdmin} showToast={showToast} theme={theme}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardView leaderboard={leaderboard} theme={theme} />
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245, 158, 11, 0.5); }
      `}} />
    </div>
  );
}

// --- TOP NAV HELPER ---
function TopNavItem({ icon, label, active, onClick, badge, theme }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
        active 
          ? `${theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-white'} border border-amber-500/40 shadow-lg` 
          : `${theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'} border border-transparent`
      }`}
    >
      {React.cloneElement(icon, { className: 'w-4 h-4 text-amber-500' })}
      {label}
      {badge > 0 && <span className="bg-amber-500 text-zinc-950 text-[10px] px-2 py-0.5 rounded-full ml-1 font-mono font-black">{badge}</span>}
    </button>
  );
}

// --- DASHBOARD OVERVIEW MODULE ---
function DashboardView({ settings, isAdmin, showToast, announcements, setIsAdmin, theme }) {
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [announceData, setAnnounceData] = useState({ title: '', body: '' });

  const saveSetting = async () => {
    try { await setDoc(getSettingsRef(), { [editField]: editValue }, { merge: true }); setEditField(null); showToast("Global config updated."); } catch (err) {}
  };
  const handleAnnounce = async (e) => {
    e.preventDefault();
    try { await addDoc(getAnnouncementsRef(), { ...announceData, timestamp: serverTimestamp() }); setAnnounceData({title:'', body:''}); setShowAnnounceForm(false); showToast("Broadcast deployed."); } catch (err) {}
  };
  const deleteItem = async (refFunc, id) => {
    try { await deleteDoc(doc(refFunc(), id)); showToast("Record deleted."); } catch (err) {}
  };

  const EditableText = ({ field, value, className, multiline }) => {
    if (!isAdmin) return <div className={className}>{value}</div>;
    if (editField === field) {
      return (
        <div className="flex gap-2 items-start my-2 w-full relative z-20">
          {multiline ? (
             <textarea className={`flex-1 ${theme === 'dark' ? 'bg-[#09090b] text-white border-amber-500/50' : 'bg-zinc-50 text-zinc-950 border-amber-600/50'} border rounded-xl p-3 text-base focus:outline-none shadow-lg`} value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={3} autoFocus />
          ) : (
             <input type="text" className={`flex-1 ${theme === 'dark' ? 'bg-[#09090b] text-white border-amber-500/50' : 'bg-zinc-50 text-zinc-950 border-amber-600/50'} border rounded-xl p-3 text-base focus:outline-none shadow-lg`} value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus />
          )}
          <button onClick={saveSetting} className="bg-amber-500 text-zinc-950 px-5 py-3 rounded-xl font-bold text-sm hover:bg-amber-400">Save</button>
        </div>
      );
    }
    return (
      <div className={`group relative cursor-pointer ${theme === 'dark' ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-100'} rounded-xl transition-all inline-block border border-transparent hover:border-amber-500/30 -m-2 p-2 ${className}`} onClick={() => { setEditField(field); setEditValue(value); }}>
        {value} <Edit2 className="w-4 h-4 absolute -top-2 -right-4 opacity-0 group-hover:opacity-100 text-amber-500 bg-amber-500/10 p-0.5 rounded-md border border-amber-500/30" />
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      
      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Global Configuration Card */}
        <div className={`lg:col-span-2 ${theme === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl p-8 flex flex-col justify-center shadow-xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <EditableText field="heroTitle" value={settings.heroTitle} className="text-4xl sm:text-6xl font-black tracking-tight mb-3 block w-full" />
            <EditableText field="heroSubtitle" value={settings.heroSubtitle} className="text-lg text-amber-500 font-semibold block w-full" />
            
            {isAdmin && (
              <div className="mt-8 pt-6 border-t border-amber-500/20">
                <p className="text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-2 text-amber-500 font-bold"><LinkIcon className="w-4 h-4"/> Registration URL Config</p>
                <EditableText field="registrationLink" value={settings.registrationLink} className={`text-xs font-mono opacity-80 w-full break-all ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-zinc-100'} p-3 rounded-xl border border-amber-500/20 block`} />
              </div>
            )}
          </div>
        </div>

        {/* Total Prize Pool Card */}
        <div className={`lg:col-span-1 ${theme === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl p-8 shadow-xl flex flex-col justify-center items-center text-center relative`}>
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
          <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-4 border border-amber-500/30 shadow-inner">
            <DollarSign className="w-7 h-7" />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest opacity-60 mb-2">Total Prize Pool</p>
          <EditableText field="totalPrizePool" value={settings.totalPrizePool} className="text-5xl font-black text-amber-500" />
          
          {isAdmin && (
             <div className="mt-8 pt-6 border-t border-amber-500/20 w-full">
               <button onClick={() => {setIsAdmin(false); showToast("Admin session locked.");}} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-500 hover:bg-amber-500/20 transition-colors">
                 <Lock className="w-4 h-4" /> Lock Root Session
               </button>
             </div>
          )}
        </div>
      </div>

      {/* Announcements Stream */}
      <div className={`${theme === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl p-8 shadow-xl`}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold flex items-center gap-3"><Megaphone className="w-6 h-6 text-amber-500" /> System Broadcasts</h3>
          {isAdmin && <button onClick={() => setShowAnnounceForm(!showAnnounceForm)} className="bg-amber-500 text-zinc-950 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-md hover:bg-amber-400"><Plus className="w-4 h-4" /> Broadcast</button>}
        </div>

        {showAnnounceForm && isAdmin && (
          <form onSubmit={handleAnnounce} className={`mb-8 space-y-4 ${theme === 'dark' ? 'bg-[#09090b] border-amber-500/30' : 'bg-zinc-50 border-amber-600/30'} p-6 rounded-2xl border shadow-xl`}>
            <div>
              <label className="block text-xs font-mono uppercase mb-2 opacity-70">Subject</label>
              <input required type="text" value={announceData.title} onChange={e=>setAnnounceData({...announceData, title: e.target.value})} className={`w-full ${theme === 'dark' ? 'bg-[#121215] border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-950'} border rounded-xl p-3 font-bold text-sm focus:outline-none focus:border-amber-500`} />
            </div>
            <div>
               <label className="block text-xs font-mono uppercase mb-2 opacity-70">Message</label>
              <textarea required value={announceData.body} onChange={e=>setAnnounceData({...announceData, body: e.target.value})} className={`w-full ${theme === 'dark' ? 'bg-[#121215] border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-950'} border rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500`} rows={3} />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-amber-500 text-zinc-950 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-400">Deploy Message</button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {announcements.map(ann => (
            <div key={ann.id} className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800' : 'bg-zinc-50 border-zinc-200'} border group relative hover:border-amber-500/50 transition-colors shadow-md`}>
              {isAdmin && <button onClick={() => deleteItem(getAnnouncementsRef, ann.id)} className="absolute top-6 right-6 opacity-60 hover:opacity-100 text-red-500 transition-opacity"><Trash2 className="w-5 h-5" /></button>}
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-lg">{ann.title}</h4>
                <span className="text-[10px] opacity-50 uppercase font-mono tracking-widest bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-md border border-amber-500/20">{ann.timestamp ? new Date(ann.timestamp.toDate()).toLocaleDateString() : 'Just now'}</span>
              </div>
              <p className="text-sm opacity-70 leading-relaxed font-medium">{ann.body}</p>
            </div>
          ))}
          {announcements.length === 0 && <div className="text-center py-16 text-sm font-mono opacity-50 bg-[#09090b] rounded-2xl border border-zinc-800 border-dashed">No active broadcasts.</div>}
        </div>
      </div>
    </div>
  );
}

// --- COMPETITIONS MODULE ---
function CompetitionsView({ competitions, settings, isAdmin, showToast, theme }) {
  const [showForm, setShowForm] = useState(false);
  const [compData, setCompData] = useState({ name: '', objective: '', prize: '', sponsor: '' });

  const handleAddComp = async (e) => {
    e.preventDefault();
    try { 
      await addDoc(getCompsRef(), { ...compData, timestamp: serverTimestamp() }); 
      setCompData({ name: '', objective: '', prize: '', sponsor: '' }); 
      setShowForm(false); 
      showToast("Competition registered."); 
    } catch (err) {}
  };

  const deleteItem = async (id) => {
    try { await deleteDoc(doc(getCompsRef(), id)); showToast("Competition removed."); } catch (err) {}
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col max-w-6xl mx-auto">
      <div className={`flex justify-between items-center ${theme === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'} p-8 rounded-2xl border shadow-xl`}>
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2">Network Tournaments</h2>
          <p className="text-sm opacity-70 font-medium">Review active competitions and register via official Google Forms.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-amber-500 text-zinc-950 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-400 shadow-lg">
            <Plus className="w-5 h-5" /> Schedule Event
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleAddComp} className={`${theme === 'dark' ? 'bg-[#121215] border-amber-500/30' : 'bg-white border-amber-600/30'} border rounded-2xl p-8 grid grid-cols-2 gap-6 animate-in slide-in-from-top-4 shadow-2xl`}>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-mono uppercase mb-2 opacity-70">Competition Name</label>
            <input required type="text" value={compData.name} onChange={e=>setCompData({...compData, name: e.target.value})} className={`w-full ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-950'} border rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500`} />
          </div>
          <div className="col-span-2 md:col-span-1">
             <label className="block text-xs font-mono uppercase mb-2 opacity-70">Official Sponsor</label>
            <input required type="text" value={compData.sponsor} onChange={e=>setCompData({...compData, sponsor: e.target.value})} className={`w-full ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-950'} border rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500`} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-mono uppercase mb-2 opacity-70">Overall Objective</label>
            <textarea required value={compData.objective} onChange={e=>setCompData({...compData, objective: e.target.value})} className={`w-full ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-950'} border rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500`} rows={3} />
          </div>
          <div className="col-span-2 md:col-span-1">
             <label className="block text-xs font-mono uppercase mb-2 opacity-70">Prize Money</label>
            <input required type="text" value={compData.prize} onChange={e=>setCompData({...compData, prize: e.target.value})} className={`w-full ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-950'} border rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500`} />
          </div>
          <button type="submit" className="col-span-2 bg-amber-500 text-zinc-950 py-3 rounded-xl text-sm font-bold mt-2 hover:bg-amber-400">Publish to Network</button>
        </form>
      )}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 auto-rows-min pb-10">
        {competitions.map(comp => (
          <div key={comp.id} className={`${theme === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl p-8 hover:border-amber-500/50 transition-all group relative flex flex-col shadow-xl`}>
            
            {isAdmin && (
              <button onClick={() => deleteItem(comp.id)} className="absolute top-6 right-6 opacity-60 hover:opacity-100 text-red-500 transition-opacity">
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <div className="flex flex-col gap-1 mb-6">
              <h3 className="text-2xl font-black tracking-tight">{comp.name}</h3>
              <p className="text-sm font-mono text-amber-500 font-bold">Sponsored by: <span className="opacity-90">{comp.sponsor}</span></p>
            </div>
            
            <div className={`${theme === 'dark' ? 'bg-[#09090b] border-zinc-800' : 'bg-zinc-50 border-zinc-200'} rounded-xl p-5 border mb-8 flex-1`}>
              <p className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Objective</p>
              <p className="text-sm opacity-70 leading-relaxed font-medium">{comp.objective}</p>
            </div>

            <div className="flex justify-between items-end border-t border-amber-500/20 pt-6">
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-widest opacity-50 mb-1">Prize Pool</span>
                <span className="text-2xl font-black text-amber-500">{comp.prize}</span>
              </div>
              <button onClick={() => window.open(settings.registrationLink, '_blank')} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-md">
                Register <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {competitions.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50 bg-[#121215] rounded-2xl border border-zinc-800 border-dashed">
            <Trophy className="w-12 h-12 mb-4 opacity-50 text-amber-500" />
            <p className="font-bold text-lg">No tournaments active right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- BOUNTIES MODULE ---
function ChallengesView({ challenges, isAdmin, showToast, theme }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', desc: '', reward: '', tag: 'Finance' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await addDoc(getChallengesRef(), { ...formData, timestamp: serverTimestamp() }); setFormData({ title: '', desc: '', reward: '', tag: 'Finance' }); setShowForm(false); showToast("Bounty posted."); } catch (err) {}
  };
  const deleteItem = async (id) => {
    try { await deleteDoc(doc(getChallengesRef(), id)); showToast("Bounty removed."); } catch (err) {}
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col max-w-6xl mx-auto">
      <div className={`flex justify-between items-center ${theme === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'} p-8 rounded-2xl border shadow-xl`}>
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2">Active Bounties</h2>
          <p className="text-sm opacity-70 font-medium">Smaller, rolling challenges to earn points and rewards.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-amber-500 text-zinc-950 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-400 shadow-lg">
            <Plus className="w-5 h-5" /> New Bounty
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} className={`${theme === 'dark' ? 'bg-[#121215] border-amber-500/30' : 'bg-white border-amber-600/30'} border rounded-2xl p-8 grid grid-cols-2 gap-6 animate-in slide-in-from-top-4 shadow-2xl`}>
          <div className="col-span-2">
            <label className="block text-xs font-mono uppercase mb-2 opacity-70">Bounty Title</label>
            <input required type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className={`w-full ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-950'} border rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500`} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-mono uppercase mb-2 opacity-70">Requirements</label>
            <textarea required value={formData.desc} onChange={e=>setFormData({...formData, desc: e.target.value})} className={`w-full ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-950'} border rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500`} rows={3} />
          </div>
          <div className="col-span-2 md:col-span-1">
             <label className="block text-xs font-mono uppercase mb-2 opacity-70">Reward</label>
            <input required type="text" placeholder="e.g. $50" value={formData.reward} onChange={e=>setFormData({...formData, reward: e.target.value})} className={`w-full ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-950'} border rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500`} />
          </div>
          <div className="col-span-2 md:col-span-1">
             <label className="block text-xs font-mono uppercase mb-2 opacity-70">Category</label>
            <select value={formData.tag} onChange={e=>setFormData({...formData, tag: e.target.value})} className={`w-full ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-950'} border rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500`}>
              <option>Finance</option><option>Coding</option><option>Research</option>
            </select>
          </div>
          <button type="submit" className="col-span-2 bg-amber-500 text-zinc-950 py-3 rounded-xl text-sm font-bold mt-2 hover:bg-amber-400">Publish Bounty</button>
        </form>
      )}

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min overflow-y-auto custom-scrollbar pb-10">
        {challenges.map(chal => (
          <div key={chal.id} className={`${theme === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl p-6 hover:border-amber-500/50 transition-all group relative flex flex-col shadow-xl`}>
            {isAdmin && <button onClick={() => deleteItem(chal.id)} className="absolute top-6 right-6 opacity-60 hover:opacity-100 text-red-500 transition-opacity"><Trash2 className="w-5 h-5" /></button>}
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-md border border-amber-500/30 text-amber-500 bg-amber-500/10">
                {chal.tag}
              </span>
              <span className="text-sm font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">{chal.reward}</span>
            </div>
            <h3 className="font-bold mb-3 text-lg">{chal.title}</h3>
            <p className="text-sm opacity-70 flex-1 font-medium leading-relaxed">{chal.desc}</p>
          </div>
        ))}
        {challenges.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50 bg-[#121215] rounded-2xl border border-zinc-800 border-dashed">
            <Target className="w-12 h-12 mb-4 opacity-50 text-amber-500" />
            <p className="font-bold text-lg">No active bounties right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- LEADERBOARD MODULE ---
function LeaderboardView({ leaderboard, theme }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className={`${theme === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'} p-8 rounded-2xl border shadow-xl`}>
        <h2 className="text-3xl font-black tracking-tight mb-2">Network Leaderboard</h2>
        <p className="text-sm opacity-70 font-medium">Top quantitative analysts and competitors across school chapters.</p>
      </div>

      <div className={`${theme === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl overflow-hidden shadow-xl`}>
        <div className={`grid grid-cols-12 p-4 border-b ${theme === 'dark' ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-zinc-50'} text-xs font-mono uppercase tracking-wider opacity-60`}>
          <div className="col-span-2">Rank</div>
          <div className="col-span-6">Competitor Handle</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2 text-right">Rating</div>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {leaderboard.map((item, idx) => (
            <div key={item.id || idx} className="grid grid-cols-12 p-5 items-center hover:bg-amber-500/5 transition-colors">
              <div className="col-span-2 font-mono font-bold text-amber-500">#{idx + 1}</div>
              <div className="col-span-6 font-bold">{item.name}</div>
              <div className="col-span-2 font-mono text-xs opacity-70">{item.role || 'Analyst'}</div>
              <div className="col-span-2 text-right font-mono font-bold text-emerald-500">{item.score || 100}</div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="p-12 text-center opacity-50 font-mono text-sm">
              No participants ranked yet. Join a tournament to get listed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}