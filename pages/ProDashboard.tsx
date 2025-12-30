
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
  
  // Withdrawal Form
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

      // 1. Create Withdrawal Record
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

      // 2. Reset Profile Balance
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
    try {
      const { data } = await supabase.from('referrals').select('*, referrer:referrer_id(full_name, specialty, phone)').eq('code', referralCodeInput.toUpperCase()).eq('receiver_id', user.id).eq('status', 'PENDING').maybeSingle();
      if (data) setPendingRef(data);
      else alert(lang === 'ar' ? 'الكود غير صحيح أو مستعمل مسبقاً' : 'Invalid code');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
        
        // Push notification to Referrer
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
           <p className="text-[9px] text-slate-400 font-bold text-center italic">* يتم خصم 10% كعمولة تشغيل للتطبيق</p>
        </div>
      </div>

      <div className="flex gap-4">
         <button onClick={() => setShowNewPost(true)} className="flex-1 bg-blue-600 text-white p-5 rounded-[30px] font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-100 active:scale-95 transition-all">
           <ImagePlus size={20} /> Boostat
         </button>
         <button onClick={() => setShowRedeem(true)} className="flex-1 bg-white text-slate-900 p-5 rounded-[30px] border border-slate-100 font-black text-sm flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all">
           <QrCode size={20} /> استقبال إحالة
         </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase">المنشورات</p>
          <span className="text-2xl font-black text-slate-900">{myPosts.length}</span>
        </div>
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase">إجمالي الإحالات</p>
          <span className="text-2xl font-black text-slate-900">{sentRefs.length + receivedRefs.length}</span>
        </div>
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
                    {ref.referrer?.phone && (
                      <div>
                        <p className="text-slate-400 mb-1">للتواصل:</p>
                        <a href={`tel:${ref.referrer.phone}`} className="flex items-center gap-2 text-blue-600 font-black hover:bg-blue-50 p-2 rounded-lg transition-all">
                          <Phone size={14} /> {ref.referrer.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 text-left pt-1 italic">
                    {new Date(ref.created_at).toLocaleString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}
                  </p>
                </div>
              )}
            </div>
          ))}
          {receivedRefs.length === 0 && <p className="p-10 text-center text-slate-400 font-bold">لا توجد إحالات مستلمة حالياً</p>}
        </div>
      </section>

      {/* Withdrawal Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[50px] p-10 space-y-6 shadow-2xl animate-in zoom-in duration-300 relative">
              <button onClick={() => setShowWithdraw(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full"><X size={20}/></button>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2"><CreditCard size={32} /></div>
                <h3 className="text-2xl font-black text-slate-900">سحب الأرباح</h3>
                <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                   <p className="text-emerald-600 font-black text-3xl">{balance} DH</p>
                   <p className="text-[10px] text-emerald-400 font-bold mt-1 leading-relaxed">المبلغ الصافي بعد خصم عمولة التطبيق (10%): <span className="text-emerald-600">{(balance * 0.9).toFixed(2)} DH</span></p>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    <button 
                      onClick={() => setPaymentMethod('BANK')}
                      className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${paymentMethod === 'BANK' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                      <Banknote size={14}/> تحويل بنكي
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('CASH')}
                      className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${paymentMethod === 'CASH' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                      <HandCoins size={14}/> استلام نقدي
                    </button>
                 </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase px-2 mb-1 block">تأكيد اسم المستفيد</label>
                  <div className="relative">
                    <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                    <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pr-12 pl-4 font-bold text-sm outline-none" value={withdrawName} onChange={e => setWithdrawName(e.target.value)} />
                  </div>
                </div>

                {paymentMethod === 'BANK' && (
                  <div className="animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-2 mb-1 block">رقم الحساب البنكي (RIB)</label>
                    <div className="relative">
                      <Banknote className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                      <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pr-12 pl-4 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" value={withdrawRIB} onChange={e => setWithdrawRIB(e.target.value)} placeholder="000 000 0000000000000000 00" />
                    </div>
                  </div>
                )}

                {paymentMethod === 'CASH' && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                     <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                     <p className="text-[10px] font-bold text-amber-800 leading-relaxed">سيتم إرسال موظف من الإدارة لتسليمك المبلغ نقداً في مكتبك المسجل لدينا.</p>
                  </div>
                )}
              </div>

              <button 
                onClick={handleWithdrawRequest} 
                disabled={isWithdrawing} 
                className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isWithdrawing ? <Loader2 className="animate-spin" /> : <>تأكيد طلب السحب <Send size={16} /></>}
              </button>
           </div>
        </div>
      )}

      {showNewPost && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[50px] p-10 space-y-6 shadow-2xl relative">
            <button onClick={() => setShowNewPost(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full"><X size={20}/></button>
            <h3 className="text-2xl font-black text-slate-900 text-center">نشر تحديث (Boostat)</h3>
            <div className="space-y-4">
               <div className="flex flex-col items-center gap-3">
                  <div className="w-full aspect-video rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                     {uploadingPostImg ? (
                        <div className="flex flex-col items-center"><Loader2 className="animate-spin text-blue-600 mb-2" /><span className="text-[10px] font-black text-blue-600 uppercase">جاري رفع الصورة...</span></div>
                     ) : postImageUrl ? ( <img src={postImageUrl} className="w-full h-full object-cover animate-in fade-in duration-500" /> ) : (
                        <div className="flex flex-col items-center text-slate-400"><Camera size={40} className="mb-2" /><span className="text-[10px] font-black uppercase">اضغط لرفع صورة من جهازك</span></div>
                     )}
                     <input type="file" ref={fileInputRef} onChange={handlePostImageUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase px-2">شرح أو وصف للمنشور</label>
                  <textarea placeholder="اكتب عرضاً، تحديثاً، أو وصفاً لخدمتك..." className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 font-bold h-32 outline-none focus:ring-2 focus:ring-blue-600/20" value={postContent} onChange={e => setPostContent(e.target.value)} />
               </div>
            </div>
            <button onClick={handleCreatePost} disabled={loading || uploadingPostImg} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
              {loading ? <Loader2 className="animate-spin" /> : <><Send size={18}/> نشر الآن </>}
            </button>
          </div>
        </div>
      )}

      {showRedeem && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[50px] p-10 space-y-6 shadow-2xl">
            <div className="text-center"><h3 className="text-2xl font-black text-slate-900">التحقق من الكود</h3><p className="text-slate-400 text-xs font-bold mt-1">أدخل الكود المقدم من المريض</p></div>
            {!pendingRef ? (
              <>
                <input type="text" placeholder="TGR1234" className="w-full bg-slate-50 border-2 rounded-[30px] py-8 px-4 text-center text-4xl font-black uppercase outline-none focus:border-blue-600 transition-all" value={referralCodeInput} onChange={e => setReferralCodeInput(e.target.value)} />
                <button onClick={handleCheckCode} disabled={loading} className="w-full bg-blue-600 text-white py-6 rounded-[25px] font-black text-lg flex items-center justify-center gap-3">{loading ? <Loader2 className="animate-spin" /> : 'تحقق من الصلاحية'}</button>
              </>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-[35px] space-y-3 border border-slate-100">
                   <div className="flex items-center gap-3"><div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><CheckCircle2 size={20}/></div><p className="text-sm font-black text-slate-900">المريض: {pendingRef.patient_name}</p></div>
                   <p className="text-xs font-bold text-slate-500">من طرف: {pendingRef.referrer?.full_name}</p>
                </div>
                <button onClick={handleCompleteReferral} disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-[25px] font-black text-lg active:scale-95 transition-all">{loading ? <Loader2 className="animate-spin" /> : 'تأكيد الحضور والزيارة'}</button>
              </div>
            )}
            <button onClick={() => {setShowRedeem(false); setPendingRef(null);}} className="w-full text-slate-400 font-bold hover:text-slate-600 transition-all">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProDashboard;
