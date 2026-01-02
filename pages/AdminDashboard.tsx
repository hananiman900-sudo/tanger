
import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, Check, X, Loader2, Plus, Trash2, LayoutGrid, LogOut, Banknote, DollarSign, Image as ImageIcon, Send, ExternalLink, CreditCard, User as UserIcon, Phone, MapPin, Briefcase, Info, ArrowRightLeft, Clock, CheckCircle2, AlertCircle, HandCoins, Settings, Database, Microscope, Map, Star
} from 'lucide-react';
import { Language, Referral } from '../types';
import { translations } from '../translations';
import { supabase } from '../supabase';
import { NEIGHBORHOODS } from '../constants';

const AdminDashboard: React.FC<{ lang: Language; onLogout: () => void }> = ({ lang, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'debts'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const t = translations[lang];

  const fetchData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: withData } = await supabase.from('withdrawals').select('*, profiles:user_id(full_name, phone, account_type)').order('created_at', { ascending: false });
    setUsers(userData || []);
    setWithdrawals(withData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handlePayDebt = async (userId: string) => {
    if (!confirm('هل تم استلام المبلغ من المهني وتصفير الدين؟')) return;
    await supabase.from('profiles').update({ debt_balance: 0 }).eq('id', userId);
    fetchData();
  };

  const handleApproveWithdrawal = async (withdrawId: string) => {
    await supabase.from('withdrawals').update({ status: 'COMPLETED' }).eq('id', withdrawId);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20" dir="rtl">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <h1 className="text-xl font-black text-slate-900">إدارة TangerHub</h1>
        <button onClick={onLogout} className="p-2 bg-red-50 text-red-500 rounded-xl"><LogOut size={20}/></button>
      </header>

      <div className="flex bg-white border-b px-6 overflow-x-auto gap-6 sticky top-[61px] z-30">
         <button onClick={() => setActiveTab('users')} className={`py-4 font-black text-sm border-b-2 ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>الأعضاء</button>
         <button onClick={() => setActiveTab('debts')} className={`py-4 font-black text-sm border-b-2 ${activeTab === 'debts' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-400'}`}>ديون المهنيين</button>
         <button onClick={() => setActiveTab('withdrawals')} className={`py-4 font-black text-sm border-b-2 ${activeTab === 'withdrawals' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}>السحوبات</button>
      </div>

      <main className="p-6">
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {users.map(u => (
               <div key={u.id} className="bg-white p-5 rounded-[30px] border shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                     <img src={u.profile_image || `https://ui-avatars.com/api/?name=${u.full_name}`} className="w-12 h-12 rounded-xl" />
                     <div>
                        <p className="font-black text-sm">{u.full_name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{u.specialty} • {u.account_type}</p>
                     </div>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className={`px-3 py-1 rounded-full text-[8px] font-black ${u.plan === 'PREMIUM' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                        {u.plan === 'PREMIUM' ? 'PREMIUM' : 'FREE'}
                     </span>
                     <button className="text-[10px] font-black text-blue-600">تعديل</button>
                  </div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'debts' && (
          <div className="space-y-4">
            {users.filter(u => u.debt_balance > 0).map(u => (
              <div key={u.id} className="bg-white p-6 rounded-[35px] border border-red-100 shadow-sm flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="bg-red-50 p-3 rounded-2xl text-red-600"><AlertCircle size={24}/></div>
                    <div>
                       <p className="font-black text-slate-900">{u.full_name}</p>
                       <p className="text-xs font-bold text-slate-400">{u.phone}</p>
                    </div>
                 </div>
                 <div className="text-center">
                    <p className="text-2xl font-black text-red-600">{u.debt_balance} DH</p>
                    <button onClick={() => handlePayDebt(u.id)} className="mt-2 bg-emerald-600 text-white px-6 py-2 rounded-xl text-[10px] font-black shadow-lg">تم الدفع</button>
                 </div>
              </div>
            ))}
            {users.filter(u => u.debt_balance > 0).length === 0 && <p className="text-center py-20 font-bold text-slate-300">لا توجد ديون معلقة حالياً</p>}
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
             {withdrawals.map(w => (
               <div key={w.id} className="bg-white p-6 rounded-[35px] border shadow-sm flex items-center justify-between">
                  <div>
                     <p className="font-black text-slate-900">{w.profiles?.full_name}</p>
                     <p className="text-xs font-bold text-slate-400">RIB: {w.rib}</p>
                     <p className="text-[10px] font-black text-blue-600 mt-1">المبلغ المطلوب: {w.amount} DH</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xl font-black text-emerald-600">الصافي: {w.amount - w.fee_deducted} DH</p>
                     <p className="text-[8px] font-black text-red-400">اقتطاع التطبيق: {w.fee_deducted} DH</p>
                     {w.status === 'PENDING' ? (
                       <button onClick={() => handleApproveWithdrawal(w.id)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black mt-2">تأكيد التحويل</button>
                     ) : (
                       <span className="text-emerald-500 font-black text-[10px] block mt-2">تم التحويل ✅</span>
                     )}
                  </div>
               </div>
             ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
