
import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Building, Briefcase, ChevronDown, 
  Loader2, Zap, CheckCircle2, ClipboardList, X, AlertCircle, Award, User as UserIcon, Instagram, Facebook, Linkedin, Phone, Map as MapIcon, Calendar, Image as ImageIcon, Grid, List, Share2, ExternalLink, Maximize2
} from 'lucide-react';
import { User as UserType, Language, Post } from '../types';
import { translations } from '../translations';
import { supabase } from '../supabase';
import { NEIGHBORHOODS } from '../constants';

interface SearchPageProps {
  user: UserType;
  lang: Language;
}

const SearchPage: React.FC<SearchPageProps> = ({ user, lang }) => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Modals
  const [referModal, setReferModal] = useState<any | null>(null);
  const [viewProfile, setViewProfile] = useState<any | null>(null);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Form
  const [patientName, setPatientName] = useState('');
  const [patientCondition, setPatientCondition] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const t = translations[lang];

  useEffect(() => { fetchResults(); }, [selectedNeighborhood, selectedSpecialty]);

  const fetchResults = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*').eq('status', 'ACTIVE').neq('id', user.id).order('referral_count', { ascending: false });
    if (selectedNeighborhood) query = query.eq('neighborhood', NEIGHBORHOODS.find(n => n.id === selectedNeighborhood)?.name);
    if (selectedSpecialty) query = query.eq('specialty', selectedSpecialty);
    const { data } = await query;
    setProfessionals(data || []);
    setLoading(false);
  };

  const fetchProfileDetails = async (prof: any) => {
    setFetchingProfile(true);
    setViewProfile(prof);
    try {
      const { data } = await supabase.from('posts').select('*').eq('user_id', prof.id).order('created_at', { ascending: false });
      setProfilePosts(data || []);
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleSendReferral = async () => {
    if (!patientName) return;
    setSubmitting(true);
    const code = `TGR${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const { error } = await supabase.from('referrals').insert([{
        referrer_id: user.id,
        receiver_id: referModal.id,
        patient_name: patientName,
        patient_condition: patientCondition,
        code, status: 'PENDING'
      }]);
      if (!error) setGeneratedCode(code);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]" dir={t.dir}>
      <div className="bg-white px-6 pt-10 pb-8 border-b rounded-b-[50px] shadow-sm z-20 space-y-6">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">إرسال إحالة</h2>
        <div className="grid grid-cols-2 gap-3">
          <select value={selectedNeighborhood} onChange={e => setSelectedNeighborhood(e.target.value)} className="bg-slate-50 border-0 rounded-2xl py-4 px-4 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600/10 transition-all">
            <option value="">جميع المناطق</option>
            {NEIGHBORHOODS.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          <select value={selectedSpecialty} onChange={e => setSelectedSpecialty(e.target.value)} className="bg-slate-50 border-0 rounded-2xl py-4 px-4 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600/10 transition-all">
            <option value="">جميع التخصصات</option>
            <option value="General Medicine">General Medicine</option>
            <option value="Dentistry">Dentistry</option>
            <option value="Law Firm">Law Firm</option>
            <option value="IT Services">IT Services</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={40}/>
            <p className="text-slate-400 font-bold">جاري البحث عن الزملاء...</p>
          </div>
        ) : professionals.map(res => (
          <div key={res.id} className="bg-white rounded-[35px] p-5 shadow-sm border border-slate-100 flex items-center justify-between gap-4 group hover:border-blue-600 transition-all cursor-pointer" onClick={() => fetchProfileDetails(res)}>
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="shrink-0 relative">
                <img src={res.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(res.full_name)}`} className="w-14 h-14 rounded-2xl object-cover border-2 border-transparent group-hover:border-blue-600 transition-all shadow-sm"/>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 text-sm truncate">{res.full_name}</h4>
                <p className="text-[10px] text-blue-600 font-bold uppercase truncate tracking-widest">{res.specialty}</p>
              </div>
            </div>
            <div className="flex gap-2">
               <button className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all"><UserIcon size={18} /></button>
               <button onClick={(e) => { e.stopPropagation(); setReferModal(res); }} className="px-5 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-slate-100 active:scale-95 transition-all">إحالة</button>
            </div>
          </div>
        ))}
        {professionals.length === 0 && !loading && (
          <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest">لا يوجد زملاء مطابقين للبحث</div>
        )}
      </div>

      {/* MODAL: FULL-SCREEN INSTAGRAM-STYLE PROFILE */}
      {viewProfile && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
          {/* Mobile Header Style */}
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <button onClick={() => setViewProfile(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X size={24} className="text-slate-900"/></button>
            <span className="font-black text-slate-900 text-sm tracking-tight">{viewProfile.full_name}</span>
            <button className="p-2 opacity-0 pointer-events-none"><X/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
            {/* Top Info Section */}
            <div className="px-6 pt-10 pb-12 max-w-4xl mx-auto w-full">
               <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-right">
                  {/* Profile Pic */}
                  <div className="w-28 h-28 md:w-40 md:h-40 rounded-full border-2 border-slate-100 p-1 shrink-0 shadow-xl bg-slate-50">
                     <img src={viewProfile.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewProfile.full_name)}&size=256`} className="w-full h-full rounded-full object-cover" />
                  </div>

                  {/* Stats & Info */}
                  <div className="flex-1 space-y-6">
                     <div className="flex flex-col md:flex-row items-center gap-4">
                        <h3 className="text-2xl font-black text-slate-900">{viewProfile.full_name}</h3>
                        <div className="flex gap-2">
                           <button onClick={() => setReferModal(viewProfile)} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">إرسال إحالة</button>
                           {viewProfile.social_links?.whatsapp && (
                             <a href={`https://wa.me/${viewProfile.social_links.whatsapp}`} target="_blank" className="p-2.5 bg-slate-100 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                                <Phone size={18}/>
                             </a>
                           )}
                        </div>
                     </div>

                     <div className="flex justify-center md:justify-start gap-12 text-sm border-t border-b py-4 md:border-0 md:py-0">
                        <div className="text-center">
                           <p className="font-black text-slate-900 text-xl leading-none">{profilePosts.length}</p>
                           <p className="text-slate-400 text-[10px] font-black uppercase mt-1">منشور</p>
                        </div>
                        <div className="text-center">
                           <p className="font-black text-slate-900 text-xl leading-none">{viewProfile.referral_count || 0}</p>
                           <p className="text-slate-400 text-[10px] font-black uppercase mt-1">إحالة ناجحة</p>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <p className="font-black text-blue-600 text-sm tracking-wide">{viewProfile.specialty}</p>
                        <p className="text-slate-500 text-xs font-bold leading-relaxed max-w-sm">{viewProfile.active_hours || 'توقيت العمل: غير متوفر حالياً'}</p>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">
                           <MapPin size={12} className="text-blue-600" />
                           <span>{viewProfile.neighborhood} • {viewProfile.building_id}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Action Grid Buttons (Full width like IG) */}
               <div className="mt-10 grid grid-cols-2 gap-3 md:max-w-xs md:mr-auto">
                  {viewProfile.gps_location && (
                    <a href={viewProfile.gps_location} target="_blank" className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-100 py-3 rounded-xl text-slate-600 font-black text-[10px] uppercase hover:bg-blue-50 hover:text-blue-600 transition-all">
                       <MapIcon size={14}/> الموقع
                    </a>
                  )}
                  {viewProfile.social_links?.instagram && (
                    <a href={viewProfile.social_links.instagram} target="_blank" className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-100 py-3 rounded-xl text-slate-600 font-black text-[10px] uppercase hover:bg-pink-50 hover:text-pink-600 transition-all">
                       <Instagram size={14}/> إنستغرام
                    </a>
                  )}
               </div>
            </div>

            {/* Posts Tab Header */}
            <div className="border-t">
               <div className="flex justify-center py-4">
                  <button className="flex items-center gap-2 border-t-2 border-slate-900 pt-4 -mt-4 text-slate-900 animate-in fade-in">
                     <Grid size={20}/>
                     <span className="text-[10px] font-black uppercase tracking-[0.3em]">المنشورات</span>
                  </button>
               </div>

               {/* Grid View */}
               <div className="grid grid-cols-3 gap-0.5 md:gap-4 md:px-10 max-w-5xl mx-auto">
                  {fetchingProfile ? (
                     <div className="col-span-3 py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>
                  ) : profilePosts.length > 0 ? profilePosts.map(post => (
                     <div key={post.id} className="relative aspect-square group overflow-hidden cursor-pointer" onClick={() => setSelectedImage(post.image_url)}>
                        <img src={post.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-4 text-center">
                           <Maximize2 className="text-white mb-2" size={24}/>
                           <p className="text-[8px] text-white font-bold line-clamp-2 hidden md:block">{post.content}</p>
                        </div>
                     </div>
                  )) : (
                     <div className="col-span-3 py-24 text-center flex flex-col items-center justify-center text-slate-300">
                        <ImageIcon size={48} className="mb-4 opacity-30" />
                        <p className="font-black text-xs uppercase tracking-widest">لا توجد منشورات حالياً</p>
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX: FULL IMAGE PREVIEW */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}>
           <button className="absolute top-10 right-10 text-white p-2 hover:bg-white/10 rounded-full transition-all"><X size={32}/></button>
           <div className="relative max-w-full max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
              <img src={selectedImage} className="max-w-full max-h-[90vh] object-contain animate-in zoom-in duration-300" />
           </div>
        </div>
      )}

      {/* REFERRAL MODAL */}
      {referModal && !generatedCode && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[50px] p-10 space-y-8 shadow-2xl animate-in zoom-in duration-300">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2"><ClipboardList size={32} /></div>
                <h3 className="text-2xl font-black text-slate-900">إحالة مريض</h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">للزميل: <span className="text-blue-600">{referModal.full_name}</span></p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">إسم المريض الكامل</label>
                   <input type="text" placeholder="مثال: محمد العلمي" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-bold outline-none focus:ring-4 focus:ring-blue-600/10 transition-all" value={patientName} onChange={e => setPatientName(e.target.value)} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">وصف الحالة أو الخدمة</label>
                   <textarea placeholder="ما هو الإجراء المطلوب؟" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-bold h-28 outline-none focus:ring-4 focus:ring-blue-600/10 transition-all" value={patientCondition} onChange={e => setPatientCondition(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handleSendReferral} disabled={submitting || !patientName} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-blue-500/20 disabled:opacity-50 active:scale-95 transition-all">
                  {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'تأكيد الإرسال وتوليد الكود'}
                </button>
                <button onClick={() => setReferModal(null)} className="w-full text-slate-400 font-bold py-2 hover:text-slate-600">إلغاء</button>
              </div>
           </div>
        </div>
      )}

      {/* SUCCESS CODE MODAL */}
      {generatedCode && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[160] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[50px] p-12 text-center space-y-8 animate-in zoom-in duration-500 shadow-2xl">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[30px] flex items-center justify-center mx-auto mb-2"><CheckCircle2 size={48} /></div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black text-slate-900">تم إرسال الإحالة!</h3>
                 <p className="text-slate-500 font-bold text-sm">شارك هذا الكود مع المريض لتقديمه للمهني</p>
              </div>
              <div className="bg-slate-900 text-white py-12 rounded-[40px] text-5xl font-black tracking-[0.2em] uppercase shadow-2xl shadow-slate-300 animate-pulse">{generatedCode}</div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-4">يرجى من الزميل المستقبل إدخال هذا الكود فور وصول المريض لتفعيل العمولة</p>
              <button onClick={() => { setGeneratedCode(null); setReferModal(null); setViewProfile(null); }} className="w-full bg-slate-100 text-slate-900 py-5 rounded-3xl font-black hover:bg-slate-200 transition-all active:scale-95">إغلاق النافذة</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
