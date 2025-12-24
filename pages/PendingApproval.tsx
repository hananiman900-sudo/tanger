
import React from 'react';
import { User } from '../types';
import { Clock, CheckCircle2, Navigation, LogOut, PhoneCall, AlertCircle } from 'lucide-react';

interface PendingApprovalProps {
  user: User;
  onLogout: () => void;
  lang?: string;
}

const PendingApproval: React.FC<PendingApprovalProps> = ({ user, onLogout, lang = 'ar' }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 items-center justify-center text-center">
      <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200 max-w-sm w-full space-y-6 relative overflow-hidden border border-slate-100">
        <div className="absolute top-0 left-0 w-full h-3 bg-amber-400"></div>
        
        <div className="mx-auto w-24 h-24 bg-amber-50 rounded-[32px] flex items-center justify-center text-amber-500 shadow-inner">
          <Clock size={48} className="animate-pulse" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900">{lang === 'ar' ? 'حسابك قيد المراجعة' : 'Compte en Attente'}</h2>
          <p className="text-slate-500 mt-2 font-bold">{lang === 'ar' ? 'مرحباً' : 'Bonjour'} <strong>{user.fullName}</strong>,</p>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed font-medium">
            {lang === 'ar' 
              ? 'طلبك مسجل بنجاح. الإدارة تقوم حالياً بمراجعة بياناتك المهنية لتفعيل حسابك.' 
              : "Votre inscription est enregistrée. L'administrateur vérifie vos informations."}
          </p>
        </div>

        {/* Note about activation time */}
        <div className="p-4 bg-amber-50 rounded-[24px] border border-amber-200 flex items-start space-x-3 space-x-reverse text-right" dir="rtl">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <p className="text-xs text-amber-800 font-bold leading-relaxed">
            {lang === 'ar' 
              ? 'ملاحظة: سيتم تفعيل حسابك في غضون أقل من ساعة واحدة تقريباً.' 
              : 'Note: Votre compte sera activé dans moins d\'une heure environ.'}
          </p>
        </div>

        <div className="bg-slate-50 rounded-[24px] p-5 text-right space-y-3 border border-slate-100" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex items-center space-x-3 space-x-reverse text-xs">
            <CheckCircle2 size={18} className="text-green-500 shrink-0" />
            <span className="text-slate-600 font-bold">{lang === 'ar' ? 'تم استلام طلب التسجيل' : 'Inscription reçue'}</span>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse text-xs">
            <Clock size={18} className="text-amber-500 shrink-0" />
            <span className="text-slate-700 font-black">{lang === 'ar' ? 'جاري تفعيل الاشتراك المهني' : 'Activation du compte'}</span>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse text-xs">
            <Navigation size={18} className="text-slate-300 shrink-0" />
            <span className="text-slate-400 font-bold">{lang === 'ar' ? 'الدخول للوحة التحكم' : 'Accès au Dashboard'}</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center space-x-3 space-x-reverse shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
            <PhoneCall size={20} />
            <span>{lang === 'ar' ? 'اتصل بالإدارة للاستفسار' : 'Contacter Support'}</span>
          </button>
          
          <button 
            onClick={() => onLogout()}
            className="w-full flex items-center justify-center space-x-2 text-slate-400 font-black py-3 rounded-2xl border border-slate-100 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
          >
            <LogOut size={18} />
            <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Se déconnecter'}</span>
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-slate-400 text-[10px] font-black tracking-widest uppercase">
        &copy; 2024 TangerHub Affiliate Network
      </div>
    </div>
  );
};

export default PendingApproval;
