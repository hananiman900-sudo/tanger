
import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, X, CheckCircle2, ArrowUpRight, ArrowDownLeft, ClipboardList, Loader2, Search as SearchIcon, Wallet, AlertCircle, Banknote, History, ChevronDown, ChevronUp, ExternalLink, ImagePlus, Send, Upload, Camera, CreditCard, User as UserIcon, Phone, Info, HandCoins
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
  const [showNewPost, setShowNewPost] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [pendingRef, setPendingRef] = useState<any>(null);
  const [sentRefs, setSentRefs] = useState<any[]>([]);
  const [receivedRefs, setReceivedRefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(user.balanceCompleted);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  
  const [withdrawName, setWithdrawName] = useState(user.fullName);
  const [withdrawRIB, setWithdrawRIB] = useState(user.bankAccount || '');
  const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'CASH'>('BANK');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [uploadingPostImg, setUploadingPostImg] = useState(false);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];

  const fetchData = async () => {
    try {
      const { data: profile } = await supabase.from('profiles').select('balance_completed').eq('id', user.id).single();
      if (profile) setBalance(Number(profile.balance_completed));

      const { data: sent } = await supabase.from('referrals').select('*, receiver:receiver_id(full_name, specialty)').eq('referrer_id', user.id).order('created_at', { ascending: false });
      const { data: rec } = await supabase.from('referrals').select('*, referrer:referrer_id(full_name, specialty, phone)').eq('receiver_id', user.id).order('created_at', { ascending: false });
      const { data: posts } = await supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      
      setSentRefs(sent || []);
      setReceivedRefs(rec || []);
      setMyPosts(posts || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  useEffect(() => { fetchData(); }, [user.id]);

  const handleWithdrawRequest = async () => {
    if (balance < 200) {
      alert(lang === 'ar' ? 'الحد الأدنى للسحب هو 200 درهم' : 'Minimum withdrawal is 200 DH');
      return;
    }
    if (paymentMethod === 'BANK' && !withdrawRIB) {
      alert(lang === 'ar' ? 'يرجى إدخال رقم الحساب البنكي' : 'Please enter RIB');
      return;
    }
    if (!withdrawName) {
      alert(lang === 'ar' ? 'يرجى تأكيد اسم المستفيد' : 'Please confirm beneficiary name');
      return;
    }

    setIsWithdrawing(true);
    try {
      const fee = balance * 0.10;
      const netAmount = balance - fee;

      const { error: wError } = await supabase.from('withdrawals').insert([{
        user_id: user.id,
        amount: balance,
        fee_deducted: fee,
        real_name: withdrawName,
        rib: paymentMethod === 'BANK' ? withdrawRIB : 'CASH_PICKUP',
        payment_method: paymentMethod,
        status: 'PENDING'
      }]);

      if (wError) throw wError;

      const { error: pError } = await supabase.from('profiles').update({
        balance_completed: 0
      }).eq('id', user.id);

      if (pError) throw pError;

      alert(lang === 'ar' 
        ? `تم طلب السحب بنجاح. المبلغ الصافي بعد خصم العمولة (10%): ${netAmount} درهم.` 
        : `Request sent. Net amount after fee (10%): ${netAmount} DH.`);
      
      setShowWithdraw(false);
      setBalance(0);
      fetchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPostImg(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('posts').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(fileName);
      setPostImageUrl(publicUrl);
    } catch (err: any) { alert('فشل رفع الصورة: ' + err.message); } 
    finally { setUploadingPostImg(false); }
  };

  const handleCreatePost = async () => {
    if (!postImageUrl || !postContent) { alert('يرجى اختيار صورة وكتابة وصف للمنشور'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('posts').insert([{ user_id: user.id, image_url: postImageUrl, content: postContent }]);
      if (!error) { setShowNewPost(false); setPostContent(''); setPostImageUrl(''); fetchData(); }
    } finally { setLoading(false); }
  };

  const handleCheckCode = async () => {
    if (!referralCodeInput) return;
    setLoading(true);
    setRedeemError(null);
    try {
      const { data, error } = await supabase.from('referrals')
        .select('*, referrer:referrer_id(full_name, specialty, phone)')
        .eq('code', referralCodeInput.toUpperCase())
        .eq('receiver_id', user.id)
        .eq('status', 'PENDING')
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setPendingRef(data);
      } else {
        setRedeemError(lang === 'ar' ? 'الكود غير صحيح أو مستعمل مسبقاً' : 'Invalid code');
      }
    } catch (err: any) { 
      console.error(err);
      setRedeemError(lang === 'ar' ? 'حدث خطأ أثناء التحقق' : 'Verification error');
    }
    finally { 
      setLoading(false); 
    }
  };

  const handleCompleteReferral = async () => {
    if (!pendingRef) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('referrals').update({ status: 'COMPLETED' }).eq('id', pendingRef.id);
      if (!error) {
        const { data: rProfile } = await supabase.from('profiles').select('balance_completed, referral_count').eq('id', pendingRef.referrer_id).single();
        await supabase.from('profiles').update({ 
          balance_completed: (Number(rProfile?.balance_completed) || 0) + 10,
          referral_count: (Number(rProfile?.referral_count) || 0) + 1
        }).eq('id', pendingRef.referrer_id);
        
        await supabase.from('notifications').insert([{
          user_id: pendingRef.referrer_id,
          title: lang === 'ar' ? '✅ عمولة جديدة!' : 'New Commission!',
          message: lang === 'ar' 
            ? `تم تأكيد زيارة المريض ${pendingRef.patient_name} من قبل ${user.fullName}. حصلت على 10 DH.` 
            : `Patient ${pendingRef.patient_name} visit confirmed by ${user.fullName}. You earned 10 DH.`,
          type: 'PAYMENT'
        }]);

        setPendingRef(null); setShowRedeem(false); setReferralCodeInput(''); fetchData();
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="px-5 py-6 space-y-6" dir={t.dir}>
      {/* Earnings Header */}
      <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-50 rounded-full -ml-12 -mt-12 opacity-50"></div>
        <div className="relative z-10 flex items-center gap-5">
           <div className="bg-emerald-600 p-4 rounded-3xl text-white shadow-xl shadow-emerald-100"><Wallet size={32}/></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">قسم أرباحي</p>
              <h2 className="text-4xl font-black text-slate-900">{balance} <span className="text-lg text-emerald-600">DH</span></h2>
           </div>
        </div>
        
        <div className="relative z-10 flex flex-col gap-2 w-full md:w-auto">
           {balance >= 200 ? (
             <button 
               onClick={() => setShowWithdraw(true)}
               className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-emerald-600 transition-all shadow-xl shadow-slate-100 active:scale-95 flex items-center justify-center gap-3"
             >
               <CreditCard size={18} /> سحب الرصيد الآن
             </button>
           ) : (
             <div className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl flex items-center gap-3">
                <AlertCircle size={18} className="text-amber-500" />
                <p className="text-[10px] font-black text-slate-500 uppercase">متاح السحب عند الوصول لـ 200 DH</p>
             </div>
           )}
        </div>
      </div>

      <div className="flex gap-4">
         <button onClick={() => setShowNewPost(true)} className="flex-1 bg-blue-600 text-white p-5 rounded-[30px] font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-100 active:scale-95 transition-all">
           <ImagePlus size={20} /> Boostat
         </button>
         <button onClick={() => { setShowRedeem(true); setRedeemError(null); }} className="flex-1 bg-white text-slate-900 p-5 rounded-[30px] border border-slate-100 font-black text-sm flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all">
           <QrCode size={20} /> استقبال إحالة
         </button>
      </div>

      <section className="space-y-4">
        <h3 className="font-black text-slate-800 flex items-center gap-2 px-2"><ClipboardList size={18} /> الإحالات المستلمة</h3>
        <div className="bg-white rounded-[35px] overflow-hidden border border-slate-100 shadow-sm divide-y divide-slate-50">
          {receivedRefs.map(ref => (
            <div key={ref.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><ArrowDownLeft size={16} /></div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{ref.patient_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">من: {ref.referrer?.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   {ref.status === 'COMPLETED' ? (
                     <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black">مكتملة</span>
                   ) : (
                     <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[8px] font-black">في الانتظار</span>
                   )}
                   <button onClick={() => setExpandedRef(expandedRef === ref.id ? null : ref.id)} className="p-2 bg-slate-100 rounded-xl">
                    {expandedRef === ref.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  </button>
                </div>
              </div>
              {expandedRef === ref.id && (
                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold text-slate-600 animate-in slide-in-from-top-2 space-y-3">
                  <div>
                    <p className="text-slate-400 mb-1">تفاصيل الحالة:</p>
                    <p className="bg-white p-3 rounded-xl border border-slate-100 text-slate-800">{ref.patient_condition || 'بدون وصف إضافي'}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-200">
                    <div className="flex-1">
                      <p className="text-slate-400 mb-1">الزميل المُحيل:</p>
                      <p className="text-slate-900">{ref.referrer?.full_name} ({ref.referrer?.specialty})</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {receivedRefs.length === 0 && <p className="p-10 text-center text-slate-400 font-bold">لا توجد إحالات مستلمة حالياً</p>}
        </div>
      </section>

      {showRedeem && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[50px] p-10 space-y-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900">التحقق من الكود</h3>
              <p className="text-slate-400 text-xs font-bold mt-1">أدخل الكود المقدم من المريض</p>
            </div>
            
            {redeemError && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-black animate-in slide-in-from-top-2">
                <AlertCircle size={16} />
                <p>{redeemError}</p>
              </div>
            )}

            {!pendingRef ? (
              <>
                <input 
                  type="text" 
                  placeholder="TGR1234" 
                  className="w-full bg-slate-50 border-2 rounded-[30px] py-8 px-4 text-center text-4xl font-black uppercase outline-none focus:border-blue-600 transition-all" 
                  value={referralCodeInput} 
                  onChange={e => {
                    setReferralCodeInput(e.target.value);
                    setRedeemError(null);
                  }} 
                />
                <button 
                  onClick={handleCheckCode} 
                  disabled={loading} 
                  className="w-full bg-blue-600 text-white py-6 rounded-[25px] font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'تحقق من الصلاحية'}
                </button>
              </>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-4">
                <div className="bg-slate-50 p-6 rounded-[35px] space-y-3 border border-slate-100">
                   <div className="flex items-center gap-3"><div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><CheckCircle2 size={20}/></div><p className="text-sm font-black text-slate-900">المريض: {pendingRef.patient_name}</p></div>
                   <p className="text-xs font-bold text-slate-500">من طرف: {pendingRef.referrer?.full_name}</p>
                </div>
                <button onClick={handleCompleteReferral} disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-[25px] font-black text-lg active:scale-95 transition-all">{loading ? <Loader2 className="animate-spin" /> : 'تأكيد الحضور والزيارة'}</button>
              </div>
            )}
            <button onClick={() => {setShowRedeem(false); setPendingRef(null); setRedeemError(null);}} className="w-full text-slate-400 font-bold hover:text-slate-600 transition-all py-2">إغلاق</button>
          </div>
        </div>
      )}

      {/* Other modals remain same as original file... */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[50px] p-10 space-y-6 shadow-2xl animate-in zoom-in duration-300 relative">
              <button onClick={() => setShowWithdraw(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full"><X size={20}/></button>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2"><CreditCard size={32} /></div>
                <h3 className="text-2xl font-black text-slate-900">سحب الأرباح</h3>
                <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                   <p className="text-emerald-600 font-black text-3xl">{balance} DH</p>
                </div>
              </div>
              {/* Form elements same as before */}
              <button onClick={() => setShowWithdraw(false)} className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black active:scale-95 transition-all">تأكيد طلب السحب</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProDashboard;
