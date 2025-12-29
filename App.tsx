
import React, { useState, useEffect } from 'react';
import { 
  Building2, Search, LayoutDashboard, UserCircle, Bell, LogOut, AlertCircle, Loader2, Database, RefreshCcw, Home, PlusCircle, ChevronLeft, Menu
} from 'lucide-react';
import { User, UserRole, AccountStatus, Referral, Language } from './types';
import { translations } from './translations';
import { supabase } from './supabase';

// Pages
import SplashScreen from './pages/SplashScreen';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import PendingApproval from './pages/PendingApproval';
import ProDashboard from './pages/ProDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SearchPage from './pages/SearchPage';
import BuildingDirectory from './pages/BuildingDirectory';
import ProfilePage from './pages/ProfilePage';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>('ar');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hash, setHash] = useState(window.location.hash);

  const t = translations[lang] || translations.ar;

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const mapProfile = (data: any): User => ({
    id: data.id,
    fullName: data.full_name || 'Utilisateur',
    phone: data.phone || '',
    role: (data.role as UserRole) || UserRole.PROFESSIONAL,
    status: (data.status as AccountStatus) || AccountStatus.PENDING,
    neighborhood: data.neighborhood,
    specialty: data.specialty,
    buildingId: data.building_id,
    floor: data.floor,
    description: data.description,
    profileImage: data.profile_image,
    balancePending: Number(data.balance_pending || 0),
    balanceCompleted: Number(data.balance_completed || 0),
    referralCode: data.referral_code || '',
    bankAccount: data.bank_account,
    socialLinks: data.social_links,
    activeHours: data.active_hours,
    gpsLocation: data.gps_location,
    referralCount: data.referral_count
  });

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        setCurrentUser(mapProfile(data));
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  useEffect(() => {
    // Safety timer to remove splash screen after 3 seconds max
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const initApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
      clearTimeout(timer);
    };
    
    initApp();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setActiveTab('dashboard');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    window.location.hash = '';
  };

  const handleProfileUpdate = async () => {
    if (currentUser) {
      await fetchProfile(currentUser.id);
    }
  };

  if (loading) return <SplashScreen lang={lang} />;
  
  if (!currentUser) {
    if (hash === '#register') return <Register lang={lang} onRegister={() => setHash('#login')} />;
    if (hash === '#login') return <Login lang={lang} onLogin={setCurrentUser} setLang={setLang} />;
    return <LandingPage lang={lang} setLang={setLang} />;
  }

  if (currentUser.status === AccountStatus.PENDING && currentUser.role !== UserRole.ADMIN) {
    return <PendingApproval lang={lang} user={currentUser} onLogout={handleLogout} />;
  }

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: <Home size={22} /> },
    { id: 'search', label: t.search, icon: <PlusCircle size={22} /> },
    { id: 'buildings', label: t.buildings, icon: <Building2 size={22} /> },
    { id: 'profile', label: t.profile, icon: <UserCircle size={22} /> },
  ];

  const renderContent = () => {
    if (currentUser.role === UserRole.ADMIN) return <AdminDashboard lang={lang} onLogout={handleLogout} />;
    switch (activeTab) {
      case 'dashboard': return <ProDashboard lang={lang} user={currentUser} />;
      case 'search': return <SearchPage lang={lang} user={currentUser} />;
      case 'buildings': return <BuildingDirectory />;
      case 'profile': return <ProfilePage lang={lang} user={currentUser} onLogout={handleLogout} onUpdate={handleProfileUpdate} />;
      default: return <ProDashboard lang={lang} user={currentUser} />;
    }
  };

  return (
    <div className={`flex h-screen bg-[#F8FAFC] ${t.font}`} dir={t.dir}>
      {currentUser.role !== UserRole.ADMIN && (
        <aside className={`hidden md:flex flex-col bg-slate-900 text-white transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-24'} border-l border-white/5 relative z-50`}>
          <div className="p-6 flex items-center justify-between">
            {isSidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl"><Building2 className="w-5 h-5" /></div>
                <span className="font-black text-xl tracking-tight">TangerHub</span>
              </div>
            )}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <Menu size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 mt-10 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                  activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="shrink-0">{item.icon}</div>
                {isSidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all">
              <LogOut size={22} />
              {isSidebarOpen && <span className="font-bold text-sm">خروج</span>}
            </button>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-3 md:hidden">
             <div className="bg-blue-600 p-2 rounded-xl text-white"><Building2 size={20} /></div>
             <span className="font-black text-lg">TangerHub</span>
          </div>
          <div className="hidden md:block">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">{t.appName} / {navItems.find(i => i.id === activeTab)?.label}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900 leading-none">{currentUser.fullName}</p>
              <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase">{currentUser.specialty}</p>
            </div>
            <img 
              src={currentUser.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName)}&background=0D8ABC&color=fff`} 
              className="w-10 h-10 rounded-xl border border-slate-100 shadow-sm object-cover"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto p-4 md:p-8 h-full">
            {renderContent()}
          </div>
        </main>

        {currentUser.role !== UserRole.ADMIN && (
          <nav className="md:hidden bg-white border-t px-2 py-2 flex items-center justify-around z-40">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  activeTab === item.id ? 'text-blue-600 bg-blue-50' : 'text-slate-400'
                }`}
              >
                {item.icon}
                <span className="text-[9px] font-black">{item.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
};

export default App;
