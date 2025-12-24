
import React from 'react';
import { Building2, Globe, LogIn, UserPlus } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface LandingPageProps {
  lang: Language;
  setLang: (l: Language) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ lang, setLang }) => {
  const t = translations[lang];

  return (
    <div className={`min-h-screen bg-white flex flex-col ${t.font}`} dir={t.dir}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -ml-48 -mb-48"></div>

      {/* Top Bar / Language */}
      <div className="p-6 flex justify-end">
        <div className="relative group">
          <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all font-bold text-xs text-slate-600">
            <Globe size={16} />
            <span>{lang === 'ar' ? 'العربية' : lang === 'fr' ? 'Français' : 'English'}</span>
          </button>
          <div className="absolute top-full mt-2 left-0 min-w-[120px] bg-white border border-slate-100 rounded-2xl shadow-2xl hidden group-hover:block z-50 overflow-hidden">
            <button onClick={() => setLang('ar')} className="block w-full px-5 py-3 text-xs font-bold hover:bg-blue-50 text-right border-b border-slate-50">العربية</button>
            <button onClick={() => setLang('fr')} className="block w-full px-5 py-3 text-xs font-bold hover:bg-blue-50 text-left border-b border-slate-50">Français</button>
            <button onClick={() => setLang('en')} className="block w-full px-5 py-3 text-xs font-bold hover:bg-blue-50 text-left">English</button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="bg-blue-600 p-8 rounded-[40px] shadow-2xl shadow-blue-200 mb-10 transform hover:scale-105 transition-transform duration-500">
          <Building2 size={80} className="text-white" />
        </div>
        
        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight leading-none">
          {t.appName}
        </h1>
        <p className="text-blue-600 font-black tracking-[0.2em] uppercase text-xs mb-8">
          {t.appSub}
        </p>
        
        <p className="max-w-xs text-slate-500 font-bold text-sm leading-relaxed mb-12">
          {lang === 'ar' 
            ? 'الشبكة المهنية الأولى في طنجة للربط بين المكاتب والعيادات وتدقيق الإحالات.' 
            : 'Le premier réseau professionnel à Tanger pour connecter les bureaux, cliniques et gérer les referrals.'}
        </p>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-4">
          <button 
            onClick={() => window.location.hash = '#login'}
            className="w-full bg-blue-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 space-x-reverse"
          >
            <LogIn size={22} />
            <span className="text-lg">{t.login}</span>
          </button>
          
          <button 
            onClick={() => window.location.hash = '#register'}
            className="w-full bg-white border-2 border-slate-200 text-slate-700 font-black py-5 rounded-[24px] hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 space-x-reverse"
          >
            <UserPlus size={22} />
            <span className="text-lg">{t.register}</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-8 text-center">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
          &copy; 2024 TangerHub • Version 1.0.0
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
