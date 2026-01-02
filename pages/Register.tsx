
import React, { useState, useEffect, useRef } from 'react';
import { User, Language, AccountStatus, UserRole, AccountType, PlanType } from '../types';
import { NEIGHBORHOODS } from '../constants';
import { translations } from '../translations';
import { supabase } from '../supabase';
import { 
  ArrowLeft, User as UserIcon, Building2, MapPin, Briefcase, 
  ChevronRight, AlertCircle, Loader2, X, Check, Building, Microscope, Scale, Landmark,
  Hash, Layers, Lock, Star, ShieldCheck, Zap, UserCheck
} from 'lucide-react';

interface RegisterProps {
  onRegister: (user: User) => void;
  lang: Language;
}

const Register: React.FC<RegisterProps> = ({ onRegister, lang }) => {
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<any[]>([]);
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
    password: '',
    accountType: 'PROFESSIONAL' as AccountType,
    plan: 'FREE' as PlanType
  });
  
  const t = translations[lang];

  useEffect(() => {
    const fetchData = async () => {
      const { data: cat } = await supabase.from('business_categories').select('*').order('name_ar');
      const { data: bld } = await supabase.from('buildings').select('*').order('name');
      
      if (cat) {
        // تصفية الفئات لاستبعاد المسوقين من قائمة المهنيين والاطباء
        const filteredCats = cat.filter(c => 
          !c.name_ar.includes('مسوق') && 
          !c.name_fr.toLowerCase().includes('marketer') &&
          !c.name_ar.includes('عمولة')
        );
        setCategories(filteredCats);
      }
      if (bld) setDbBuildings(bld);
    };
    fetchData();
  }, []);

  // دالة مطابقة البيانات لضمان عدم حدوث خطأ عند الانتقال لصفحة البروفايل
  const mapProfile = (data: any): User => ({
    id: data.id,
    fullName: data.full_name || '',
    phone: data.phone || '',
    role: (data.role as UserRole) || UserRole.PROFESSIONAL,
    status: (data.status as AccountStatus) || AccountStatus.PENDING,
    accountType: (data.account_type as AccountType) || 'PROFESSIONAL',
    plan: (data.plan as PlanType) || 'FREE',
    neighborhood: data.neighborhood || '',
    specialty: data.specialty || '',
    buildingId: data.building_id || '',
    floor: data.floor || '',
    officeNumber: data.office_number || '',
    description: data.description || '',
    profileImage: data.profile_image || '',
    balancePending: 0,
    balanceCompleted: 0,
    debtBalance: Number(data.debt_balance || 0),
    referralCode: data.referral_code || '',
    bankAccount: data.bank_account || '',
    socialLinks: data.social_links || { facebook: '', instagram: '', whatsapp: '', linkedin: '' },
    activeHours: data.active_hours || '',
    gpsLocation: data.gps_location || '',
    referralCount: 0
  });

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const email = `${formData.phone.trim()}@tangerhub.ma`;
      
      // 1. تسجيل المستخدم في نظام الهوية
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        // تحديد مسمى التخصص النهائي
        let finalSpecialty = 'Marketer';
        if (formData.accountType === 'PROFESSIONAL') {
          const selectedCat = categories.find(c => c.id === formData.categoryId);
          finalSpecialty = selectedCat ? (lang === 'ar' ? selectedCat.name_ar : selectedCat.name_fr) : 'Professional';
        }

        // 2. إنشاء ملف المستخدم في قاعدة البيانات
        const profilePayload: any = {
          id: authData.user.id,
          full_name: formData.fullName,
          phone: formData.phone,
          neighborhood: formData.neighborhood,
          specialty: finalSpecialty,
          category_id: formData.categoryId || null,
          building_id: formData.buildingId || null,
          floor: formData.floor,
          office_number: formData.officeNumber,
          status: 'PENDING',
          role: 'PROFESSIONAL',
          account_type: formData.accountType,
          plan: formData.plan,
          debt_balance: 0,
          referral_code: `TGR${Math.floor(1000 + Math.random() * 8999)}`
        };

        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert([profilePayload])
          .select()
          .single();

        if (profileError) throw profileError;

        // الانتقال للحساب الجديد
        onRegister(mapProfile(newProfile));
      }
    } catch (err: any) {
      console.error('Registration Error:', err);
      setError(err.message || 'فشل الاتصال بخادم التسجيل');
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${t.font}`} dir={t.dir}>
      <div className="bg-white border-b px-6 py-5 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <button onClick={() => step > 0 ? setStep(step - 1) : window.location.hash = ''} className="p-2 bg-slate-100 rounded-xl">
          <ArrowLeft size={24} className={lang === 'ar' ? 'rotate-180' : ''} />
        </button>
        <h2 className="text-xl font-black text-slate-900">{t.register}</h2>
        <div className="w-10"></div>
      </div>

      <div className="px-6 pt-8 pb-12 flex-1 max-w-md mx-auto w-full">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in fade-in">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        {step === 0 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900">نوع الحساب والاشتراك</h3>
              <p className="text-slate-400 text-xs font-bold mt-1">اختر الطريقة التي تريد بها الانضمام لشبكتنا</p>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">1. من أنت؟</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setFormData({...formData, accountType: 'PROFESSIONAL'})}
                  className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all ${formData.accountType === 'PROFESSIONAL' ? 'border-blue-600 bg-blue-50' : 'border-white bg-white'}`}
                >
                  <Building2 size={32} className={formData.accountType === 'PROFESSIONAL' ? 'text-blue-600' : 'text-slate-300'} />
                  <span className="font-black text-xs">مهني / طبيب</span>
                </button>
                <button 
                  onClick={() => setFormData({...formData, accountType: 'MARKETER'})}
                  className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all ${formData.accountType === 'MARKETER' ? 'border-blue-600 bg-blue-50' : 'border-white bg-white'}`}
                >
                  <Zap size={32} className={formData.accountType === 'MARKETER' ? 'text-blue-600' : 'text-slate-300'} />
                  <span className="font-black text-xs">مسوق مستقل</span>
                </button>
              </div>
            </div>

            {formData.accountType === 'PROFESSIONAL' && (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">2. اختر خطة العضوية</p>
                <div className="space-y-3">
                  <button 
                    onClick={() => setFormData({...formData, plan: 'FREE'})}
                    className={`w-full p-5 rounded-[30px] border-2 text-right relative overflow-hidden transition-all ${formData.plan === 'FREE' ? 'border-blue-600 bg-blue-50' : 'border-white bg-white'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                       <span className="font-black text-slate-900">الخطة المجانية</span>
                       <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black">0 DH</span>
                    </div>
                    <ul className="text-[10px] text-slate-500 font-bold space-y-1">
                      <li>• الظهور في دليل العمارات</li>
                      <li className="line-through opacity-50">• نظام الإحالات والعمولات</li>
                    </ul>
                  </button>

                  <button 
                    onClick={() => setFormData({...formData, plan: 'PREMIUM'})}
                    className={`w-full p-5 rounded-[30px] border-2 text-right relative overflow-hidden transition-all ${formData.plan === 'PREMIUM' ? 'border-blue-600 bg-blue-50' : 'border-white bg-white'}`}
                  >
                    <Star className="absolute -top-2 -right-2 text-blue-600 opacity-10 w-20 h-20" />
                    <div className="flex justify-between items-center mb-2">
                       <span className="font-black text-blue-600">الخطة الاحترافية (Premium)</span>
                       <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-black">300 DH / سنة</span>
                    </div>
                    <ul className="text-[10px] text-blue-800 font-bold space-y-1">
                      <li>• تفعيل نظام الإحالات بالكامل</li>
                      <li>• أولوية في الظهور والترويج</li>
                    </ul>
                  </button>
                </div>
              </div>
            )}

            <button onClick={() => setStep(1)} className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 h-16">
              تأكيد الاختيار <ChevronRight size={20}/>
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right">
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900">التخصص</h3>
              <p className="text-slate-400 text-xs font-bold">حدد مجال عملك بدقة</p>
            </div>
            {formData.accountType === 'MARKETER' ? (
              <div className="bg-blue-50 p-6 rounded-[35px] border border-blue-100 flex flex-col items-center text-center gap-4">
                 <UserCheck size={48} className="text-blue-600" />
                 <p className="text-xs font-bold text-blue-900 leading-relaxed">بصفتك مسوقاً، يمكنك إرسال المرضى للعيادات والحصول على عمولة 20 درهم عن كل زيارة مؤكدة.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                 {categories.map(cat => (
                   <button key={cat.id} onClick={() => setFormData({...formData, categoryId: cat.id})} className={`p-5 rounded-3xl border-2 text-right transition-all flex items-center justify-between ${formData.categoryId === cat.id ? 'border-blue-600 bg-blue-50' : 'border-white bg-white'}`}>
                     <span className="font-black text-slate-900">{lang === 'ar' ? cat.name_ar : cat.name_fr}</span>
                     {formData.categoryId === cat.id && <Check size={20} className="text-blue-600" />}
                   </button>
                 ))}
              </div>
            )}
            <button 
              onClick={() => (formData.accountType === 'MARKETER' || formData.categoryId) ? setStep(2) : alert('يرجى اختيار التخصص')} 
              className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl h-16 active:scale-95 transition-all"
            >
              متابعة الموقع
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right">
            <div className="text-center"><h3 className="text-2xl font-black text-slate-900">الموقع المهني</h3></div>
            <div className="space-y-4">
              <select className="w-full bg-white rounded-3xl py-5 px-6 font-black outline-none border-2 border-transparent focus:border-blue-600 appearance-none shadow-sm" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})}>
                <option value="">-- الحي --</option>
                {NEIGHBORHOODS.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
              </select>
              <select className="w-full bg-white rounded-3xl py-5 px-6 font-black outline-none border-2 border-transparent focus:border-blue-600 appearance-none shadow-sm" value={formData.buildingId} onChange={e => setFormData({...formData, buildingId: e.target.value})}>
                <option value="">-- العمارة --</option>
                {dbBuildings.filter(b => b.neighborhood_id === NEIGHBORHOODS.find(n => n.name === formData.neighborhood)?.id).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                 <input type="text" placeholder="الطابق" className="bg-white rounded-3xl py-5 px-6 font-black outline-none border-2 border-transparent focus:border-blue-600 shadow-sm" value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} />
                 <input type="text" placeholder="رقم المكتب" className="bg-white rounded-3xl py-5 px-6 font-black outline-none border-2 border-transparent focus:border-blue-600 shadow-sm" value={formData.officeNumber} onChange={e => setFormData({...formData, officeNumber: e.target.value})} />
              </div>
            </div>
            <button onClick={() => (formData.neighborhood && formData.buildingId) ? setStep(3) : alert('يرجى تحديد الحي والعمارة')} className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl h-16">الخطوة الأخيرة</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right">
            <div className="text-center"><h3 className="text-2xl font-black text-slate-900">الحساب</h3></div>
            <div className="space-y-4">
              <input type="text" placeholder="الاسم الكامل" className="w-full bg-white rounded-3xl py-5 px-6 font-black outline-none border-2 border-transparent focus:border-blue-600 shadow-sm" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              <input type="tel" placeholder="رقم الهاتف (مثل: 0612345678)" className="w-full bg-white rounded-3xl py-5 px-6 font-black outline-none border-2 border-transparent focus:border-blue-600 shadow-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input type="password" placeholder="كلمة المرور" className="w-full bg-white rounded-3xl py-5 px-6 font-black outline-none border-2 border-transparent focus:border-blue-600 shadow-sm" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <button 
              onClick={handleSubmit} 
              disabled={loading || !formData.fullName || formData.phone.length < 10 || !formData.password} 
              className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl h-16 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'إنشاء الحساب الآن'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
