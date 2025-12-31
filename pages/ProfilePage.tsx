
import React, { useState, useRef, useEffect } from 'react';
import { User, Language, Post } from '../types';
import { 
  Camera, MapPin, Settings, LogOut, Share2, Wallet, Instagram, Facebook, Phone, Save, Loader2, X, CheckCircle, Info, Database, AlertCircle, Linkedin, Building2, Layers, Grid, List, MessageCircle, Globe, Edit3, Heart, MessageSquare, RefreshCw, TrendingUp, CreditCard, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../supabase';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  onUpdate: () => Promise<void>;
  lang: Language;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onUpdate, lang }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [fetchingPosts, setFetchingPosts] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<User>>({
    fullName: user.fullName || '',
    profileImage: user.profileImage || '',
    bankAccount: user.bankAccount || '',
    socialLinks: user.socialLinks || { facebook: '', instagram: '', whatsapp: '', linkedin: '' },
    activeHours: user.activeHours || '',
    gpsLocation: user.gpsLocation || '',
    description: user.description || ''
  });

  useEffect(() => {
    const syncData = async () => {
      setRefreshing(true);
      await onUpdate();
      setRefreshing(false);
    };
    syncData();
    fetchUserPosts();
  }, []);

  useEffect(() => {
    setFormData({
      fullName: user.fullName,
      profileImage: user.profileImage,
      bankAccount: user.bankAccount,
      socialLinks: user.socialLinks || { facebook: '', instagram: '', whatsapp: '', linkedin: '' },
      activeHours: user.activeHours || '',
      gpsLocation: user.gpsLocation || '',
      description: user.description || ''
    });
  }, [user]);

  const fetchUserPosts = async () => {
    setFetchingPosts(true);
    try {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setUserPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingPosts(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setSaveSuccess(false);
    setErrorReason(null);

    try {
      const updateData = {
        full_name: formData.fullName,
        profile_image: formData.profileImage,
        bank_account: formData.bankAccount,
        social_links: formData.socialLinks,
        active_hours: formData.activeHours,
        gps_location: formData.gpsLocation,
        description: formData.description
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      await onUpdate();
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowEditModal(false);
        setLoading(false);
      }, 1000);

    } catch (err: any) {
      setErrorReason(err.message || "حدث خطأ أثناء حفظ البيانات");
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, profileImage: publicUrl }));
      await supabase.from('profiles').update({ profile_image: publicUrl }).eq('id', user.id);
      await onUpdate();
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="bg-white min-h-full pb-20 font-ar" dir="rtl">
      {/* Instagram Header Style */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
           <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
             {user.fullName}
             {refreshing && <Loader2 size={14} className="animate-spin text-blue-600" />}
           </h2>
           <div className="flex items-center gap-4">
              <button onClick={() => setShowEditModal(true)} className="p-2 bg-slate-50 rounded-xl text-slate-600"><Settings size={20}/></button>
              <button onClick={onLogout} className="p-2 bg-red-50 rounded-xl text-red-500 hover:bg-red-100 transition-all"><LogOut size={20}/></button>
           </div>
        </div>

        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 shadow-lg">
               <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-100">
                 <img 
                   src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0D8ABC&color=fff`} 
                   className="w-full h-full object-cover"
                 />
               </div>
            </div>
          </div>
          
          <div className="flex-1 flex justify-around items-center text-center">
             <div className="px-2">
                <p className="font-black text-slate-900 text-sm md:text-lg">{userPosts.length}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">المنشورات</p>
             </div>
             <div className="px-2">
                <p className="font-black text-slate-900 text-sm md:text-lg">{user.referralCount || 0}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">الإحالات</p>
             </div>
             <div className="px-2 bg-emerald-50 py-2 rounded-2xl border border-emerald-100/50">
                <p className="font-black text-emerald-600 text-sm md:text-lg">{user.balanceCompleted} <span className="text-[8px]">DH</span></p>
                <p className="text-[10px] text-emerald-500 font-black uppercase">الرصيد</p>
             </div>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mb-6">
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1">
             <Layers size={10} className="text-blue-600" /> {user.specialty}
           </p>
           <p className="text-xs font-bold text-slate-600 leading-relaxed whitespace-pre-wrap max-w-sm">
             {user.description || "أضف وصفاً مهنياً لمساعدة زملائك في التعرف على خدماتك."}
           </p>
           {user.neighborhood && (
             <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mt-2">
                <MapPin size={10} className="text-red-400" /> <span>{user.neighborhood} • الطابق {user.floor}</span>
             </div>
           )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-8">
           <button 
             onClick={() => setShowEditModal(true)}
             className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-100 active:scale-95"
           >
             <Edit3 size={14} /> تعديل الحساب
           </button>
           <button onClick={onLogout} className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95">
             <LogOut size={14} /> خروج
           </button>
        </div>
      </div>

      {/* Wallet Summary Card */}
      <div className="px-5 mb-8">
         <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[30px] p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10 flex justify-between items-start">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">محفظتي الرقمية</p>
                  <h4 className="text-3xl font-black">{user.balanceCompleted} <span className="text-sm font-bold opacity-60">DH</span></h4>
               </div>
               <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                  <Wallet size={24} className="text-blue-400" />
               </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-slate-300">متوافق مع الشاشة الرئيسية</span>
               </div>
               <button onClick={onUpdate} className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 transition-all flex items-center gap-1">
                  تحديث الآن <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
               </button>
            </div>
         </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-t border-slate-100 sticky top-0 bg-white z-20">
         <button className="flex-1 py-4 flex justify-center border-b-2 border-slate-900 text-slate-900">
            <Grid size={20} />
         </button>
         <button className="flex-1 py-4 flex justify-center text-slate-300 border-b-2 border-transparent">
            <ImageIcon size={20} />
         </button>
         <button className="flex-1 py-4 flex justify-center text-slate-300 border-b-2 border-transparent">
            <Heart size={20} />
         </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-0.5">
         {fetchingPosts ? (
           Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="aspect-square bg-slate-50 animate-pulse"></div>
           ))
         ) : userPosts.length > 0 ? (
           userPosts.map(post => (
             <div key={post.id} className="aspect-square relative group overflow-hidden bg-slate-50">
                <img src={post.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                   <div className="flex items-center gap-1 font-black text-xs"><Heart size={14} fill="white" /> 0</div>
                   <div className="flex items-center gap-1 font-black text-xs"><MessageSquare size={14} fill="white" /> 0</div>
                </div>
             </div>
           ))
         ) : (
           <div className="col-span-3 py-20 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-dashed border-slate-200">
                 <Camera size={32} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">شارك صورك المهنية الأولى</p>
           </div>
         )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
           <header className="px-6 py-4 flex items-center justify-between border-b sticky top-0 bg-white z-10">
              <button onClick={() => setShowEditModal(false)} className="text-slate-900 font-bold text-sm">إلغاء</button>
              <h3 className="font-black text-slate-900 text-sm">تعديل الملف الشخصي</h3>
              <button 
                onClick={handleUpdate} 
                disabled={loading}
                className={`text-blue-600 font-black text-sm flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}
              >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : saveSuccess ? <CheckCircle size={16} /> : "تم"}
              </button>
           </header>

           <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
              <div className="p-8 flex flex-col items-center bg-white border-b mb-6">
                 <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-100 relative shadow-inner">
                       {uploadingImage && <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10"><Loader2 className="animate-spin text-blue-600" /></div>}
                       <img src={formData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&size=256`} className="w-full h-full object-cover" />
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-white shadow-xl p-2 rounded-full border border-slate-100 text-blue-600 active:scale-90 transition-all">
                       <Camera size={16} />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                 </div>
                 <button onClick={() => fileInputRef.current?.click()} className="text-blue-600 text-[10px] font-black uppercase">تغيير صورة الحساب</button>
              </div>

              <div className="space-y-1 bg-white border-y">
                 <div className="flex items-center px-6 py-4 gap-4 border-b">
                    <label className="w-24 text-[10px] font-black text-slate-400 uppercase">الاسم الكامل</label>
                    <input type="text" className="flex-1 text-sm font-bold text-slate-900 outline-none" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                 </div>
                 <div className="flex items-start px-6 py-4 gap-4 border-b">
                    <label className="w-24 text-[10px] font-black text-slate-400 uppercase pt-1">نبذة مهنية</label>
                    <textarea className="flex-1 text-sm font-bold text-slate-900 outline-none h-24 resize-none py-1 leading-relaxed" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="صف تخصصك وخدماتك للزملاء..." />
                 </div>
              </div>

              <div className="mt-8 px-6 mb-2 flex items-center gap-2">
                 <CreditCard size={12} className="text-blue-600" />
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المعلومات المالية والبنكية</h4>
              </div>
              <div className="bg-white border-y divide-y">
                 <div className="px-6 py-6 space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Database size={16} /></div>
                       <label className="text-xs font-black text-slate-900 uppercase">رقم الحساب البنكي (RIB)</label>
                    </div>
                    <div className="relative">
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-black text-slate-700 outline-none h-24 text-center tracking-[0.2em] text-sm focus:ring-2 focus:ring-blue-500/10 transition-all" 
                        placeholder="000 000 0000000000000000 00" 
                        value={formData.bankAccount} 
                        onChange={e => setFormData({...formData, bankAccount: e.target.value})} 
                      />
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-2xl flex items-start gap-3">
                       <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                       <p className="text-[10px] text-blue-800 font-bold leading-relaxed">رقم الـ RIB ضروري لتحويل أرباحك. يظهر فقط للمدير (Admin) عند طلبك لعملية سحب الرصيد.</p>
                    </div>
                 </div>
              </div>

              <div className="mt-8 px-6 mb-2 flex items-center gap-2">
                 <Globe size={12} className="text-emerald-600" />
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">روابط التواصل الاجتماعي</h4>
              </div>
              <div className="bg-white border-y divide-y">
                 <div className="flex items-center px-6 py-4 gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm"><Phone size={18}/></div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">واتساب</p>
                       <input type="text" className="w-full text-sm font-bold text-slate-900 outline-none truncate" value={formData.socialLinks?.whatsapp} onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, whatsapp: e.target.value}})} placeholder="06XXXXXXXX" />
                    </div>
                 </div>
                 <div className="flex items-center px-6 py-4 gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 shadow-sm"><Instagram size={18}/></div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">إنستغرام</p>
                       <input type="text" className="w-full text-sm font-bold text-slate-900 outline-none truncate" value={formData.socialLinks?.instagram} onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, instagram: e.target.value}})} placeholder="اسم المستخدم أو الرابط" />
                    </div>
                 </div>
                 <div className="flex items-center px-6 py-4 gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm"><Facebook size={18}/></div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">فيسبوك</p>
                       <input type="text" className="w-full text-sm font-bold text-slate-900 outline-none truncate" value={formData.socialLinks?.facebook} onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, facebook: e.target.value}})} placeholder="رابط الصفحة الشخصية" />
                    </div>
                 </div>
              </div>

              <div className="p-10 flex flex-col items-center gap-6">
                 <button onClick={onLogout} className="text-red-500 font-black text-sm flex items-center gap-2 hover:bg-red-50 px-6 py-3 rounded-2xl transition-all">
                    <LogOut size={18} /> تسجيل الخروج من الحساب
                 </button>
                 <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">TangerHub v1.0.0</p>
              </div>
           </main>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
