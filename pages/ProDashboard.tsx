
import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, X, CheckCircle2, ArrowUpRight, ArrowDownLeft, ClipboardList, Loader2, Search as SearchIcon, Wallet, AlertCircle, Banknote, History, ChevronDown, ChevronUp, ExternalLink, ImagePlus, Send, Upload, Camera
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
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [pendingRef, setPendingRef] = useState<any>(null);
  const [sentRefs, setSentRefs] = useState<any[]>([]);
  const [receivedRefs, setReceivedRefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(user.balanceCompleted);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);
  
  // Post state
  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [uploadingPostImg, setUploadingPostImg] = useState(false);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];

  const fetchData = async () => {
    try {
      const { data: profile } = await supabase.from('profiles').select('balance_completed').eq('id', user.id).single();
      if (profile) setBalance(profile.balance_completed);

      const { data: sent } = await supabase.from('referrals').select('*, receiver:receiver_id(full_name, specialty)').eq('referrer_id', user.id).order('created_at', { ascending: false });
      const { data: rec } = await supabase.from('referrals').select('*, referrer:referrer_id(full_name, specialty)').eq('receiver_id', user.id).order('created_at', { ascending: false });
      const { data: posts } = await supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      
      setSentRefs(sent || []);
      setReceivedRefs(rec || []);
      setMyPosts(posts || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  useEffect(() => { fetchData(); }, [user.id]);

  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPostImg(true);
    setPostImageUrl(''); // Clear current for visual feedback
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      setPostImageUrl(publicUrl);
    } catch (err: any) {
      alert('فشل رفع الصورة: ' + err.message);
    } finally {
      setUploadingPostImg(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postImageUrl || !postContent) {
      alert('يرجى اختيار صورة وكتابة وصف للمنشور');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('posts').insert([{
        user_id: user.id,
        image_url: postImageUrl,
        content: postContent
      }]);
      if (!error) {
        setShowNewPost(false);
        setPostContent('');
        setPostImageUrl('');
        fetchData();
      } else {
        alert('خطأ في النشر: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCode = async () => {
    if (!referralCodeInput) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('referrals')
        .select('*, referrer:referrer_id(full_name, specialty, phone)')
        .eq('code', referralCodeInput.toUpperCase())
        .eq('receiver_id', user.id)
        .eq('status', 'PENDING')
        .maybeSingle();

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
          balance_completed: (rProfile?.balance_completed || 0) + 10,
          referral_count: (rProfile?.referral_count || 0) + 1
        }).eq('id', pendingRef.referrer_id);
        setPendingRef(null); setShowRedeem(false); setReferralCodeInput(''); fetchData();
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="px-5 py-6 space-y-6" dir={t.dir}>
      {/* Wallet Section */}
      <div className="bg-slate-900 rounded-[35px] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-right">
          <div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">الرصيد المحقق</p>
            <h2 className="text-5xl font-black">{balance} <span className="text-lg text-blue-400">DH</span></h2>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setShowNewPost(true)} className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all">
               <ImagePlus size={18} /> Boostat
             </button>
             <button onClick={() => setShowRedeem(true)} className="bg-white text-slate-900 px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-slate-100 active:scale-95 transition-all">
               <QrCode size={18} /> استقبال إحالة
             </button>
          </div>
        </div>
      </div>

      {/* Stats */}
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

      {/* Received Referrals */}
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
                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold text-slate-600 animate-in slide-in-from-top-2">
                  <p className="mb-2"><span className="text-slate-400">الحالة:</span> {ref.patient_condition || 'بدون وصف'}</p>
                  <p><span className="text-slate-400">التاريخ:</span> {new Date(ref.created_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          ))}
          {receivedRefs.length === 0 && <p className="p-10 text-center text-slate-400 font-bold">لا توجد إحالات مستلمة حالياً</p>}
        </div>
      </section>

      {/* MODAL: NEW POST (Boostat) */}
      {showNewPost && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[50px] p-10 space-y-6 shadow-2xl relative">
            <button onClick={() => setShowNewPost(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full"><X size={20}/></button>
            <h3 className="text-2xl font-black text-slate-900 text-center">نشر تحديث (Boostat)</h3>
            
            <div className="space-y-4">
               <div className="flex flex-col items-center gap-3">
                  <div className="w-full aspect-video rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                     {uploadingPostImg ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="animate-spin text-blue-600 mb-2" />
                          <span className="text-[10px] font-black text-blue-600 uppercase">جاري رفع الصورة...</span>
                        </div>
                     ) : postImageUrl ? (
                        <img src={postImageUrl} className="w-full h-full object-cover animate-in fade-in duration-500" />
                     ) : (
                        <div className="flex flex-col items-center text-slate-400">
                           <Camera size={40} className="mb-2" />
                           <span className="text-[10px] font-black uppercase">اضغط لرفع صورة من جهازك</span>
                        </div>
                     )}
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handlePostImageUpload} 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                     />
                  </div>
                  {postImageUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600 font-bold">تم الرفع بنجاح!</span>
                      <button onClick={() => setPostImageUrl('')} className="text-xs text-red-500 font-bold underline">حذف</button>
                    </div>
                  )}
               </div>

               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase px-2">شرح أو وصف للمنشور</label>
                  <textarea placeholder="اكتب عرضاً، تحديثاً، أو وصفاً لخدمتك..." className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 font-bold h-32 outline-none focus:ring-2 focus:ring-blue-600/20" value={postContent} onChange={e => setPostContent(e.target.value)} />
               </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCreatePost} 
                disabled={loading || uploadingPostImg} 
                className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={18}/> نشر الآن في TangerHub</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REDEEM MODAL */}
      {showRedeem && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[50px] p-10 space-y-6 shadow-2xl">
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900">التحقق من الكود</h3>
              <p className="text-slate-400 text-xs font-bold mt-1">أدخل الكود المقدم من المريض</p>
            </div>
            {!pendingRef ? (
              <>
                <input type="text" placeholder="TGR1234" className="w-full bg-slate-50 border-2 rounded-[30px] py-8 px-4 text-center text-4xl font-black uppercase outline-none focus:border-blue-600 transition-all" value={referralCodeInput} onChange={e => setReferralCodeInput(e.target.value)} />
                <button onClick={handleCheckCode} disabled={loading} className="w-full bg-blue-600 text-white py-6 rounded-[25px] font-black text-lg flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="animate-spin" /> : 'تحقق من الصلاحية'}
                </button>
              </>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-[35px] space-y-3 border border-slate-100">
                   <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><CheckCircle2 size={20}/></div>
                      <p className="text-sm font-black text-slate-900">المريض: {pendingRef.patient_name}</p>
                   </div>
                   <p className="text-xs font-bold text-slate-500">من طرف: {pendingRef.referrer?.full_name}</p>
                   <div className="p-4 bg-white rounded-2xl border italic text-[11px] text-slate-600 leading-relaxed shadow-sm">
                     {pendingRef.patient_condition || 'لا توجد ملاحظات إضافية'}
                   </div>
                </div>
                <button onClick={handleCompleteReferral} disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-[25px] font-black text-lg active:scale-95 transition-all">
                  {loading ? <Loader2 className="animate-spin" /> : 'تأكيد الحضور والزيارة'}
                </button>
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
