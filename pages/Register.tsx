
import React, { useState, useEffect, useRef } from 'react';
import { User, Language, AccountStatus, UserRole } from '../types';
import { NEIGHBORHOODS } from '../constants';
import { translations } from '../translations';
import { supabase } from '../supabase';
import { 
  ArrowLeft, User as UserIcon, Building2, MapPin, Briefcase, 
  ChevronRight, AlertCircle, Loader2, X, Check, Building, Microscope, Scale, Landmark,
  Hash, Layers, Lock
} from 'lucide-react';

interface RegisterProps {
  onRegister: (user: User) => void;
  lang: Language;
}

const Register: React.FC<RegisterProps> = ({ onRegister, lang }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subRef = useRef<HTMLDivElement>(null);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [subSpecialties, setSubSpecialties] = useState<any[]>([]);
  const [dbBuildings, setDbBuildings] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    categoryId: '',
    subSpecialtyId: '',
    neighborhood: '',
    buildingId: '',
    floor: '',
    officeNumber: '',
    password: ''
  });
  
  const t = translations[lang];
  const floors = Array.from({ length: 41 }, (_, i) => i.toString());
  const offices = Array.from({ length: 250 }, (_, i) => (i + 1).toString());

  useEffect(() => {
    const fetchData = async () => {
      const { data: cat } = await supabase.from('business_categories').select('*').order('name_ar');
      const { data: bld } = await supabase.from('buildings').select('*').order('name');
      if (cat) setCategories(cat.filter((v, i, a) => a.findIndex(t => t.name_fr === v.name_fr) === i));
      if (bld) setDbBuildings(bld);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSubs = async () => {
      if (!formData.categoryId) return;
      const { data } = await supabase.from('sub_specialties').select('*').eq('category_id', formData.categoryId).order('name_ar');
      if (data) setSubSpecialties(data.filter((v, i, a) => a.findIndex(t => t.name_fr === v.name_fr) === i));
    };
    fetchSubs();
  }, [formData.categoryId]);

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.phone || !formData.password || !formData.categoryId) {
      setError(lang === 'ar' ? 'يرجى ملء جميع البيانات الأساسية' : 'Please fill all basic info');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const email = `${formData.phone.trim()}@tangerhub.ma`;
      const selectedCategory = categories.find(c => c.id === formData.categoryId);
      const selectedSub = subSpecialties.find(s => s.id === formData.subSpecialtyId);
      
      const specialtyName = selectedSub 
        ? (lang === 'ar' ? selectedSub.name_ar : selectedSub.name_fr)
        : (lang === 'ar' ? (selectedCategory?.name_ar || '') : (selectedCategory?.name_fr || ''));

      // 1. Auth SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: { 
          data: { 
            full_name: formData.fullName, 
            phone: formData.phone 
          } 
        }
      });

      if (authError) throw authError;

      if (authData?.user) {
        // 2. Create Profile immediately
        // Note: Using a slightly safer insert that ignores missing columns if possible, 
        // but PostgREST usually fails if you send a non-existent column.
        const profilePayload: any = {
          id: authData.user.id,
          full_name: formData.fullName,
          phone: formData.phone,
          neighborhood: formData.neighborhood,
          specialty: specialtyName,
          category_id: formData.categoryId,
          sub_specialty_id: formData.subSpecialtyId || null,
          building_id: formData.buildingId || null,
          floor: formData.floor,
          office_number: formData.officeNumber,
          status: 'PENDING',
          role: 'PROFESSIONAL'
        };

        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert([profilePayload])
          .select()
          .single();

        if (profileError) {
          // If profile insert fails, we still have the Auth user. 
          // We suggest running the SQL fix.
          console.error("Profile Insert Error:", profileError);
          throw new Error(lang === 'ar' 
            ? 'تم إنشاء الحساب ولكن فشل حفظ البيانات الإضافية. يرجى من المدير تشغيل كود "إصلاح قاعدة البيانات" في صفحة الدخول.' 
            : 'Account created but failed to save details. Admin must run "Fix Schema" script.');
        }
        
        onRegister(mapProfile(newProfile));
      }
    } catch (err: any) {
      console.error("Reg Error:", err);
      setError(err.message || (lang === 'ar' ? 'حدث خطأ أثناء التسجيل' : 'Registration failed'));
      setLoading(false);
    }
  };

  const mapProfile = (data: any): User => ({
    id: data.id,
    fullName: data.full_name,
    phone: data.phone,
    role: data.role as UserRole,
    status: data.status as AccountStatus,
    neighborhood: data.neighborhood,
    specialty: data.specialty,
    buildingId: data.building_id,
    floor: data.floor,
    officeNumber: data.office_number,
    balancePending: 0,
    balanceCompleted: 0,
    referralCode: data.referral_code || '',
    referralCount: 0
  });

  const getIconForCategory = (name: string) => {
    if (name.includes('Clinique')) return <Briefcase className="text-blue-500" />;
    if (name.includes('Laboratoire')) return <Microscope className="text-emerald-500" />;
    if (name.includes('Avocat')) return <Scale className="text-slate-700" />;
    if (name.includes('Comptabilité')) return <Landmark className="text-amber-600" />;
    return <UserIcon className="text-indigo-500" />;
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${t.font}`} dir={t.dir}>
      <div className="bg-white border-b px-6 py-5 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <button onClick={() => window.location.hash = ''} className="p-2 bg-slate-100 rounded-xl text-slate-600 active:scale-90 transition-all"><ArrowLeft size={24} className={lang === 'ar' ? 'rotate-180' : ''} /></button>
        <h2 className="text-xl font-black text-slate-900">{t.register}</h2>
        <div className="w-10"></div>
      </div>

      <div className="px-6 pt-8 pb-12 flex-1 max-w-md mx-auto w-full">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 p-5 rounded-[30px] flex items-center gap-3 text-red-600 text-[10px] font-black uppercase">
            <AlertCircle size={20} className="shrink-0" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <div className="flex items-center mb-10 px-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-500 ${step >= s ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-white text-slate-300 border-2 border-slate-100'}`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-1.5 mx-2 rounded-full transition-all duration-700 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="text-center"><h3 className="text-2xl font-black text-slate-900">{t.category}</h3><p className="text-slate-400 text-xs font-bold mt-1">اختر نوع نشاطك المهني</p></div>
            <div className="grid grid-cols-1 gap-3">
               {categories.map(cat => (
                 <button key={cat.id} onClick={() => { setFormData({...formData, categoryId: cat.id, subSpecialtyId: ''}); if (cat.has_sub_specialties) setTimeout(() => subRef.current?.scrollIntoView({ behavior: 'smooth' }), 300); }}
                  className={`p-5 rounded-3xl border-2 text-right transition-all flex items-center justify-between ${formData.categoryId === cat.id ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-white bg-white shadow-sm hover:border-slate-100'}`}
                 >
                   <div className="flex items-center gap-4">{getIconForCategory(cat.name_fr)}<span className="font-black text-slate-900">{lang === 'ar' ? cat.name_ar : cat.name_fr}</span></div>
                   {formData.categoryId === cat.id && <Check size={20} className="text-blue-600" />}
                 </button>
               ))}
            </div>
            
            <div ref={subRef}>
              {categories.find(c => c.id === formData.categoryId)?.has_sub_specialties && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 bg-white p-6 rounded-[35px] shadow-sm border border-blue-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-2">{t.selectSub}</label>
                  <div className="grid grid-cols-2 gap-2">
                     {subSpecialties.length > 0 ? subSpecialties.map(s => (
                       <button key={s.id} onClick={() => setFormData({...formData, subSpecialtyId: s.id})}
                        className={`p-3 rounded-2xl text-center text-[10px] font-black transition-all border ${formData.subSpecialtyId === s.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                       >{lang === 'ar' ? s.name_ar : s.name_fr}</button>
                     )) : <div className="col-span-2 py-4 flex flex-col items-center"><Loader2 className="animate-spin text-blue-300 mb-2" /><p className="text-[10px] text-slate-400 font-bold">جاري تحميل التخصصات...</p></div>}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setStep(2)} disabled={!formData.categoryId || (categories.find(c => c.id === formData.categoryId)?.has_sub_specialties && !formData.subSpecialtyId)} className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 h-16">{t.next} <ChevronRight size={20} className={lang === 'ar' ? 'rotate-180' : ''} /></button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="text-center"><h3 className="text-2xl font-black text-slate-900">الموقع المهني</h3><p className="text-slate-400 text-xs font-bold mt-1">حدد مكان تواجد المقر أو المكتب</p></div>
            <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase px-2">{t.neighborhood}</label>
                 <select className="w-full bg-white border-2 border-transparent shadow-sm rounded-3xl py-5 px-6 font-black text-slate-900 outline-none focus:border-blue-600 transition-all appearance-none" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})}>
                    <option value="">-- اختر الحي --</option>
                    {NEIGHBORHOODS.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase px-2">{t.building}</label>
                 <select className="w-full bg-white border-2 border-transparent shadow-sm rounded-3xl py-5 px-6 font-black text-slate-900 outline-none focus:border-blue-600 transition-all appearance-none" value={formData.buildingId} onChange={e => setFormData({...formData, buildingId: e.target.value})}>
                    <option value="">-- اختر العمارة --</option>
                    {dbBuildings.filter(b => b.neighborhood_id === NEIGHBORHOODS.find(n => n.name === formData.neighborhood)?.id).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase px-2 flex items-center gap-1"><Layers size={12}/> الطابق</label>
                   <select className="w-full bg-white border-2 border-transparent shadow-sm rounded-3xl py-5 px-6 font-black text-slate-900 outline-none focus:border-blue-600 transition-all appearance-none" value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})}>
                      <option value="">الطابق</option>
                      {floors.map(f => <option key={f} value={f}>{f === '0' ? 'الأرضي' : f}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase px-2 flex items-center gap-1"><Hash size={12}/> رقم المكتب</label>
                   <select className="w-full bg-white border-2 border-transparent shadow-sm rounded-3xl py-5 px-6 font-black text-slate-900 outline-none focus:border-blue-600 transition-all appearance-none" value={formData.officeNumber} onChange={e => setFormData({...formData, officeNumber: e.target.value})}>
                      <option value="">المكتب</option>
                      {offices.map(o => <option key={o} value={o}>{o}</option>)}
                   </select>
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(1)} className="flex-1 bg-slate-200 text-slate-700 font-black py-5 rounded-3xl active:scale-95 transition-all">{t.back}</button>
              <button onClick={() => setStep(3)} className="flex-[2] bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-500/20 h-16 active:scale-95 transition-all">{t.next}</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="text-center"><h3 className="text-2xl font-black text-slate-900">البيانات الشخصية</h3><p className="text-slate-400 text-xs font-bold mt-1">أدخل معلومات الحساب النهائية</p></div>
            <div className="space-y-4">
              <div className="relative"><UserIcon className={`absolute ${lang === 'ar' ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 text-slate-400`} size={20} /><input type="text" placeholder="الاسم الكامل" className={`w-full bg-white border-2 border-transparent shadow-sm rounded-3xl py-5 ${lang === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} font-black text-slate-900 outline-none focus:border-blue-600 transition-all`} value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} /></div>
              <div className="relative"><Briefcase className={`absolute ${lang === 'ar' ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 text-slate-400`} size={20} /><input type="tel" placeholder="رقم الهاتف" className={`w-full bg-white border-2 border-transparent shadow-sm rounded-3xl py-5 ${lang === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} font-black text-slate-900 outline-none focus:border-blue-600 transition-all`} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="relative"><Lock className={`absolute ${lang === 'ar' ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2 text-slate-400`} size={20} /><input type="password" placeholder="كلمة المرور" className={`w-full bg-white border-2 border-transparent shadow-sm rounded-3xl py-5 ${lang === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} font-black text-slate-900 outline-none focus:border-blue-600 transition-all`} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
            </div>
            <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-500/20 flex items-center justify-center h-16 active:scale-95 transition-all">{loading ? <Loader2 className="animate-spin" /> : 'إنشاء الحساب الآن'}</button>
            <button onClick={() => setStep(2)} className="w-full text-slate-400 font-black py-2 active:scale-95 transition-all">{t.back}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
