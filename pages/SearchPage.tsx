
import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Building, Star, Filter, ArrowRight, Stethoscope, 
  HeartPulse, Scale, Zap, Navigation, Loader2, X, Send, QrCode, ArrowLeft,
  ChevronRight, Briefcase, UserCheck
} from 'lucide-react';
import { User, Language } from '../types';
import { translations } from '../translations';
import { supabase } from '../supabase';

interface SearchPageProps {
  user: User;
  lang: Language;
}

type Step = 'SPECIALTY' | 'BUILDING' | 'PROFESSIONAL';

const SearchPage: React.FC<SearchPageProps> = ({ user, lang }) => {
  const [currentStep, setCurrentStep] = useState<Step>('SPECIALTY');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);
  
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [availableBuildings, setAvailableBuildings] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [referModal, setReferModal] = useState<any | null>(null);
  const [patientName, setPatientName] = useState('');
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const t = translations[lang];

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('specialties').select('*').order('name');
    if (data && data.length > 0) {
      setSpecialties(data);
    } else {
      console.warn("No specialties found in DB, using fallbacks");
      setSpecialties([
        { id: '1', name: 'General Medicine' },
        { id: '2', name: 'Dentistry' },
        { id: '3', name: 'Law Firm' }
      ]);
    }
    setLoading(false);
  };

  const handleSelectSpecialty = async (specialtyName: string) => {
    setSelectedSpecialty(specialtyName);
    setLoading(true);
    
    // Find unique buildings that have professionals with this specialty
    const { data, error } = await supabase
      .from('profiles')
      .select('building_id, buildings(id, name, address)')
      .eq('specialty', specialtyName)
      .eq('status', 'ACTIVE')
      .neq('id', user.id);

    if (data) {
      const uniqueBuildings = Array.from(new Set(data.map((item: any) => JSON.stringify(item.buildings))))
        .map((str: string) => JSON.parse(str))
        .filter(b => b !== null);
      
      setAvailableBuildings(uniqueBuildings);
      setCurrentStep('BUILDING');
    }
    setLoading(false);
  };

  const handleSelectBuilding = async (building: any) => {
    setSelectedBuilding(building);
    setLoading(true);
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('specialty', selectedSpecialty)
      .eq('building_id', building.id)
      .eq('status', 'ACTIVE')
      .neq('id', user.id);

    if (data) {
      setProfessionals(data);
      setCurrentStep('PROFESSIONAL');
    }
    setLoading(false);
  };

  const handleRefer = async () => {
    if (!patientName) return;
    setSending(true);
    const code = Math.floor(1000 + Math.random() * 8999).toString();
    
    const { error } = await supabase.from('referrals').insert([{
      referrer_id: user.id,
      receiver_id: referModal.id,
      patient_name: patientName,
      reason,
      code,
      commission_amount: 10
    }]);

    setSending(false);
    if (!error) {
      setGeneratedCode(code);
    } else {
      alert(error.message);
    }
  };

  const goBack = () => {
    if (currentStep === 'BUILDING') setCurrentStep('SPECIALTY');
    if (currentStep === 'PROFESSIONAL') setCurrentStep('BUILDING');
  };

  const resetModal = () => {
    setReferModal(null);
    setGeneratedCode(null);
    setPatientName('');
    setReason('');
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]" dir={t.dir}>
      <div className="bg-white px-6 pt-8 pb-6 border-b shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             {currentStep !== 'SPECIALTY' && (
               <button onClick={goBack} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all">
                 <ArrowLeft size={20} className={lang === 'ar' ? 'rotate-180' : ''} />
               </button>
             )}
             <h2 className="text-2xl font-black text-slate-900">
               {currentStep === 'SPECIALTY' && (lang === 'ar' ? 'اختر التخصص' : 'Select Specialty')}
               {currentStep === 'BUILDING' && (lang === 'ar' ? 'اختر العمارة' : 'Select Building')}
               {currentStep === 'PROFESSIONAL' && (lang === 'ar' ? 'اختر المهني' : 'Select Professional')}
             </h2>
          </div>
          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">10 DH</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black ${currentStep === 'SPECIALTY' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>1. {lang === 'ar' ? 'التخصص' : 'Specialty'}</div>
          <ChevronRight size={14} className="text-slate-300 shrink-0" />
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black ${currentStep === 'BUILDING' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>2. {lang === 'ar' ? 'العمارة' : 'Building'}</div>
          <ChevronRight size={14} className="text-slate-300 shrink-0" />
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black ${currentStep === 'PROFESSIONAL' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>3. {lang === 'ar' ? 'المهني' : 'Pro'}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-bold text-sm">{t.loading}</p>
          </div>
        ) : (
          <>
            {currentStep === 'SPECIALTY' && (
              <div className="grid grid-cols-2 gap-4">
                {specialties.map(s => (
                  <button key={s.id} onClick={() => handleSelectSpecialty(s.name)} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:border-blue-500 hover:shadow-lg transition-all text-center group">
                    <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mx-auto w-fit"><Briefcase size={32} /></div>
                    <span className="font-black text-slate-800 text-xs">{s.name}</span>
                  </button>
                ))}
              </div>
            )}

            {currentStep === 'BUILDING' && (
              <div className="space-y-4">
                {availableBuildings.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold">{lang === 'ar' ? 'لا توجد عمارات تتوفر على هذا التخصص' : 'No buildings found'}</p>
                    <button onClick={() => setCurrentStep('SPECIALTY')} className="mt-4 text-blue-600 font-black">رجوع</button>
                  </div>
                ) : (
                  availableBuildings.map(b => (
                    <button key={b.id} onClick={() => handleSelectBuilding(b)} className="w-full bg-white p-5 rounded-[32px] border border-slate-100 flex items-center justify-between hover:border-blue-500 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><Building size={24}/></div>
                        <div className="text-right">
                          <h4 className="font-black text-slate-900">{b.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold">{b.address}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300" />
                    </button>
                  ))
                )}
              </div>
            )}

            {currentStep === 'PROFESSIONAL' && (
              <div className="space-y-4">
                {professionals.map(res => (
                  <div key={res.id} className="bg-white rounded-[32px] p-5 border border-slate-100 flex items-center justify-between hover:border-blue-500 transition-all">
                    <div className="flex items-center gap-4">
                      <img src={res.profile_image || `https://picsum.photos/seed/${res.id}/100`} className="w-16 h-16 rounded-[22px] object-cover shadow-sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900">{res.full_name}</h4>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-md">{res.specialty}</span>
                        </div>
                        <p className="text-slate-400 text-[10px] font-bold mt-1">{selectedBuilding?.name} • {res.floor || 'الطابق 1'}</p>
                      </div>
                    </div>
                    <button onClick={() => setReferModal(res)} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 active:scale-90 transition-all"><Send size={20} /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {referModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in duration-300">
            {!generatedCode ? (
              <>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-[24px]"><Zap size={28}/></div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{lang === 'ar' ? 'إنشاء إحالة جديدة' : 'Create Referral'}</h3>
                    <p className="text-xs font-bold text-slate-400">إلى: {referModal.full_name}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <input type="text" placeholder="إسم المريض الكامل" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 font-bold" value={patientName} onChange={e => setPatientName(e.target.value)} required />
                  <textarea placeholder="سبب الإحالة (اختياري)..." className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 font-bold h-24" value={reason} onChange={e => setReason(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleRefer} disabled={sending || !patientName} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black">
                    {sending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'تأكيد'}
                  </button>
                  <button onClick={resetModal} className="px-6 py-4 text-slate-400 font-bold">إلغاء</button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-6">
                <div className="bg-emerald-50 text-emerald-600 p-6 rounded-[32px] w-fit mx-auto"><QrCode size={48}/></div>
                <h3 className="text-2xl font-black text-slate-900">{lang === 'ar' ? 'تم إنشاء الكود' : 'Code Generated'}</h3>
                <div className="bg-slate-900 text-white p-8 rounded-[32px] text-5xl font-black tracking-widest">{generatedCode}</div>
                <button onClick={resetModal} className="w-full bg-slate-100 text-slate-700 py-5 rounded-2xl font-black">إتمام</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
