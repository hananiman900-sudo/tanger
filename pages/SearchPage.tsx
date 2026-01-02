
import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Building, Briefcase, ChevronDown, 
  Loader2, Zap, CheckCircle2, ClipboardList, X, AlertCircle, Award, User as UserIcon, Instagram, Facebook, Linkedin, Phone, Map as MapIcon, Calendar, Image as ImageIcon, Grid, List, Share2, ExternalLink, Maximize2, MessageCircle, Clock, Globe, Info, Microscope, Scale, Landmark,
  PlusCircle, Layers, Hash, Filter, ChevronUp, Star
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
  const [dbBuildings, setDbBuildings] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [patientCondition, setPatientCondition] = useState('');
  const [referModal, setReferModal] = useState<any | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const t = translations[lang];

  useEffect(() => {
    const fetchData = async () => {
      const { data: cats } = await supabase.from('business_categories').select('*').order('name_ar');
      const { data: blds } = await supabase.from('buildings').select('*').order('name');
      if (cats) setCategories(cats);
      if (blds) setDbBuildings(blds);
    };
    fetchData();
  }, []);

  useEffect(() => { fetchResults(); }, [selectedNeighborhood, selectedCategoryId]);

  const fetchResults = async () => {
    setLoading(true);
    // جلب المهنيين فقط الذين لديهم خطة PREMIUM
    let query = supabase.from('profiles').select('*')
      .eq('status', 'ACTIVE')
      .eq('plan', 'PREMIUM')
      .eq('account_type', 'PROFESSIONAL')
      .neq('id', user.id)
      .order('referral_count', { ascending: false });

    if (selectedNeighborhood) {
      const nName = NEIGHBORHOODS.find(n => n.id === selectedNeighborhood)?.name;
      if (nName) query = query.eq('neighborhood', nName);
    }
    if (selectedCategoryId) query = query.eq('category_id', selectedCategoryId);

    const { data } = await query;
    setProfessionals(data || []);
    setLoading(false);
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
    } finally { setSubmitting(false); }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]" dir="rtl">
      <div className="bg-white px-6 pt-8 pb-4 border-b rounded-b-[40px] shadow-sm z-20 space-y-4">
        <h2 className="text-2xl font-black text-slate-900">إرسال إحالة</h2>
        <div className="grid grid-cols-2 gap-3">
           <select value={selectedNeighborhood} onChange={e => setSelectedNeighborhood(e.target.value)} className="bg-slate-50 p-4 rounded-2xl font-bold text-xs outline-none">
              <option value="">جميع الأحياء</option>
              {NEIGHBORHOODS.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
           </select>
           <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="bg-slate-50 p-4 rounded-2xl font-bold text-xs outline-none">
              <option value="">جميع الفئات</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name_ar}</option>)}
           </select>
        </div>
        <div className="bg-blue-50 p-3 rounded-2xl flex items-center gap-2">
           <Star size={14} className="text-blue-600" />
           <p className="text-[9px] font-bold text-blue-800">تظهر هنا فقط الحسابات الاحترافية (Premium) التي تستقبل إحالات.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-24">
        {loading ? <Loader2 className="animate-spin text-blue-600 mx-auto mt-10" /> : professionals.map(res => (
          <div key={res.id} className="bg-white rounded-[30px] p-5 shadow-sm border border-slate-100 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <img src={res.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(res.full_name)}`} className="w-14 h-14 rounded-2xl object-cover shadow-sm"/>
              <div>
                <h4 className="font-black text-slate-900 text-sm">{res.full_name}</h4>
                <p className="text-[10px] text-blue-600 font-black uppercase">{res.specialty}</p>
              </div>
            </div>
            <button onClick={() => setReferModal(res)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase active:scale-95 transition-all">إحالة</button>
          </div>
        ))}
      </div>

      {referModal && !generatedCode && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[50px] p-10 space-y-8 animate-in zoom-in duration-300">
              <h3 className="text-2xl font-black text-slate-900 text-center">إحالة مريض لـ {referModal.full_name}</h3>
              <div className="space-y-4">
                <input type="text" placeholder="إسم المريض الكامل" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-bold outline-none" value={patientName} onChange={e => setPatientName(e.target.value)} />
                <textarea placeholder="وصف الحالة" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-bold h-28 outline-none" value={patientCondition} onChange={e => setPatientCondition(e.target.value)} />
              </div>
              <button onClick={handleSendReferral} disabled={submitting || !patientName} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black active:scale-95 transition-all">{submitting ? <Loader2 className="animate-spin mx-auto" /> : 'تأكيد الإرسال'}</button>
              <button onClick={() => setReferModal(null)} className="w-full text-slate-400 font-bold">إلغاء</button>
           </div>
        </div>
      )}

      {generatedCode && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[160] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[50px] p-12 text-center space-y-8 animate-in zoom-in duration-500 shadow-2xl">
              <h3 className="text-2xl font-black text-slate-900">تم إرسال الإحالة!</h3>
              <div className="bg-slate-900 text-white py-12 rounded-[40px] text-5xl font-black tracking-[0.2em] uppercase">{generatedCode}</div>
              <p className="text-xs font-bold text-slate-500">أعط هذا الكود للمريض لتقديمه عند زيارة الطبيب.</p>
              <button onClick={() => { setGeneratedCode(null); setReferModal(null); }} className="w-full bg-slate-100 text-slate-900 py-5 rounded-3xl font-black active:scale-95">إغلاق</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
