
import React, { useState, useRef, useEffect } from 'react';
import { User, Language } from '../types';
import { 
  Camera, MapPin, Settings, LogOut, ChevronRight, Share2, Wallet, Instagram, Facebook, Phone, Save, Loader2, X, CheckCircle, AlertTriangle, Info, Database, AlertCircle, Linkedin, Building2, Layers, Hash
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
  const [editMode, setEditMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorReason, setErrorReason] = useState<string | null>(null);
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
  }, [user]);

  const handleUpdate = async () => {
    if (loading) return;
    
    setLoading(true);
    setSaveSuccess(false);
    setErrorReason(null);

    try {
      const updateData = {
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
        setEditMode(false);
        setLoading(false);
      }, 1500);

    } catch (err: any) {
      console.error("Update Error:", err);
      setErrorReason(err.message || "حدث خطأ أثناء حفظ البيانات");
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    setErrorReason(null);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, profileImage: publicUrl }));
      
      await supabase.from('profiles').update({ profile_image: publicUrl }).eq('id', user.id);
      await onUpdate();
      
    } catch (err: any) {
      setErrorReason(lang === 'ar' ? "فشل رفع الصورة: " + err.message : "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-full overflow-y-auto pb-32" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white px-6 pb-12 pt-10 rounded-b-[60px] shadow-sm relative overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        
        <div className="flex justify-between items-center mb-10 relative z-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">إعدادات الحساب</h2>
          <div className="flex gap-2">
            {editMode && <button onClick={() => setEditMode(false)} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs">إلغاء</button>}
            <button 
              onClick={() => editMode ? handleUpdate() : setEditMode(true)} 
              disabled={loading}
              className={`px-8 py-3 rounded-2xl font-black text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg ${editMode ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-slate-900 text-white shadow-slate-200'}`}
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : saveSuccess ? <CheckCircle size={16}/> : editMode ? <Save size={16} /> : <Settings size={16} />}
              {editMode ? "حفظ التغييرات" : "تعديل الملف"}
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center relative z-10">
          <div className="relative mb-6">
            <div className="w-36 h-36 rounded-[50px] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 flex items-center justify-center relative">
              {uploadingImage && <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10"><Loader2 className="animate-spin text-blue-600" /></div>}
              <img src={formData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&size=256&background=0D8ABC&color=fff`} className="w-full h-full object-cover" />
            </div>
            {editMode && (
              <>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-[-10px] right-[-10px] bg-blue-600 p-4 rounded-2xl text-white shadow-xl border-4 border-white active:scale-90 transition-all"><Camera size={20} /></button>
              </>
            )}
          </div>
          
          <div className="text-center w-full max-w-sm">
             <h3 className="text-3xl font-black text-slate-900">{user.fullName}</h3>
             <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">{user.specialty}</p>
             <div className="flex items-center justify-center gap-2 mt-3">
                <span className="bg-slate-50 text-slate-400 font-black text-[9px] px-3 py-1 rounded-full flex items-center gap-1"><MapPin size={10}/> {user.neighborhood}</span>
                <span className="bg-slate-50 text-slate-400 font-black text-[9px] px-3 py-1 rounded-full flex items-center gap-1"><Layers size={10}/> ط {user.floor}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {errorReason && (
          <div className="bg-red-50 border-2 border-red-100 p-5 rounded-[30px] flex items-center gap-4 text-red-700 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="shrink-0" />
            <p className="text-sm font-bold">{errorReason}</p>
          </div>
        )}

        <section className="bg-white rounded-[45px] p-10 shadow-sm border border-slate-100 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <h4 className="font-black text-slate-900 flex items-center gap-3 text-lg"><Info size={22} className="text-blue-600" /> النبذة المهنية</h4>
          </div>
          <textarea 
            disabled={!editMode} 
            className="w-full bg-slate-50 border border-slate-100 rounded-[30px] p-6 font-bold text-slate-600 outline-none h-40 focus:ring-4 focus:ring-blue-600/5 transition-all" 
            placeholder="اكتب نبذة عن خدماتك المهنية هنا..." 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
          />
        </section>

        <section className="bg-white rounded-[45px] p-10 shadow-sm space-y-8 border border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <h4 className="font-black text-slate-900 flex items-center gap-3 text-lg"><Share2 size={22} className="text-blue-600" /> روابط التواصل الاجتماعي</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">واتساب</label>
              <div className="flex items-center gap-4 group">
                <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 group-focus-within:bg-emerald-600 group-focus-within:text-white transition-all"><Phone size={20}/></div>
                <input disabled={!editMode} className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" value={formData.socialLinks?.whatsapp} onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, whatsapp: e.target.value}})} placeholder="06XXXXXXXX" />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">إنستغرام</label>
              <div className="flex items-center gap-4 group">
                <div className="bg-pink-50 p-4 rounded-2xl text-pink-600 group-focus-within:bg-pink-600 group-focus-within:text-white transition-all"><Instagram size={20}/></div>
                <input disabled={!editMode} className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-pink-500/5 transition-all" value={formData.socialLinks?.instagram} onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, instagram: e.target.value}})} placeholder="Link to profile" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[45px] p-10 shadow-sm border border-slate-100 space-y-6">
           <div className="flex items-center gap-3"><div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><Wallet size={20} /></div><h4 className="font-black text-slate-900 text-lg">الحساب البنكي (RIB)</h4></div>
           <textarea disabled={!editMode} className="w-full bg-slate-50 border border-slate-100 rounded-[30px] p-8 font-black text-slate-700 outline-none h-32 text-center text-xl tracking-widest" placeholder="000 000 000000000000000 00" value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} />
        </section>

        <button onClick={onLogout} className="w-full flex items-center justify-between p-8 bg-red-50 text-red-600 rounded-[40px] hover:bg-red-600 hover:text-white transition-all group shadow-sm border border-red-100">
          <div className="flex items-center gap-5"><div className="bg-white p-4 rounded-2xl group-hover:bg-red-700 group-hover:text-white transition-all shadow-sm"><LogOut size={24} /></div><span className="font-black text-lg">تسجيل الخروج من الحساب</span></div>
          <ChevronRight size={24} className={lang === 'ar' ? 'rotate-180' : ''} />
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
