
import React, { useState } from 'react';
import { Building2, Phone, Lock, ArrowRight, ArrowLeft, Loader2, ChevronLeft, ChevronRight, Database, X, Copy, Check, AlertCircle } from 'lucide-react';
import { User, Language } from '../types';
import { translations } from '../translations';
import { supabase, SQL_SNIPPETS } from '../supabase';

interface LoginProps {
  lang: Language;
  onLogin: (user: User) => void;
  setLang: (l: Language) => void;
}

const Login: React.FC<LoginProps> = ({ lang, onLogin, setLang }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const t = translations[lang];

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    // أمان إضافي: التوقف بعد 10 ثوانٍ مهما حدث
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError(lang === 'ar' ? 'فشل الاتصال، يرجى المحاولة مرة أخرى' : 'Connection timeout, please try again');
      }
    }, 10000);
    
    try {
      const email = `${phone.trim()}@tangerhub.ma`;

      // 1. محاولة تسجيل الدخول عبر نظام Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials');
      }

      if (authData?.user) {
        // 2. التحقق من وجود الملف الشخصي في قاعدة البيانات
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        
        if (profileData) {
          // نجاح كامل
          onLogin(profileData as User);
        } else {
          // حالة خاصة: الحساب موجود في Auth ولكن تم مسحه من Profiles (بسبب التنظيف)
          await supabase.auth.signOut();
          throw new Error(lang === 'ar' 
            ? 'هذا الحساب تم حذفه من النظام (بعد عملية التنظيف)، يرجى إنشاء حساب جديد' 
            : 'Account data was cleared, please register again');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      setLoading(false);
    } finally {
      clearTimeout(timeout);
      // لا نضع setLoading(false) هنا مباشرة لأن التوجيه سيتم عبر onLogin في حال النجاح
    }
  };

  return (
    <div className={`min-h-screen bg-white flex flex-col px-6 pt-10 ${t.font}`} dir={t.dir}>
      <div className="mb-6 flex justify-between items-center">
        <button 
          onClick={() => window.location.hash = ''}
          className="p-3 bg-slate-50 rounded-2xl text-slate-500 hover:text-blue-600 transition-all flex items-center space-x-2 space-x-reverse font-bold text-sm"
        >
          {lang === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          <span>{t.back}</span>
        </button>

        <button 
          onClick={() => setShowSqlModal(true)}
          className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all shadow-sm"
        >
          <Database size={20} />
        </button>
      </div>

      {showSqlModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[85vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center space-x-3 space-x-reverse text-slate-900">
                <Database className="text-blue-600" />
                <h3 className="font-black text-xl">{lang === 'ar' ? 'أكواد SQL للإدارة' : 'SQL Admin Codes'}</h3>
              </div>
              <button onClick={() => setShowSqlModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all"><X /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide text-slate-900">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mb-4">
                <p className="text-xs text-amber-800 font-bold leading-relaxed">
                  {lang === 'ar' 
                    ? '⚠️ تنبيه: إذا قمت بتشغيل كود التنظيف (CLEAN_DATABASE)، ستحتاج لإعادة تسجيل حسابات جديدة لأن البيانات القديمة تُحذف تماماً.' 
                    : '⚠️ Warning: If you run the CLEAN_DATABASE script, you must register new accounts as old data is deleted.'}
                </p>
              </div>
              
              {SQL_SNIPPETS.map((snippet) => (
                <div key={snippet.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 bg-white border-b flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md mr-2">{snippet.id}</span>
                      <span className="font-bold text-slate-800">{snippet.title}</span>
                    </div>
                    <button 
                      onClick={() => handleCopy(snippet.code, snippet.id)}
                      className={`p-2 rounded-xl transition-all ${copiedId === snippet.id ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'}`}
                    >
                      {copiedId === snippet.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-slate-500 mb-3 italic">{snippet.description}</p>
                    <pre className="bg-slate-900 text-blue-100 p-4 rounded-xl text-[11px] overflow-x-auto font-mono whitespace-pre-wrap">
                      {snippet.code}
                    </pre>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t bg-slate-50 flex justify-center">
              <button 
                onClick={() => setShowSqlModal(false)}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-lg active:scale-95 transition-all"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center mb-10">
        <div className="bg-blue-600 p-4 rounded-3xl mb-6 shadow-xl shadow-blue-200">
          <Building2 size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-black text-slate-800">{t.welcome}</h2>
        <p className="text-slate-500 mt-2 font-medium">{t.login}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 mx-1">{t.phone}</label>
          <div className="relative">
            <Phone className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5`} />
            <input 
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-900`}
              placeholder="06 XX XX XX XX"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 mx-1">{t.password}</label>
          <div className="relative">
            <Lock className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5`} />
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-slate-900`}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-70 h-16"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <>
              <span>{t.enter}</span>
              {lang === 'ar' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
            </>
          )}
        </button>
      </form>

      <div className="mt-auto pb-10 flex flex-col items-center">
        <p className="text-slate-500 mb-2 text-sm font-bold">{t.noAccount}</p>
        <button 
          onClick={() => window.location.hash = '#register'}
          className="text-blue-600 font-black hover:underline"
        >
          {t.register}
        </button>
      </div>
    </div>
  );
};

export default Login;
