
import React, { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface SplashProps {
  lang: Language;
}

const SplashScreen: React.FC<SplashProps> = ({ lang }) => {
  const t = translations[lang];
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // محاكاة شريط تقدم واقعي خلال 3 ثوانٍ
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed inset-0 bg-white flex flex-col items-center justify-center z-[200] ${t.font}`} dir={t.dir}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -ml-48 -mb-48"></div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Logo */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
          <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-8 rounded-[40px] shadow-2xl shadow-blue-200 relative animate-in zoom-in duration-700">
            <Building2 size={80} className="text-white" />
          </div>
        </div>

        {/* Brand Text */}
        <div className="text-center space-y-2 animate-in slide-in-from-bottom-4 duration-1000">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t.appName}</h1>
          <p className="text-blue-600 font-black tracking-[0.3em] uppercase text-[10px]">{t.appSub}</p>
        </div>
      </div>
      
      {/* Bottom Progress Bar */}
      <div className="absolute bottom-20 w-full max-w-[200px] flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-500">
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full shadow-lg shadow-blue-200"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.loading}</span>
           <span className="text-[10px] font-black text-blue-600">{progress}%</span>
        </div>
      </div>

      <div className="absolute bottom-8 text-slate-300 text-[8px] font-black uppercase tracking-[0.4em]">
        TangerHub Affiliate Network v1.2
      </div>
    </div>
  );
};

export default SplashScreen;
