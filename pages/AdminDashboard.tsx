
import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, Check, X, Loader2, Plus, Trash2, LayoutGrid, LogOut, Banknote, DollarSign, Image as ImageIcon, Send, ExternalLink
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { supabase } from '../supabase';

interface AdminDashboardProps {
  lang: Language;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);

  const t = translations[lang];

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.from('profiles').select('*').order('referral_count', { ascending: false });
      const { data: withdrawalData } = await supabase.from('withdrawals').select('*, profiles:user_id(full_name, phone, specialty)').order('created_at', { ascending: false });
      
      setUsers(userData || []);
      setWithdrawals(withdrawalData || []);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateWithdrawal = async (id: string, status: string) => {
    if (status === 'PAID' && !receiptUrl) {
      alert(lang === 'ar' ? 'يرجى وضع رابط وصل الدفع أولاً' : 'Please provide receipt URL');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('withdrawals').update({ status, receipt_url: receiptUrl }).eq('id', id);
    if (!error) {
      setSelectedWithdrawal(null);
      setReceiptUrl('');
      fetchData();
    }
    setLoading(false);
  };

  const updateUserStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (!error) fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20" dir={t.dir}>
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200"><LayoutGrid size={24} /></div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">إدارة TangerHub</h1>
        </div>
        <button onClick={onLogout} className="p-3 bg-red-50 text-red-600 rounded-2xl"><LogOut size={20} /></button>
      </header>

      <div className="bg-white border-b px-6 flex gap-8">
        <button onClick={() => setActiveTab('users')} className={`py-4 font-black whitespace-nowrap transition-all ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>الأعضاء ({users.length})</button>
        <button onClick={() => setActiveTab('withdrawals')} className={`py-4 font-black whitespace-nowrap transition-all ${activeTab === 'withdrawals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>طلبات السحب ({withdrawals.filter(w => w.status === 'PENDING').length})</button>
      </div>

      <main className="p-6 max-w-5xl mx-auto">
        {loading && <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={40}/></div>}
        
        {/* Withdrawals Section */}
        {!loading && activeTab === 'withdrawals' && (
          <div className="space-y-4">
            {withdrawals.map(w => (
              <div key={w.id} className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600"><DollarSign size={24} /></div>
                  <div>
                    <h3 className="font-black text-slate-900">{w.profiles?.full_name}</h3>
                    <p className="text-sm font-black text-blue-600">{w.amount} DH</p>
                    <p className="text-[10px] text-slate-400 font-bold">{w.profiles?.phone} • {w.profiles?.specialty}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl flex-1 max-w-xs text-[10px] font-bold text-slate-600 border border-slate-100">
                  <p className="uppercase text-[8px] text-slate-400 mb-1">تفاصيل البنك:</p>
                  {w.bank_details}
                </div>
                <div className="flex gap-2">
                  {w.status === 'PENDING' ? (
                    <button onClick={() => setSelectedWithdrawal(w)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2"><Check size={16}/> تأكيد الدفع</button>
                  ) : (
                    <div className="flex items-center gap-2">
                       <span className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2"><Check size={16}/> تم الدفع</span>
                       {w.receipt_url && <a href={w.receipt_url} target="_blank" className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ExternalLink size={16}/></a>}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {withdrawals.length === 0 && <p className="text-center text-slate-400 font-bold py-10">لا توجد طلبات سحب</p>}
          </div>
        )}

        {/* Users Section with Ranking */}
        {!loading && activeTab === 'users' && (
          <div className="space-y-4">
            {users.map((u, idx) => (
              <div key={u.id} className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={u.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}`} className="w-14 h-14 rounded-2xl object-cover shadow-sm"/>
                    {idx < 3 && <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1 rounded-full text-[8px] font-black border-2 border-white">#{idx+1}</div>}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{u.full_name}</h3>
                    <p className="text-[10px] text-blue-600 font-bold uppercase">{u.specialty}</p>
                    <p className="text-[10px] text-slate-400 font-bold">نشاط: {u.referral_count} • رصيد: {u.balance_completed} DH</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateUserStatus(u.id, u.status === 'ACTIVE' ? 'PENDING' : 'ACTIVE')} className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase ${u.status === 'ACTIVE' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'}`}>
                    {u.status === 'ACTIVE' ? 'إيقاف' : 'تفعيل'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Confirm Payment */}
        {selectedWithdrawal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[50px] p-10 space-y-8 shadow-2xl animate-in zoom-in duration-300">
              <div className="text-center space-y-2">
                <div className="bg-emerald-50 w-20 h-20 rounded-[30px] flex items-center justify-center text-emerald-600 mx-auto"><Check size={40} /></div>
                <h3 className="text-2xl font-black text-slate-900">تأكيد عملية الدفع</h3>
                <p className="text-slate-500 font-bold">تحويل مبلغ: <span className="text-emerald-600">{selectedWithdrawal.amount} DH</span></p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">رابط صورة الوصل (اختياري)</label>
                   <input type="text" placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 rounded-[22px] py-4 px-6 font-bold outline-none" value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)} />
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 text-[11px] font-bold text-slate-700 leading-relaxed">
                  <p className="text-slate-400 mb-2 uppercase text-[8px]">بيانات البنك للمهني:</p>
                  {selectedWithdrawal.bank_details}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleUpdateWithdrawal(selectedWithdrawal.id, 'PAID')} className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3">
                  <Send size={18} /> تأكيد وإرسال الوصل
                </button>
                <button onClick={() => setSelectedWithdrawal(null)} className="w-full text-slate-400 font-bold">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
