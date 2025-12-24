
import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, Briefcase, TrendingUp, Check, X, Loader2, 
  Search, Plus, Trash2, Eye, DollarSign, LayoutGrid, LogOut,
  CreditCard, BellRing, Calendar, Send, Mail, Inbox, CheckCheck, Clock, Layers, MapPin
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { supabase } from '../supabase';
import { NEIGHBORHOODS } from '../constants';

interface AdminDashboardProps {
  lang: Language;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'buildings' | 'specialties'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [showAddSpecialty, setShowAddSpecialty] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ name: '', address: '', neighborhood_id: '5' });
  const [newSpecialty, setNewSpecialty] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const t = translations[lang];

  const fetchData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: buildData } = await supabase.from('buildings').select('*').order('name');
    const { data: specData } = await supabase.from('specialties').select('*').order('name');
    
    if (userData) setUsers(userData);
    if (buildData) setBuildings(buildData);
    if (specData) setSpecialties(specData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuilding.name) return;
    setActionLoading(true);
    const { error } = await supabase.from('buildings').insert([newBuilding]);
    if (!error) {
      setShowAddBuilding(false);
      setNewBuilding({ name: '', address: '', neighborhood_id: '5' });
      fetchData();
    } else {
      alert(error.message);
    }
    setActionLoading(false);
  };

  const handleAddSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecialty) return;
    setActionLoading(true);
    const { error } = await supabase.from('specialties').insert([{ name: newSpecialty }]);
    if (!error) {
      setShowAddSpecialty(false);
      setNewSpecialty('');
      fetchData();
    } else {
      alert(lang === 'ar' ? 'هذا التخصص موجود مسبقاً' : 'Specialty already exists');
    }
    setActionLoading(false);
  };

  const handleDeleteItem = async (table: string, id: string) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) fetchData();
  };

  const handleApproveUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ status: 'ACTIVE' }).eq('id', userId);
    if (!error) fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir={t.dir}>
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="bg-slate-900 p-2.5 rounded-2xl text-white shadow-lg"><LayoutGrid size={24} /></div>
            <div>
              <h1 className="text-xl font-black text-slate-900">{t.adminPanel}</h1>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{lang === 'ar' ? 'نظام التحكم المركزي' : 'Core Control'}</p>
            </div>
          </div>
          <button onClick={() => onLogout()} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-90">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="bg-white border-b px-6 overflow-x-auto scrollbar-hide">
        <div className="max-w-7xl mx-auto flex space-x-8 space-x-reverse">
          <TabButton active={activeTab === 'users'} icon={<Users size={18}/>} label={lang === 'ar' ? 'الأعضاء' : 'Users'} onClick={() => setActiveTab('users')} />
          <TabButton active={activeTab === 'buildings'} icon={<Building2 size={18}/>} label={lang === 'ar' ? 'العمارات' : 'Buildings'} onClick={() => setActiveTab('buildings')} />
          <TabButton active={activeTab === 'specialties'} icon={<Briefcase size={18}/>} label={lang === 'ar' ? 'التخصصات' : 'Specialties'} onClick={() => setActiveTab('specialties')} />
        </div>
      </div>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-bold">{t.loading}</p>
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-800">{t.manageUsers}</h2>
                  <div className="relative w-full md:w-80">
                    <Search className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} size={18} />
                    <input type="text" placeholder={lang === 'ar' ? 'بحث...' : 'Search...'} className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-12 font-bold" onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                      <tr>
                        <th className="px-6 py-4">العضو</th>
                        <th className="px-6 py-4">الحالة</th>
                        <th className="px-6 py-4 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                        <tr key={user.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <img src={user.profile_image || `https://picsum.photos/seed/${user.id}/80`} className="w-10 h-10 rounded-xl" />
                              <div>
                                <p className="font-black text-slate-900 text-sm">{user.full_name}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{user.specialty}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-[9px] font-black ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {user.status === 'ACTIVE' ? 'نشط' : 'قيد الانتظار'}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex justify-center gap-2">
                             {user.status === 'PENDING' && (
                               <button onClick={() => handleApproveUser(user.id)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white"><Check size={16}/></button>
                             )}
                             <button onClick={() => handleDeleteItem('profiles', user.id)} className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeTab === 'buildings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-800">{lang === 'ar' ? 'إدارة العمارات' : 'Buildings'}</h2>
                  <button onClick={() => setShowAddBuilding(true)} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
                    <Plus size={18}/> {lang === 'ar' ? 'إضافة عمارة' : 'Add Building'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buildings.map(b => (
                    <div key={b.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Building2 size={24}/></div>
                        <div>
                          <p className="font-black text-slate-900">{b.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{b.address}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteItem('buildings', b.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'specialties' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-800">{lang === 'ar' ? 'التخصصات المتاحة' : 'Specialties'}</h2>
                  <button onClick={() => setShowAddSpecialty(true)} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
                    <Plus size={18}/> {lang === 'ar' ? 'إضافة تخصص' : 'Add Specialty'}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {specialties.map(s => (
                    <div key={s.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Briefcase size={16}/></div>
                        <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                      </div>
                      <button onClick={() => handleDeleteItem('specialties', s.id)} className="p-1 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><X size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showAddBuilding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <form onSubmit={handleAddBuilding} className="bg-white w-full max-w-md rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-900">{lang === 'ar' ? 'إضافة عمارة جديدة' : 'Add New Building'}</h3>
            <div className="space-y-4">
              <input type="text" placeholder="اسم العمارة" className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 font-bold" value={newBuilding.name} onChange={e => setNewBuilding({...newBuilding, name: e.target.value})} required />
              <input type="text" placeholder="العنوان" className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 font-bold" value={newBuilding.address} onChange={e => setNewBuilding({...newBuilding, address: e.target.value})} />
              <select className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 font-bold" value={newBuilding.neighborhood_id} onChange={e => setNewBuilding({...newBuilding, neighborhood_id: e.target.value})}>
                {NEIGHBORHOODS.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={actionLoading} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black">
                {actionLoading ? <Loader2 className="animate-spin mx-auto" /> : 'حفظ'}
              </button>
              <button type="button" onClick={() => setShowAddBuilding(false)} className="px-6 py-4 text-slate-400 font-bold">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {showAddSpecialty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <form onSubmit={handleAddSpecialty} className="bg-white w-full max-w-md rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-900">{lang === 'ar' ? 'إضافة تخصص جديد' : 'Add New Specialty'}</h3>
            <input type="text" placeholder="اسم التخصص (مثلاً: طب الأسنان)" className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 font-bold" value={newSpecialty} onChange={e => setNewSpecialty(e.target.value)} required />
            <div className="flex gap-3">
              <button type="submit" disabled={actionLoading} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black">
                {actionLoading ? <Loader2 className="animate-spin mx-auto" /> : 'حفظ'}
              </button>
              <button type="button" onClick={() => setShowAddSpecialty(false)} className="px-6 py-4 text-slate-400 font-bold">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<any> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`flex items-center space-x-2 space-x-reverse py-5 px-2 border-b-2 transition-all ${active ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 font-bold hover:text-slate-600'}`}>
    {icon} <span className="text-sm whitespace-nowrap">{label}</span>
  </button>
);

export default AdminDashboard;
