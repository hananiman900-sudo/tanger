
import React from 'react';
import { Building2 } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface SplashProps {
  lang: Language;
}

const SplashScreen: React.FC<SplashProps> = ({ lang }) => {
  const t = translations[lang];
  return (
    <div className={`fixed inset-0 bg-blue-600 flex flex-col items-center justify-center text-white z-50 ${t.font}`} dir={t.dir}>
      <div className="animate-bounce mb-8">
        <div className="bg-white/20 p-6 rounded-[40px] backdrop-blur-md">
          <Building2 size={100} className="text-white" />
        </div>
      </div>
      <h1 className="text-5xl font-black tracking-tight mb-2">{t.appName}</h1>
      <p className="text-blue-100 font-black tracking-[0.2em] uppercase text-xs">{t.appSub}</p>
      
      <div className="absolute bottom-16 flex flex-col items-center">
        <div className="w-16 h-1 bg-white/20 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-white animate-[loading_1.5s_ease-in-out_infinite]"></div>
        </div>
        <p className="text-blue-100 font-bold text-sm">{t.loading}</p>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
