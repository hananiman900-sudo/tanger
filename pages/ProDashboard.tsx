
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Wallet, QrCode, Send, History, CheckCircle2, 
  Clock, ChevronRight, Plus, Bell, X, CreditCard, DollarSign, Calendar, Search as SearchIcon, UserCheck, ArrowUpRight, ArrowDownLeft, Building
} from 'lucide-react';
import { User, Referral, Language, AppNotification } from '../types';
import { translations } from '../translations';
import { supabase } from '../supabase';

interface ProDashboardProps {
  lang: Language;
  user: User;
  referrals: Referral[];
  setReferrals: React.Dispatch<React.SetStateAction<Referral[]>>;
}

const ProDashboard: React.FC<ProDashboardProps> = ({ lang, user }) => {
  const [showRedeem, setShowRedeem] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [pendingRef, setPendingRef] = useState<any>(null);
  const [sentRefs, setSentRefs] = useState<any[]>([]);
  const [receivedRefs, setReceivedRefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const t = translations[lang];

  const fetchData = async () => {
    const { data: sent } = await supabase.from('referrals').select('*, receiver:receiver_id(full_name, specialty)').eq('referrer_id', user.id).order('created_at', { ascending: false });
    const { data: rec } = await supabase.from('referrals').select('*, referrer:referrer_id(full_name, specialty, building_id)').eq('receiver_id', user.id).order('created_at', { ascending: false });
    
    if (sent) setSentRefs(sent);
    if (rec) setReceivedRefs(rec);
  };

  useEffect(() => { fetchData(); }, [user.id]);

  const handleCheckCode = async () => {
    if (!referralCodeInput) return;
    setLoading(true);
    // Find a pending referral for THIS user matching the code
    const { data, error } = await supabase
      .from('referrals')
      .select('*, referrer:referrer_id(full_name, building_id)')
      .eq('code', referralCodeInput.toUpperCase())
      .eq('receiver_id', user.id)
      .eq('status', 'PENDING')
      .maybeSingle();

    setLoading(false);
    if (data) {
      setPendingRef(data);
    } else {
      alert(lang === 'ar' ? 'الكود غير صحيح، أو تم استخدامه، أو لا يخص عيادتك' : 'Invalid or expired code');
    }
  };

  const handleCompleteReferral = async () => {
    if (!pendingRef) return;
    setLoading(true);
    
    // 1. Mark as completed
    const { error: updateError } = await supabase.from('referrals').update({ status: 'COMPLETED' }).eq('id', pendingRef.id);
    
    if (!updateError) {
      // 2. Add commission to the REFERRER
      const { data: prof } = await supabase.from('profiles').select('balance_completed').eq('id', pendingRef.referrer_id).single();
      const currentBal = prof?.balance_completed || 0;
      await supabase.from('profiles').update({ balance_completed: currentBal + 10 }).eq('id', pendingRef.referrer_id);

      alert(lang === 'ar' ? 'تم تأكيد الزيارة بنجاح. شكراً لتعاونكم المهني' : 'Referral confirmed successfully');
      setPendingRef(null);
      setShowRedeem(false);
      setReferralCodeInput('');
      fetchData();
    }
    setLoading(false);
  };

  return (
    <div className="px-5 py-6 space-y-6" dir={t.dir}>
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">{t.welcome}، {user.fullName?.split(' ')[0]}</h2>
          <p className="text-slate-500 text-[10px] font-bold">رصيد عمولاتك: <span className="text-emerald-600 font-black">{user.balanceCompleted} DH</span></p>
        </div>
        <button onClick={() => setShowRedeem(true)} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all">
          <QrCode size={18} /> {lang === 'ar' ? 'استقبال مريض' : 'Check Patient'}
        </button>
      </header>

      {/* Stats Summary */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 mb-3">
            <ArrowUpRight size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إحالات مرسلة</p>
          <span className="text-2xl font-black text-slate-900">{sentRefs.length}</span>
        </div>
        <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center text-emerald-600 mb-3">
            <ArrowDownLeft size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إحالات مستلمة</p>
          <span className="text-2xl font-black text-slate-900">{receivedRefs.length}</span>
        </div>
      </section>

      {/* Recent List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-800">{lang === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}</h3>
          <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{lang === 'ar' ? 'الكل' : 'See All'}</button>
        </div>
        <div className="space-y-3">
          {receivedRefs.length === 0 && (
            <div className="py-12 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
               <p className="text-xs text-slate-400 font-bold">لا توجد إحالات مستلمة حالياً</p>
            </div>
          )}
          {receivedRefs.slice(0, 5).map(ref => (
            <div key={ref.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 text-slate-400 rounded-xl"><UserCheck size={16}/></div>
                <div>
                  <p className="text-xs font-black text-slate-900">{ref.patient_name}</p>
                  <p className="text-[9px] text-slate-400 font-bold">من طرف: {ref.referrer?.full_name}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[9px] font-black px-2 py-1 rounded-md ${ref.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {ref.status === 'COMPLETED' ? 'تمت الزيارة' : 'في الانتظار'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal for Redeeming Code */}
      {showRedeem && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            {!pendingRef ? (
              <>
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[30px] flex items-center justify-center mx-auto mb-4"><SearchIcon size={40}/></div>
                  <h3 className="text-2xl font-black text-slate-900">{lang === 'ar' ? 'استقبال مريض محال' : 'Check-in Patient'}</h3>
                  <p className="text-xs text-slate-400 font-bold mt-2 px-6">أدخل الكود الذي سلمه لك المريض لتأكيد الإحالة وتوثيق العملية</p>
                </div>
                <input 
                  type="text" 
                  placeholder="EX: 4852" 
                  maxLength={4}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] py-6 px-4 text-center text-4xl font-black tracking-[0.4em] focus:border-blue-500 outline-none transition-all uppercase text-slate-800"
                  value={referralCodeInput}
                  onChange={e => setReferralCodeInput(e.target.value)}
                />
                <div className="flex gap-3">
                  <button onClick={handleCheckCode} disabled={loading} className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all">
                    {loading ? <X className="animate-spin mx-auto" /> : (lang === 'ar' ? 'تحقق من الكود' : 'Verify')}
                  </button>
                  <button onClick={() => setShowRedeem(false)} className="px-6 py-5 text-slate-400 font-bold">إلغاء</button>
                </div>
              </>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                <div className="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100 text-center">
                  <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">تم العثور على الإحالة</p>
                  <h4 className="text-2xl font-black text-emerald-900">{pendingRef.patient_name}</h4>
                </div>
                <div className="space-y-4 bg-slate-50 p-6 rounded-[32px]">
                  <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-3">
                    <span className="text-slate-400 font-bold">الطبيب المحيل:</span>
                    <span className="text-slate-900 font-black">{pendingRef.referrer?.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-3">
                    <span className="text-slate-400 font-bold">العمارة:</span>
                    <span className="text-slate-900 font-black flex items-center gap-1"><Building size={12}/> {pendingRef.referrer?.building_id || 'نفس العمارة'}</span>
                  </div>
                  <div className="flex flex-col text-xs">
                    <span className="text-slate-400 font-bold mb-1">سبب الزيارة / ملاحظة:</span>
                    <span className="text-slate-800 font-bold bg-white p-3 rounded-xl border border-slate-100">{pendingRef.reason || 'زيارة طبية عامة'}</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleCompleteReferral} disabled={loading} className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
                    {loading ? <X className="animate-spin" /> : <><CheckCircle2 size={18}/> {lang === 'ar' ? 'تأكيد الحضور' : 'Confirm Access'}</>}
                  </button>
                  <button onClick={() => setPendingRef(null)} className="px-6 py-5 text-slate-400 font-bold">رجوع</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProDashboard;
