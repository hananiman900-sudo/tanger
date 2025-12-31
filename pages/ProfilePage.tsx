
import React, { useState, useRef, useEffect } from 'react';
import { User, Language, Post } from '../types';
import { 
  Camera, MapPin, Settings, LogOut, Share2, Wallet, Instagram, Facebook, Phone, Save, Loader2, X, CheckCircle, Info, Database, AlertCircle, Linkedin, Building2, Layers, Grid, List, MessageCircle, Globe, Edit3, Heart, MessageSquare
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
    setFormData({
      fullName: user.fullName,
      profileImage: user.profileImage,
      bankAccount: user.bankAccount,
      socialLinks: user.socialLinks || { facebook: '', instagram: '', whatsapp: '', linkedin: '' },
      activeHours: user.activeHours || '',
      gpsLocation: user.gpsLocation || '',
      description: user.description || ''
    });
    fetchUserPosts();
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
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
               <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-100">
                 <img 
                   src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0D8ABC&color=fff`} 
                   className="w-full h-full object-cover"
                 />
               </div>
            </div>
          </div>
          
          <div className="flex-1 flex justify-around items-center text-center">
             <div>
                <p className="font-black text-slate-900 text-sm md:text-lg">{userPosts.length}</p>
                <p className="text-[10px] text-slate-500 font-bold">منشورات</p>
             </div>
             <div>
                <p className="font-black text-slate-900 text-sm md:text-lg">{user.referralCount || 0}</p>
                <p className="text-[10px] text-slate-500 font-bold">إحالات</p>
             </div>
             <div>
                <p className="font-black text-slate-900 text-sm md:text-lg text-emerald-600">{user.balanceCompleted} <span className="text-[8px]">DH</span></p>
                <p className="text-[10px] text-slate-500 font-bold">الرصيد</p>
             </div>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mb-6">
           <h3 className="font-black text-slate-900 text-sm mb-0.5">{user.fullName}</h3>
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-wide mb-2 flex items-center gap-1">
             <Layers size={10} className="text-blue-600" /> {user.specialty}
           </p>
           <p className="text-xs font-bold text-slate-600 leading-relaxed whitespace-pre-wrap max-w-sm">
             {user.description || "لا يوجد وصف مهني متاح حالياً."}
           </p>
           {user.neighborhood && (
             <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mt-2">
                <MapPin size={10} /> <span>{user.neighborhood} • الطابق {user.floor}</span>
             </div>
           )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-8">
           <button 
             onClick={() => setShowEditModal(true)}
             className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 py-2.5 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2"
           >
             <Edit3 size={14} /> تعديل الملف الشخصي
           </button>
           <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 py-2.5 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2">
             <Share2 size={14} /> مشاركة
           </button>
           <button onClick={onLogout} className="bg-red-50 text-red-500 p-2.5 rounded-lg hover:bg-red-100 transition-all">
             <LogOut size={16} />
           </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-t border-slate-100">
         <button className="flex-1 py-4 flex justify-center border-t-2 border-slate-900 text-slate-900">
            <Grid size={20} />
         </button>
         <button className="flex-1 py-4 flex justify-center text-slate-300">
            <List size={20} />
         </button>
         <button className="flex-1 py-4 flex justify-center text-slate-300">
            <Settings size={20} />
         </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-0.5">
         {fetchingPosts ? (
           Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="aspect-square bg-slate-100 animate-pulse"></div>
           ))
         ) : userPosts.length > 0 ? (
           userPosts.map(post => (
             <div key={post.id} className="aspect-square relative group overflow-hidden bg-slate-100">
                <img src={post.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                   <div className="flex items-center gap-1 font-black text-xs"><Heart size={14} fill="white" /> 0</div>
                   <div className="flex items-center gap-1 font-black text-xs"><MessageSquare size={14} fill="white" /> 0</div>
                </div>
             </div>
           ))
         ) : (
           <div className="col-span-3 py-20 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                 <Camera size={32} />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase">لا توجد صور منشورة بعد</p>
           </div>
         )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
           <header className="px-6 py-4 flex items-center justify-between border-b sticky top-0 bg-white z-10">
              <button onClick={() => setShowEditModal(false)} className="text-slate-900 font-bold text-sm">إلغاء</button>
              <h3 className="font-black text-slate-900 text-sm">تعديل الملف</h3>
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
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-100 relative">
                       {uploadingImage && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>}
                       <img src={formData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&size=256`} className="w-full h-full object-cover" />
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-white shadow-xl p-2 rounded-full border border-slate-100 text-blue-600">
                       <Camera size={16} />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                 </div>
                 <button onClick={() => fileInputRef.current?.click()} className="text-blue-600 text-xs font-black">تغيير صورة الملف الشخصي</button>
              </div>

              <div className="space-y-1 bg-white border-y">
                 <div className="flex items-center px-6 py-4 gap-4 border-b">
                    <label className="w-24 text-xs font-bold text-slate-900">الاسم الكامل</label>
                    <input type="text" className="flex-1 text-sm font-medium outline-none" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                 </div>
                 <div className="flex items-center px-6 py-4 gap-4 border-b">
                    <label className="w-24 text-xs font-bold text-slate-900">نبذة</label>
                    <textarea className="flex-1 text-sm font-medium outline-none h-20 resize-none py-1" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                 </div>
              </div>

              <div className="mt-8 px-6 mb-2">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المعلومات المهنية والبنكية</h4>
              </div>
              <div className="bg-white border-y divide-y">
                 <div className="px-6 py-4 space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                       <Wallet size={16} className="text-blue-600" />
                       <label className="text-xs font-black text-slate-900 uppercase">رقم الحساب البنكي (RIB)</label>
                    </div>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 font-black text-slate-700 outline-none h-20 text-center tracking-widest text-sm" 
                      placeholder="000 000 0000000000000000 00" 
                      value={formData.bankAccount} 
                      onChange={e => setFormData({...formData, bankAccount: e.target.value})} 
                    />
                    <p className="text-[9px] text-slate-400 font-bold leading-relaxed px-1">هذا الرقم يظهر فقط للمدير (Admin) لتسهيل عملية إرسال أرباحك عند طلب السحب.</p>
                 </div>
              </div>

              <div className="mt-8 px-6 mb-2">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">روابط التواصل</h4>
              </div>
              <div className="bg-white border-y divide-y">
                 <div className="flex items-center px-6 py-4 gap-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Phone size={14}/></div>
                    <div className="flex-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase">واتساب</p>
                       <input type="text" className="w-full text-sm font-medium outline-none" value={formData.socialLinks?.whatsapp} onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, whatsapp: e.target.value}})} placeholder="06XXXXXXXX" />
                    </div>
                 </div>
                 <div className="flex items-center px-6 py-4 gap-4">
                    <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0"><Instagram size={14}/></div>
                    <div className="flex-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase">إنستغرام</p>
                       <input type="text" className="w-full text-sm font-medium outline-none" value={formData.socialLinks?.instagram} onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, instagram: e.target.value}})} placeholder="اسم المستخدم" />
                    </div>
                 </div>
                 <div className="flex items-center px-6 py-4 gap-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Facebook size={14}/></div>
                    <div className="flex-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase">فيسبوك</p>
                       <input type="text" className="w-full text-sm font-medium outline-none" value={formData.socialLinks?.facebook} onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, facebook: e.target.value}})} placeholder="رابط الصفحة" />
                    </div>
                 </div>
              </div>

              <div className="p-8 flex justify-center">
                 <button onClick={onLogout} className="text-red-500 font-black text-sm flex items-center gap-2">
                    <LogOut size={16} /> تسجيل الخروج
                 </button>
              </div>
           </main>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
