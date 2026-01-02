
import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, X, CheckCircle2, ArrowUpRight, ArrowDownLeft, ClipboardList, Loader2, Search as SearchIcon, Wallet, AlertCircle, Banknote, History, ChevronDown, ChevronUp, ExternalLink, ImagePlus, Send, Upload, Camera, CreditCard, User as UserIcon, Phone, Info, HandCoins, TrendingUp, Users
} from 'lucide-react';
import { User, Language, Post } from '../types';
import { translations } from '../translations';
import { supabase } from '../supabase';

interface ProDashboardProps {
  lang: Language;
  user: User;
}

const ProDashboard: React.FC<ProDashboardProps> = ({ lang, user }) => {
  const [showRedeem, setShowRedeem] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [pendingRef, setPendingRef] = useState<any>(null);
  const [receivedRefs, setReceivedRefs] = useState<any[]>([]);
  const [sentRefs, setSentRefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(user.balanceCompleted);
  const [debt, setDebt] = useState(user.debtBalance);
  
  const [withdrawName, setWithdrawName] = useState(user.fullName);
  const [withdrawRIB, setWithdrawRIB] = useState(user.bankAccount || '');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const t = translations[lang];

  const fetchData = async () => {
    try {
      const { data: profile } = await supabase.from('profiles').select('balance_completed, debt_balance').eq('id', user.id).single();
      if (profile) {
        setBalance(Number(profile.balance_completed));
        setDebt(Number(profile.debt_balance));
      }

      if (user.accountType === 'PROFESSIONAL') {
        const { data: rec } = await supabase.from('referrals').select('*, referrer:referrer_id(full_name, specialty, phone, account_type)').eq('receiver_id', user.id).order('created_at', { ascending: false });
        setReceivedRefs(rec || []);
      } else {
        const { data: sent } = await supabase.from('referrals').select('*, receiver:receiver_id(full_name, specialty)').eq('referrer_id', user.id).order('created_at', { ascending: false });
        setSentRefs(sent || []);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [user.id]);

  const handleWithdrawRequest = async () => {
    if (balance < 100) {
      alert('الحد الأدنى للسحب هو 100 درهم');
      return;
    }
    setIsWithdrawing(true);
    try {
      // عمولة ثابتة 25 درهم عن كل 100 درهم
      const totalToWithdraw = Math.floor(balance / 100) * 100;
      const fee = (totalToWithdraw / 100) * 25;
      const netAmount = totalToWithdraw - fee;

      const { error } = await supabase.from('withdrawals').insert([{
        user_id: user.id,
        amount: totalToWithdraw,
        fee_deducted: fee,
        real_name: withdrawName,
        rib: withdrawRIB,
        status: 'PENDING'
      }]);

      if (!error) {
        await supabase.from('profiles').update({ balance_completed: balance - totalToWithdraw }).eq('id', user.id);
        alert(`تم الطلب! المبلغ المستحق: ${netAmount} DH (بعد اقتطاع ${fee} DH عمولة التطبيق)`);
        setShowWithdraw(false);
        fetchData();
      }
    } finally { setIsWithdrawing(false); }
  };

  const handleCompleteReferral = async () => {
    if (!pendingRef) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('referrals').update({ status: 'COMPLETED' }).eq('id', pendingRef.id);
      if (!error) {
        // إذا كان المُحيل مسوقاً، يحصل على 20 درهم
        if (pendingRef.referrer?.account_type === 'MARKETER') {
           const { data: mProfile } = await supabase.from('profiles').select('balance_completed').eq('id', pendingRef.referrer_id).single();
           await supabase.from('profiles').update({ 
             balance_completed: (Number(mProfile?.balance_completed) || 0) + 20 
           }).eq('id', pendingRef.referrer_id);

           // المهني (الطبيب) يصبح مديناً بـ 20 درهم
           const { data: dProfile } = await supabase.from('profiles').select('debt_balance').eq('id', user.id).single();
           await supabase.from('profiles').update({ 
             debt_balance: (Number(dProfile?.debt_balance) || 0) + 20 
           }).eq('id', user.id);
        }

        setPendingRef(null); setShowRedeem(false); setReferralCodeInput(''); fetchData();
      }
    } finally { setLoading(false); }
  };

  const handleCheckCode = async () => {
    setLoading(true);
    const { data } = await supabase.from('referrals')
      .select('*, referrer:referrer_id(full_name, specialty, account_type)')
      .eq('code', referralCodeInput.toUpperCase())
      .eq('receiver_id', user.id)
      .eq('status', 'PENDING')
      .maybeSingle();
    
    if (data) setPendingRef(data);
    else alert('كود غير صحيح');
    setLoading(false);
  };

  return (
    <div className="px-5 py-6 space-y-6" dir="rtl">
      {/* Header for Marketer vs Professional */}
      {user.accountType === 'MARKETER' ? (
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[40px] p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
           <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">أرباحي كمسوق</p>
              <h2 className="text-5xl font-black">{balance} <span className="text-xl">DH</span></h2>
              <button 
                onClick={() => setShowWithdraw(true)}
                className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-black text-xs active:scale-95 transition-all shadow-lg"
              >
                سحب الأرباح
              </button>
           </div>
           <Wallet size={120} className="absolute -bottom-6 -left-6 opacity-10 rotate-12" />
        </div>
      ) : (
        <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-5">
              <div className="bg-red-50 p-4 rounded-3xl text-red-600"><AlertCircle size={32}/></div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المبلغ المستحق للتطبيق</p>
                 <h2 className="text-4xl font-black text-slate-900">{debt} <span className="text-lg text-red-600">DH</span></h2>
              </div>
           </div>
           <div className="bg-slate-50 p-4 rounded-2xl max-w-xs">
              <p className="text-[10px] font-bold text-slate-500 leading-relaxed">هذا المبلغ يمثل عمولة المنصة (20 DH) عن كل مريض تم تأكيد زيارته عبر مسوق مستقل.</p>
           </div>
        </div>
      )}

      {/* Stats Section for Doctors */}
      {user.accountType === 'PROFESSIONAL' && (
        <section className="space-y-4">
          <h3 className="font-black text-slate-800 flex items-center gap-2"><Users size={18} /> سجل الإحالات المستلمة</h3>
          <div className="bg-white rounded-[35px] overflow-hidden border border-slate-100 shadow-sm divide-y divide-slate-50">
             {receivedRefs.map(ref => (
               <div key={ref.id} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><UserIcon size={16} /></div>
                     <div>
                        <p className="text-sm font-black text-slate-900">{ref.patient_name}</p>
                        <p className="text-[9px] text-slate-400 font-bold">بواسطة: {ref.referrer?.full_name} ({ref.referrer?.account_type === 'MARKETER' ? 'مسوق' : 'زميل'})</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <span className={`px-3 py-1 rounded-full text-[8px] font-black ${ref.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {ref.status === 'COMPLETED' ? 'تمت الزيارة' : 'في الانتظار'}
                     </span>
                     {ref.referrer?.account_type === 'MARKETER' && ref.status === 'COMPLETED' && (
                       <p className="text-[8px] font-black text-red-400 mt-1">المستحق: 20 DH</p>
                     )}
                  </div>
               </div>
             ))}
             {receivedRefs.length === 0 && <p className="p-10 text-center text-slate-400 font-bold">لا توجد إحالات حالياً</p>}
          </div>
          <button onClick={() => setShowRedeem(true)} className="w-full bg-slate-900 text-white py-5 rounded-[30px] font-black flex items-center justify-center gap-3 active:scale-95 transition-all">
            <QrCode size={20} /> التحقق من كود مريض جديد
          </button>
        </section>
      )}

      {/* Marketer Stats */}
      {user.accountType === 'MARKETER' && (
        <section className="space-y-4">
           <h3 className="font-black text-slate-800 flex items-center gap-2"><TrendingUp size={18} /> إحصائياتي</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">إجمالي الإحالات</p>
                 <p className="text-2xl font-black text-blue-600">{sentRefs.length}</p>
              </div>
              <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">المؤكدة</p>
                 <p className="text-2xl font-black text-emerald-600">{sentRefs.filter(r => r.status === 'COMPLETED').length}</p>
              </div>
           </div>
           <p className="bg-blue-50 p-4 rounded-2xl text-[10px] font-bold text-blue-800 text-center">تربح 20 درهم عن كل زيارة مؤكدة. السحب عند الوصول لـ 100 درهم.</p>
        </section>
      )}

      {/* Modals */}
      {showRedeem && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[50px] p-10 space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900">تأكيد حضور المريض</h3>
              <p className="text-slate-400 text-xs font-bold mt-1">أدخل الكود الذي يحمله المريض لتفعيل العمولة</p>
            </div>
            {!pendingRef ? (
              <>
                <input type="text" className="w-full bg-slate-50 border-2 rounded-[30px] py-8 text-center text-4xl font-black uppercase outline-none focus:border-blue-600" value={referralCodeInput} onChange={e => setReferralCodeInput(e.target.value)} placeholder="TGR0000" />
                <button onClick={handleCheckCode} disabled={loading} className="w-full bg-blue-600 text-white py-6 rounded-[25px] font-black">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'تحقق'}</button>
              </>
            ) : (
              <div className="space-y-4 animate-in zoom-in">
                 <div className="bg-slate-50 p-6 rounded-[30px] border">
                    <p className="text-xs font-black text-slate-400 mb-1">المريض:</p>
                    <p className="text-lg font-black text-slate-900">{pendingRef.patient_name}</p>
                 </div>
                 <button onClick={handleCompleteReferral} className="w-full bg-emerald-600 text-white py-6 rounded-[25px] font-black">تأكيد الزيارة الآن</button>
              </div>
            )}
            <button onClick={() => setShowRedeem(false)} className="w-full text-slate-400 font-bold">إلغاء</button>
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[50px] p-10 space-y-6">
            <h3 className="text-2xl font-black text-slate-900 text-center">طلب سحب الأرباح</h3>
            <div className="bg-blue-50 p-6 rounded-[30px] text-center">
               <p className="text-[10px] font-black text-blue-400 uppercase">الرصيد القابل للسحب</p>
               <p className="text-4xl font-black text-blue-600">{balance} DH</p>
            </div>
            <div className="space-y-4">
               <input type="text" placeholder="اسم المستفيد الكامل" className="w-full bg-slate-50 p-4 rounded-2xl font-bold" value={withdrawName} onChange={e => setWithdrawName(e.target.value)} />
               <input type="text" placeholder="رقم الحساب البنكي (RIB)" className="w-full bg-slate-50 p-4 rounded-2xl font-bold" value={withdrawRIB} onChange={e => setWithdrawRIB(e.target.value)} />
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
               <p className="text-[10px] font-bold text-amber-700 leading-relaxed">تنبيه: يتم اقتطاع 25 DH عن كل 100 DH يتم سحبها لفائدة التطبيق.</p>
            </div>
            <button onClick={handleWithdrawRequest} disabled={isWithdrawing} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black">تأكيد السحب</button>
            <button onClick={() => setShowWithdraw(false)} className="w-full text-slate-400 font-bold">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProDashboard;
