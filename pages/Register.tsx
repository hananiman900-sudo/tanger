
import React, { useState, useEffect } from 'react';
import { User, UserRole, AccountStatus, Language } from '../types';
import { NEIGHBORHOODS } from '../constants';
import { translations } from '../translations';
import { supabase } from '../supabase';
import { 
  ArrowLeft, User as UserIcon, Building2, MapPin, Briefcase, 
  ChevronRight, AlertCircle, Loader2, X, Copy, Check 
} from 'lucide-react';

interface RegisterProps {
  onRegister: (user: User) => void;
  lang: Language;
}

const Register: React.FC<RegisterProps> = ({ onRegister, lang }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dbBuildings, setDbBuildings] = useState<any[]>([]);
  const [dbSpecialties, setDbSpecialties] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    neighborhood: '',
    specialty: '',
    buildingId: '',
    floor: '',
    password: ''
  });
  
  const t = translations[lang];

  useEffect(() => {
    const fetchSelectData = async () => {
      const { data: b } = await supabase.from('buildings').select('*').order('name');
      const { data: s } = await supabase.from('specialties').select('*').order('name');
      if (b) setDbBuildings(b);
      if (s) setDbSpecialties(s);
    };
    fetchSelectData();
  }, []);

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.phone || !formData.password) {
      alert(lang === 'ar' ? 'يرجى ملء جميع البيانات الأساسية' : 'Please fill all fields');
      return;
    }
    setLoading(true);
    const email = `${formData.phone}@tangerhub.ma`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          neighborhood: formData.neighborhood,
          specialty: formData.specialty,
          building_id: formData.buildingId,
          floor: formData.floor
        }
      }
    });

    if (authError) {
      alert(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      alert(lang === 'ar' ? 'تم التسجيل بنجاح! حسابك قيد المراجعة الآن.' : 'Registration successful! Pending review.');
      window.location.hash = '#login';
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${t.font}`} dir={t.dir}>
      <div className="bg-white border-b px-6 py-5 flex items-center">
        <button onClick={() => window.location.hash = ''} className={`${lang === 'ar' ? 'ml-4' : 'mr-4'}`}>
          <ArrowLeft size={24} className={`${lang === 'ar' ? 'rotate-180' : ''}`} />
        </button>
        <h2 className="text-xl font-bold text-slate-800">{t.register}</h2>
      </div>

      <div className="px-6 pt-8 pb-12 flex-1 max-w-md mx-auto w-full">
        {/* Progress */}
        <div className="flex items-center mb-10 px-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step >= s ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 rounded-full ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h3 className="text-2xl font-black text-slate-800">{lang === 'ar' ? 'البيانات الشخصية' : 'Personal Info'}</h3>
            <div className="space-y-4">
              <input type="text" placeholder={t.full_name} className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 font-bold" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              <input type="tel" placeholder={t.phone} className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"><span>{t.next}</span><ChevronRight size={20} className={lang === 'ar' ? 'rotate-180' : ''} /></button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h3 className="text-2xl font-black text-slate-800">{lang === 'ar' ? 'الموقع والنشاط' : 'Activity Info'}</h3>
            <div className="space-y-4">
              <select className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 font-bold" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})}>
                <option value="">{lang === 'ar' ? 'اختر الحي' : 'Select Neighborhood'}</option>
                {NEIGHBORHOODS.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
              </select>
              <select className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 font-bold" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})}>
                <option value="">{lang === 'ar' ? 'اختر التخصص' : 'Select Specialty'}</option>
                {dbSpecialties.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <select className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 font-bold" value={formData.buildingId} onChange={e => setFormData({...formData, buildingId: e.target.value})}>
                <option value="">{lang === 'ar' ? 'اختر العمارة' : 'Select Building'}</option>
                {dbBuildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 bg-slate-200 text-slate-700 font-bold py-4 rounded-xl">{t.back}</button>
              <button onClick={() => setStep(3)} className="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-xl">{t.next}</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h3 className="text-2xl font-black text-slate-800">{lang === 'ar' ? 'تأكيد التسجيل' : 'Security'}</h3>
            <div className="space-y-4">
              <input type="text" placeholder={t.floor} className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 font-bold" value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} />
              <input type="password" placeholder={t.password} className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center">
              {loading ? <Loader2 className="animate-spin" /> : t.register}
            </button>
            <button onClick={() => setStep(2)} className="w-full text-slate-400 font-bold">{t.back}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
