
import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, Check, X, Loader2, Plus, Trash2, LayoutGrid, LogOut, Banknote, DollarSign, Image as ImageIcon, Send, ExternalLink, CreditCard, User as UserIcon, Phone, MapPin, Briefcase, Info, ArrowRightLeft, Clock, CheckCircle2, AlertCircle, HandCoins, Settings, Database, Microscope, Map
} from 'lucide-react';
import { Language, Referral } from '../types';
import { translations } from '../translations';
import { supabase } from '../supabase';
import { NEIGHBORHOODS } from '../constants';

interface AdminDashboardProps {
  lang: Language;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'referrals' | 'withdrawals' | 'settings'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Settings State
  const [categories, setCategories] = useState<any[]>([]);
  const [subSpecialties, setSubSpecialties] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  
  // Building Management State
  const [newBldName, setNewBldName] = useState('');
  const [newBldAddress, setNewBldAddress] = useState('');
  const [newBldNeighborhoodId, setNewBldNeighborhoodId] = useState('');
  const [isAddingBuilding, setIsAddingBuilding] = useState(false);
  
  const [newCatAr, setNewCatAr] = useState('');
  const [newCatFr, setNewCatFr] = useState('');
  const [catHasSubs, setCatHasSubs] = useState(false);
  
  const [newSubAr, setNewSubAr] = useState('');
  const [newSubFr, setNewSubFr] = useState('');
  const [selectedCatForSub, setSelectedCatForSub] = useState('');

  const t = translations[lang];

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      const { data: withdrawalData } = await supabase.from('withdrawals').select('*, profiles:user_id(full_name, phone, specialty)').order('created_at', { ascending: false });
      const { data: referralData } = await supabase.from('referrals').select(`*, referrer:referrer_id(full_name, specialty, phone), receiver:receiver_id(full_name, specialty, phone)`).order('created_at', { ascending: false });
      const { data: catData } = await supabase.from('business_categories').select('*').order('name_ar');
      const { data: subData } = await supabase.from('sub_specialties').select('*').order('name_ar');
      const { data: bldData } = await supabase.from('buildings').select('*').order('created_at', { ascending: false });

      setUsers(userData || []);
      setWithdrawals(withdrawalData || []);
      setReferrals(referralData || []);
      setCategories(catData || []);
      setSubSpecialties(subData || []);
      setBuildings(bldData || []);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddBuilding = async () => {
    if (!newBldName || !newBldNeighborhoodId) {
      alert(lang === 'ar' ? 'يرجى إدخال اسم العمارة واختيار الحي' : 'Please enter building name and select neighborhood');
      return;
    }
    setIsAddingBuilding(true);
    const { error } = await supabase.from('buildings').insert([{
      name: newBldName,
      address: newBldAddress,
      neighborhood_id: newBldNeighborhoodId
    }]);
    
    if (!error) {
      setNewBldName('');
      setNewBldAddress('');
      setNewBldNeighborhoodId('');
      fetchData();
    } else {
      alert(error.message);
    }
    setIsAddingBuilding(false);
  };

  const handleAddCategory = async () => {
    if (!newCatAr || !newCatFr) return;
    const { error } = await supabase.from('business_categories').insert([{
      name_ar: newCatAr,
      name_fr: newCatFr,
      has_sub_specialties: catHasSubs
    }]);
    if (!error) { setNewCatAr(''); setNewCatFr(''); setCatHasSubs(false); fetchData(); }
  };

  const handleAddSubSpecialty = async () => {
    if (!newSubAr || !newSubFr || !selectedCatForSub) return;
    const { error } = await supabase.from('sub_specialties').insert([{
      category_id: selectedCatForSub,
      name_ar: newSubAr,
      name_fr: newSubFr
    }]);
    if (!error) { setNewSubAr(''); setNewSubFr(''); fetchData(); }
  };

  const handleDeleteItem = async (table: string, id: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) fetchData();
  };

  const updateUserStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (!error) fetchData();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20" dir={t.dir}>
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2.5 rounded-2xl text-white shadow-lg"><LayoutGrid size={24} /></div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">الإدارة - TangerHub</h1>
        </div>
        <button onClick={onLogout} className="p-3 bg-red-50 text-red-600 rounded-2xl active:scale-90 transition-all"><LogOut size={20} /></button>
      </header>

      <div className="bg-white border-b px-6 flex gap-6 overflow-x-auto scrollbar-hide sticky top-[73px] z-30">
        {[
          { id: 'users', label: 'الأعضاء', icon: <Users size={16}/> },
          { id: 'referrals', label: 'الإحالات', icon: <ArrowRightLeft size={16}/> },
          { id: 'withdrawals', label: 'السحوبات', icon: <DollarSign size={16}/> },
          { id: 'settings', label: 'الإعدادات', icon: <Settings size={16}/> },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)} 
            className={`py-5 font-black whitespace-nowrap transition-all flex items-center gap-2 border-b-4 ${activeTab === tab.id ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <main className="p-6 max-w-6xl mx-auto">
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((u) => (
              <div 
                key={u.id} 
                onClick={() => setSelectedUser(u)}
                className="bg-white p-5 rounded-[35px] shadow-sm border border-slate-100 flex items-center justify-between hover:border-blue-600 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img src={u.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}`} className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-all"/>
                  <div className="min-w-0 text-right">
                    <h3 className="font-black text-slate-900 text-sm truncate">{u.full_name}</h3>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest truncate">{u.specialty}</p>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 inline-block">{u.balance_completed} DH</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); updateUserStatus(u.id, u.status === 'ACTIVE' ? 'PENDING' : 'ACTIVE'); }} className={`p-3 rounded-xl transition-all ${u.status === 'ACTIVE' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white shadow-lg'}`}>
                    {u.status === 'ACTIVE' ? <X size={18}/> : <Check size={18}/>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
           <div className="space-y-8 pb-10">
              {/* Building Management - NEW SECTION */}
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><Building2 size={24} className="text-blue-600" /> إدارة العمارات (Immeubles)</h3>
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">{buildings.length} عمارة مسجلة</span>
                 </div>
                 
                 <div className="bg-slate-50 p-6 rounded-[35px] border border-slate-100 space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase px-2 mb-2">إضافة عمارة جديدة</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 mr-2">اسم العمارة</label>
                          <input type="text" placeholder="مثلاً: Abraj Al Madina" className="w-full bg-white p-4 rounded-2xl border-0 shadow-sm font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600/10" value={newBldName} onChange={e => setNewBldName(e.target.value)} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 mr-2">الحي المتواجدة به</label>
                          <select className="w-full bg-white p-4 rounded-2xl border-0 shadow-sm font-bold text-sm outline-none" value={newBldNeighborhoodId} onChange={e => setNewBldNeighborhoodId(e.target.value)}>
                             <option value="">-- اختر الحي --</option>
                             {NEIGHBORHOODS.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 mr-2">العنوان (اختياري)</label>
                          <input type="text" placeholder="مثلاً: Blvd Mohamed V" className="w-full bg-white p-4 rounded-2xl border-0 shadow-sm font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600/10" value={newBldAddress} onChange={e => setNewBldAddress(e.target.value)} />
                       </div>
                    </div>
                    <button onClick={handleAddBuilding} disabled={isAddingBuilding} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3">
                       {isAddingBuilding ? <Loader2 className="animate-spin" /> : <><Plus size={20}/> إضافة العمارة للمنظومة</>}
                    </button>
                 </div>

                 <div className="space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase px-2 mb-2">العمارات المضافة حالياً</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                       {buildings.map(b => (
                          <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-red-200 transition-all shadow-sm">
                             <div className="flex items-center gap-3 min-w-0">
                                <div className="bg-slate-50 p-2 rounded-xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all"><Building2 size={16}/></div>
                                <div className="min-w-0">
                                   <p className="text-xs font-black text-slate-900 truncate">{b.name}</p>
                                   <p className="text-[9px] text-slate-400 font-bold">{NEIGHBORHOODS.find(n => n.id === b.neighborhood_id)?.name || 'غير معروف'}</p>
                                </div>
                             </div>
                             <button onClick={() => handleDeleteItem('buildings', b.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14}/></button>
                          </div>
                       ))}
                       {buildings.length === 0 && <p className="col-span-full py-10 text-center text-slate-300 font-bold">لا توجد عمارات مضافة بعد.</p>}
                    </div>
                 </div>
              </div>

              {/* Categories Management */}
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                 <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><Database size={24} className="text-blue-600" /> إدارة الفئات الرئيسية</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="اسم الفئة بالعربية" className="bg-slate-50 p-4 rounded-2xl border-0 font-bold" value={newCatAr} onChange={e => setNewCatAr(e.target.value)} />
                    <input type="text" placeholder="اسم الفئة بالفرنسية" className="bg-slate-50 p-4 rounded-2xl border-0 font-bold" value={newCatFr} onChange={e => setNewCatFr(e.target.value)} />
                    <label className="flex items-center gap-3 px-4 py-2 cursor-pointer">
                       <input type="checkbox" checked={catHasSubs} onChange={e => setCatHasSubs(e.target.checked)} className="w-5 h-5 accent-blue-600" />
                       <span className="text-sm font-bold text-slate-600">تحتوي على تخصصات فرعية (مثل العيادات)</span>
                    </label>
                 </div>
                 <button onClick={handleAddCategory} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all">إضافة الفئة للنظام</button>
                 
                 <div className="flex flex-wrap gap-2 pt-4">
                    {categories.map(c => (
                       <div key={c.id} className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-100">
                          <span className="text-xs font-black text-slate-700">{lang === 'ar' ? c.name_ar : c.name_fr}</span>
                          <button onClick={() => handleDeleteItem('business_categories', c.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Sub-Specialties Management */}
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                 <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><Microscope size={24} className="text-emerald-600" /> إدارة التخصصات الطبية</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select className="bg-slate-50 p-4 rounded-2xl font-bold border-0" value={selectedCatForSub} onChange={e => setSelectedCatForSub(e.target.value)}>
                       <option value="">اختر الفئة الأب</option>
                       {categories.filter(c => c.has_sub_specialties).map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                    </select>
                    <input type="text" placeholder="التخصص بالعربية" className="bg-slate-50 p-4 rounded-2xl font-bold border-0" value={newSubAr} onChange={e => setNewSubAr(e.target.value)} />
                    <input type="text" placeholder="التخصص بالفرنسية" className="bg-slate-50 p-4 rounded-2xl font-bold border-0" value={newSubFr} onChange={e => setNewSubFr(e.target.value)} />
                 </div>
                 <button onClick={handleAddSubSpecialty} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all">إضافة تخصص طبي</button>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4">
                    {subSpecialties.map(s => (
                       <div key={s.id} className="bg-slate-50 px-4 py-2 rounded-xl flex items-center justify-between border border-slate-100">
                          <span className="text-[10px] font-black text-slate-700">{lang === 'ar' ? s.name_ar : s.name_fr}</span>
                          <button onClick={() => handleDeleteItem('sub_specialties', s.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12}/></button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* Member Details Modal */}
        {selectedUser && (
           <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-[50px] p-10 space-y-8 shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
                 <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full z-10"><X size={20}/></button>
                 <div className="text-center space-y-4 pt-4">
                    <img src={selectedUser.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.full_name)}`} className="w-24 h-24 rounded-[35px] object-cover mx-auto border-4 border-white shadow-xl" />
                    <div><h3 className="text-2xl font-black text-slate-900">{selectedUser.full_name}</h3><p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{selectedUser.specialty}</p></div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                       <div className="bg-white p-3 rounded-2xl text-blue-600"><Phone size={18}/></div>
                       <div><p className="text-[9px] font-black text-slate-400 uppercase text-right">رقم الهاتف</p><a href={`tel:${selectedUser.phone}`} className="text-sm font-black text-slate-900">{selectedUser.phone}</a></div>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                       <div className="bg-white p-3 rounded-2xl text-amber-600"><MapPin size={18}/></div>
                       <div><p className="text-[9px] font-black text-slate-400 uppercase text-right">الموقع</p><p className="text-sm font-black text-slate-900">{selectedUser.neighborhood} - {buildings.find(b => b.id === selectedUser.building_id)?.name || 'بدون عمارة'}</p></div>
                    </div>
                 </div>
                 <button onClick={() => setSelectedUser(null)} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-sm active:scale-95 transition-all">إغلاق الملف</button>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
    