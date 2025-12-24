
import React, { useState, useEffect } from 'react';
import { 
  Building2, Search, LayoutDashboard, UserCircle, Bell, Globe, LogOut
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
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [hash, setHash] = useState(window.location.hash);

  const t = translations[lang];

  const mapProfile = (data: any): User => {
    return {
      id: data.id,
      fullName: data.full_name || '',
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
      subscriptionStart: data.created_at,
      subscriptionExpiry: data.subscription_expiry,
      referralCode: data.referral_code || '',
      bankAccount: data.bank_account
    };
  };

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) { await fetchProfile(session.user.id); } 
      else { setCurrentUser(null); }
    });

    const timer = setTimeout(() => { setLoading(false); }, 2000);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      clearTimeout(timer);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) { await fetchProfile(session.user.id); }
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) { setCurrentUser(mapProfile(data)); }
  };

  const handleLogout = async () => {
    // Force local state clear first for immediate UI feedback
    setCurrentUser(null);
    window.location.hash = ''; 
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSetUserAfterAuth = (user: any) => { setCurrentUser(mapProfile(user)); };

  if (loading) return <SplashScreen lang={lang} />;
  if (!currentUser) {
    if (hash === '#register') return <Register lang={lang} onRegister={handleSetUserAfterAuth} />;
    if (hash === '#login') return <Login lang={lang} onLogin={handleSetUserAfterAuth} setLang={setLang} />;
    return <LandingPage lang={lang} setLang={setLang} />;
  }

  if (currentUser.status === AccountStatus.PENDING && currentUser.role !== UserRole.ADMIN) {
    return <PendingApproval lang={lang} user={currentUser} onLogout={handleLogout} />;
  }

  const renderContent = () => {
    if (currentUser.role === UserRole.ADMIN) return <AdminDashboard lang={lang} onLogout={handleLogout} />;
    switch (activeTab) {
      case 'dashboard': return <ProDashboard lang={lang} user={currentUser} referrals={referrals} setReferrals={setReferrals} />;
      case 'search': return <SearchPage lang={lang} user={currentUser} />;
      case 'buildings': return <BuildingDirectory lang={lang} />;
      case 'profile': return <ProfilePage lang={lang} user={currentUser} onLogout={handleLogout} />;
      default: return <ProDashboard lang={lang} user={currentUser} referrals={referrals} setReferrals={setReferrals} />;
    }
  };

  return (
    <div className={`flex flex-col h-screen bg-[#F8FAFC] overflow-hidden ${t.font}`} dir={t.dir}>
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-blue-600 p-2 rounded-2xl shadow-lg shadow-blue-100"><Building2 className="text-white w-6 h-6" /></div>
          <div className="flex flex-col">
            <span className="font-black text-xl text-slate-900 leading-none">{t.appName}</span>
            <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest mt-1">{t.appSub}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"><Bell className="w-6 h-6" /></button>
          <div className="flex items-center space-x-3 space-x-reverse border-r pr-4 hidden sm:flex">
            <div className="text-left">
              <p className="text-sm font-black text-slate-900 leading-none">{currentUser.fullName}</p>
              <p className="text-[10px] text-blue-600 font-bold mt-1">{currentUser.role === UserRole.ADMIN ? 'مدير نظام' : (currentUser.specialty || 'مهني')}</p>
            </div>
            <img src={currentUser.profileImage || `https://picsum.photos/seed/${currentUser.id}/100`} className="w-10 h-10 rounded-2xl border-2 border-white shadow-md object-cover"/>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-6xl mx-auto h-full">{renderContent()}</div>
      </main>
      {currentUser.role !== UserRole.ADMIN && (
        <nav className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 z-40 pointer-events-none">
          <div className="max-w-xl mx-auto bg-white/90 backdrop-blur-xl border border-white shadow-2xl rounded-[32px] flex items-center justify-around px-4 py-3 pointer-events-auto">
            <NavButton active={activeTab === 'dashboard'} icon={<LayoutDashboard size={24} />} label={t.dashboard} onClick={() => setActiveTab('dashboard')} lang={lang}/>
            <NavButton active={activeTab === 'search'} icon={<Search size={24} />} label={t.search} onClick={() => setActiveTab('search')} lang={lang}/>
            <NavButton active={activeTab === 'buildings'} icon={<Building2 size={24} />} label={t.buildings} onClick={() => setActiveTab('buildings')} lang={lang}/>
            <NavButton active={activeTab === 'profile'} icon={<UserCircle size={24} />} label={t.profile} onClick={() => setActiveTab('profile')} lang={lang}/>
          </div>
        </nav>
      )}
    </div>
  );
};

const NavButton: React.FC<any> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center space-y-1 min-w-[70px] py-1.5 rounded-2xl transition-all duration-300 ${active ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
    <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-blue-600/10' : ''}`}>{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
  </button>
);

export default App;
