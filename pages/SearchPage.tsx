
import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Building, Briefcase, ChevronDown, 
  Loader2, Zap, CheckCircle2, ClipboardList, X, AlertCircle, Award, User as UserIcon, Instagram, Facebook, Linkedin, Phone, Map as MapIcon, Calendar, Image as ImageIcon, Grid, List, Share2, ExternalLink, Maximize2, MessageCircle, Clock, Globe, Info, Microscope, Scale, Landmark,
  PlusCircle, Layers, Hash, Filter, ChevronUp
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
  const [categories, setCategories] = useState<any[]>([]);
  const [subSpecialties, setSubSpecialties] = useState<any[]>([]);
  const [dbBuildings, setDbBuildings] = useState<any[]>([]);
  
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubSpecialtyId, setSelectedSubSpecialtyId] = useState<string>('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  
  const [referModal, setReferModal] = useState<any | null>(null);
  const [viewProfile, setViewProfile] = useState<any | null>(null);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'posts'>('info');

  const [patientName, setPatientName] = useState('');
  const [patientCondition, setPatientCondition] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const t = translations[lang];

  useEffect(() => {
    const fetchData = async () => {
      const { data: cats } = await supabase.from('business_categories').select('*').order('name_ar');
      const { data: blds } = await supabase.from('buildings').select('*').order('name');
      if (cats) {
        const unique = cats.filter((v, i, a) => a.findIndex(t => t.name_fr === v.name_fr) === i);
        setCategories(unique);
      }
      if (blds) setDbBuildings(blds);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSubs = async () => {
      if (!selectedCategoryId) {
        setSubSpecialties([]);
        setSelectedSubSpecialtyId('');
        return;
      }
      const category = categories.find(c => c.id === selectedCategoryId);
      if (category?.has_sub_specialties) {
        const { data } = await supabase.from('sub_specialties').select('*').eq('category_id', selectedCategoryId).order('name_ar');
        if (data) {
          const uniqueSubs = data.filter((v, i, a) => a.findIndex(t => t.name_fr === v.name_fr) === i);
          setSubSpecialties(uniqueSubs);
        }
      } else {
        setSubSpecialties([]);
        setSelectedSubSpecialtyId('');
      }
    };
    fetchSubs();
  }, [selectedCategoryId, categories]);

  useEffect(() => { 
    fetchResults(); 
    // طي الفلاتر تلقائياً عند وجود نتائج كثيرة
    if (professionals.length > 2) {
      setFiltersExpanded(false);
    }
  }, [selectedNeighborhood, selectedCategoryId, selectedSubSpecialtyId, selectedBuildingId, selectedFloor, selectedOffice]);

  const fetchResults = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*')
      .eq('status', 'ACTIVE')
      .neq('id', user.id)
      .order('referral_count', { ascending: false });

    if (selectedNeighborhood) {
      const nName = NEIGHBORHOODS.find(n => n.id === selectedNeighborhood)?.name;
      if (nName) query = query.eq('neighborhood', nName);
    }
    if (selectedCategoryId) query = query.eq('category_id', selectedCategoryId);
    if (selectedSubSpecialtyId) query = query.eq('sub_specialty_id', selectedSubSpecialtyId);
    if (selectedBuildingId) query = query.eq('building_id', selectedBuildingId);
    if (selectedFloor) query = query.eq('floor', selectedFloor);
    if (selectedOffice) query = query.eq('office_number', selectedOffice);

    const { data } = await query;
    setProfessionals(data || []);
    setLoading(false);
  };

  const fetchProfileDetails = async (prof: any) => {
    setFetchingProfile(true);
    setViewProfile(prof);
    setActiveTab('info');
    try {
      const { data: postsData } = await supabase.from('posts').select('*').eq('user_id', prof.id).order('created_at', { ascending: false });
      setProfilePosts(postsData || []);
    } finally { setFetchingProfile(false); }
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
      
      if (!error) {
        await supabase.from('notifications').insert([{
          user_id: referModal.id,
          title: lang === 'ar' ? '🚑 إحالة مريض جديدة' : 'New Patient Referral',
          message: lang === 'ar' 
            ? `قام ${user.fullName} بإرسال مريض لك (${patientName}). الكود في انتظار وصوله.` 
            : `${user.fullName} sent you a patient (${patientName}). Awaiting patient arrival.`,
          type: 'REFERRAL'
        }]);
        setGeneratedCode(code);
      }
    } finally { setSubmitting(false); }
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const showSubSelect = selectedCategory?.has_sub_specialties;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]" dir={t.dir}>
      {/* Search Header Container */}
      <div className="bg-white px-6 pt-8 pb-4 border-b rounded-b-[40px] shadow-sm z-20 space-y-4 sticky top-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">إرسال إحالة</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">ابحث عن زميل لتعاونه</p>
          </div>
          <button 
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className={`p-3 rounded-2xl transition-all flex items-center gap-2 ${filtersExpanded ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}
          >
            {filtersExpanded ? <ChevronUp size={20} /> : <Filter size={20} />}
            <span className="text-[10px] font-black uppercase">{filtersExpanded ? 'إخفاء الفلاتر' : 'تعديل البحث'}</span>
          </button>
        </div>
        
        {/* Collapsible Filters Section */}
        {filtersExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 animate-in slide-in-from-top-4 duration-300">
            <div className="relative">
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select value={selectedNeighborhood} onChange={e => { setSelectedNeighborhood(e.target.value); setSelectedBuildingId(''); }} className="w-full bg-slate-50 border-0 rounded-2xl py-4 pr-10 pl-4 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600/10 transition-all appearance-none">
                <option value="">جميع الأحياء</option>
                {NEIGHBORHOODS.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>

            <div className="relative">
              <Building className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select value={selectedBuildingId} onChange={e => setSelectedBuildingId(e.target.value)} className="w-full bg-slate-50 border-0 rounded-2xl py-4 pr-10 pl-4 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600/10 transition-all appearance-none">
                <option value="">جميع العمارات</option>
                {dbBuildings.filter(b => !selectedNeighborhood || b.neighborhood_id === selectedNeighborhood).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select value={selectedCategoryId} onChange={e => { setSelectedCategoryId(e.target.value); setSelectedSubSpecialtyId(''); }} className="w-full bg-slate-50 border-0 rounded-2xl py-4 pr-10 pl-4 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600/10 transition-all appearance-none">
                <option value="">جميع التخصصات</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{lang === 'ar' ? cat.name_ar : cat.name_fr}</option>)}
              </select>
            </div>

            {showSubSelect && (
              <div className="relative animate-in slide-in-from-top-2">
                <PlusCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" size={16} />
                <select value={selectedSubSpecialtyId} onChange={e => setSelectedSubSpecialtyId(e.target.value)} className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl py-4 pr-10 pl-4 font-black text-xs text-blue-700 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all appearance-none">
                  <option value="">اختر التخصص الدقيق</option>
                  {subSpecialties.map(sub => <option key={sub.id} value={sub.id}>{lang === 'ar' ? sub.name_ar : sub.name_fr}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={40}/>
            <p className="text-slate-400 font-bold">جاري البحث عن الزملاء...</p>
          </div>
        ) : professionals.length > 0 ? (
          <>
            <div className="flex items-center justify-between px-2 mb-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نتائج البحث ({professionals.length})</span>
            </div>
            {professionals.map(res => (
              <div key={res.id} className="bg-white rounded-[30px] p-5 shadow-sm border border-slate-100 flex items-center justify-between gap-4 group hover:border-blue-600 transition-all cursor-pointer" onClick={() => fetchProfileDetails(res)}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <img src={res.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(res.full_name)}`} className="w-14 h-14 rounded-2xl object-cover shadow-sm"/>
                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg shadow-sm border border-slate-50">
                       <Award size={10} className="text-amber-500" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-900 text-sm truncate">{res.full_name}</h4>
                    <div className="flex items-center gap-2">
                       <p className="text-[10px] text-blue-600 font-black uppercase truncate tracking-widest">{res.specialty}</p>
                       <span className="text-slate-300 text-[10px]">•</span>
                       <p className="text-[10px] text-slate-400 font-bold">ط {res.floor}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setReferModal(res); }} 
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-slate-100 active:scale-95 transition-all"
                >
                  إحالة
                </button>
              </div>
            ))}
          </>
        ) : (
          <div className="py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
             <Search size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold">لا يوجد نتائج حالياً، حاول تغيير خيارات البحث</p>
             <button onClick={() => setFiltersExpanded(true)} className="text-blue-600 font-black text-xs mt-4 hover:underline">إظهار خيارات البحث</button>
          </div>
        )}
      </div>

      {/* Modals same as before... */}
      {viewProfile && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
          <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
            <button onClick={() => setViewProfile(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X size={24} className="text-slate-900"/></button>
            <div className="text-center">
               <span className="font-black text-slate-900 text-sm block leading-none">{viewProfile.full_name}</span>
            </div>
            <div className="w-10"></div>
          </header>
          <div className="flex-1 overflow-y-auto bg-slate-50">
             <div className="p-6">
                <div className="bg-white rounded-[40px] p-8 text-center space-y-6 shadow-sm border border-slate-100">
                   <img src={viewProfile.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewProfile.full_name)}&size=256`} className="w-32 h-32 rounded-[40px] mx-auto border-4 border-slate-50 shadow-xl object-cover" />
                   <h3 className="text-2xl font-black text-slate-900">{viewProfile.full_name}</h3>
                   <div className="flex flex-wrap justify-center gap-2">
                      <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black">{viewProfile.specialty}</span>
                      <span className="bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-black">{viewProfile.neighborhood}</span>
                   </div>
                   <button onClick={() => setReferModal(viewProfile)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 active:scale-95 transition-all">إرسال إحالة</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {referModal && !generatedCode && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[50px] p-10 space-y-8 shadow-2xl animate-in zoom-in duration-300">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2"><ClipboardList size={32} /></div>
                <h3 className="text-2xl font-black text-slate-900">إحالة مريض</h3>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="إسم المريض الكامل" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-bold outline-none" value={patientName} onChange={e => setPatientName(e.target.value)} />
                <textarea placeholder="وصف الحالة" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-bold h-28 outline-none" value={patientCondition} onChange={e => setPatientCondition(e.target.value)} />
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handleSendReferral} disabled={submitting || !patientName} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black active:scale-95 transition-all">تأكيد الإرسال</button>
                <button onClick={() => setReferModal(null)} className="w-full text-slate-400 font-bold">إلغاء</button>
              </div>
           </div>
        </div>
      )}

      {generatedCode && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[160] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[50px] p-12 text-center space-y-8 animate-in zoom-in duration-500 shadow-2xl">
              <h3 className="text-2xl font-black text-slate-900">تم إرسال الإحالة!</h3>
              <div className="bg-slate-900 text-white py-12 rounded-[40px] text-5xl font-black tracking-[0.2em] uppercase">{generatedCode}</div>
              <button onClick={() => { setGeneratedCode(null); setReferModal(null); setViewProfile(null); }} className="w-full bg-slate-100 text-slate-900 py-5 rounded-3xl font-black active:scale-95">إغلاق</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
