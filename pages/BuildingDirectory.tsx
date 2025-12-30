
import React, { useState, useEffect } from 'react';
import { Building2, Search, MapPin, ChevronRight, Layers, Users, Loader2, Navigation, X, Zap, ChevronLeft, Building, Hash } from 'lucide-react';
import { NEIGHBORHOODS } from '../constants';
import { supabase } from '../supabase';

const BuildingDirectory: React.FC = () => {
  const [step, setStep] = useState<'selection' | 'view'>('selection');
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [buildingPros, setBuildingPros] = useState<any[]>([]);
  const [activeFloor, setActiveFloor] = useState<string>('');
  const [activeOffice, setActiveOffice] = useState<string>('');

  useEffect(() => {
    if (selectedNeighborhoodId) {
      setLoading(true);
      supabase.from('buildings').select('*').eq('neighborhood_id', selectedNeighborhoodId).order('name')
        .then(({ data }) => { setBuildings(data || []); setLoading(false); });
    } else {
      setBuildings([]);
      setSelectedBuildingId('');
    }
  }, [selectedNeighborhoodId]);

  const handleOpenBuilding = async () => {
    if (!selectedBuildingId) return;
    setLoading(true);
    setActiveFloor('');
    setActiveOffice('');
    try {
      const { data: pData } = await supabase.from('profiles').select('*').eq('building_id', selectedBuildingId).eq('status', 'ACTIVE');
      setBuildingPros(pData || []);
      setStep('view');
    } finally {
      setLoading(false);
    }
  };

  const floors = (Array.from(new Set(buildingPros.map(p => p.floor || '0'))) as string[]).sort((a,b) => parseInt(a) - parseInt(b));
  
  const filteredPros = buildingPros.filter(p => {
    const matchFloor = activeFloor ? (p.floor || '0') === activeFloor : true;
    const matchOffice = activeOffice ? (p.office_number || '') === activeOffice : true;
    return matchFloor && matchOffice;
  });

  const selectedBldName = buildings.find(b => b.id === selectedBuildingId)?.name;

  return (
    <div className="flex flex-col min-h-full bg-[#F8FAFC] pb-24" dir="rtl">
      <div className="bg-white px-6 pt-10 pb-8 shadow-sm border-b rounded-b-[50px] z-20 sticky top-0 space-y-4">
        <div className="flex items-center gap-3">
           {step === 'view' && (
             <button onClick={() => setStep('selection')} className="p-2 bg-slate-100 rounded-xl text-slate-600 active:scale-90 transition-all">
                <ChevronLeft size={20} className="rotate-180" />
             </button>
           )}
           <h2 className="text-3xl font-black text-slate-900 tracking-tight">جولة العمارات</h2>
        </div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-1">
          {step === 'selection' ? 'اختر العمارة لاستكشاف المهنيين المتواجدين بها' : `تصفح ${selectedBldName}`}
        </p>
      </div>

      <div className="p-6 max-w-2xl mx-auto w-full">
        {step === 'selection' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase px-2">1. اختر الحي</label>
                   <div className="relative">
                      <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
                      <select 
                        className="w-full bg-slate-50 border-2 border-transparent shadow-sm rounded-3xl py-5 pr-12 pl-4 font-black text-slate-900 outline-none focus:border-blue-600 transition-all appearance-none"
                        value={selectedNeighborhoodId}
                        onChange={e => { setSelectedNeighborhoodId(e.target.value); setSelectedBuildingId(''); }}
                      >
                         <option value="">-- اختر الحي --</option>
                         {NEIGHBORHOODS.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                      </select>
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase px-2">2. اختر العمارة</label>
                   <div className="relative">
                      <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        className="w-full bg-slate-50 border-2 border-transparent shadow-sm rounded-3xl py-5 pr-12 pl-4 font-black text-slate-900 outline-none focus:border-blue-600 transition-all appearance-none disabled:opacity-50"
                        value={selectedBuildingId}
                        onChange={e => setSelectedBuildingId(e.target.value)}
                        disabled={!selectedNeighborhoodId}
                      >
                         <option value="">-- اختر العمارة --</option>
                         {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                   </div>
                </div>

                <button 
                  onClick={handleOpenBuilding}
                  disabled={!selectedBuildingId || loading}
                  className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black shadow-xl shadow-slate-100 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                   {loading ? <Loader2 className="animate-spin" /> : <><Zap size={18} className="text-blue-500" /> دخول العمارة واستكشافها</>}
                </button>
             </div>

             <div className="bg-blue-50 p-6 rounded-[35px] border border-blue-100 flex items-start gap-4">
                <div className="bg-white p-3 rounded-2xl text-blue-600 shadow-sm"><Layers size={20}/></div>
                <p className="text-xs font-bold text-blue-800 leading-relaxed">بمجرد اختيار العمارة، ستتمكن من تصفح الطوابق والمكاتب واحدًا تلو الآخر لمعرفة المهنيين المسجلين في كل مكتب.</p>
             </div>
          </div>
        )}

        {step === 'view' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-20">
            {/* Context Header */}
            <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-4">
               <div className="flex items-center gap-2 mb-2"><Layers size={18} className="text-blue-600"/><h4 className="font-black text-slate-900 text-sm">تصفح الطوابق والمكاتب داخل العمارة</h4></div>
               <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={activeFloor} 
                    onChange={e => { setActiveFloor(e.target.value); setActiveOffice(''); }}
                    className="bg-slate-50 border-2 border-transparent rounded-2xl p-4 font-black text-xs text-slate-700 outline-none focus:border-blue-600 transition-all appearance-none"
                  >
                    <option value="">جميع الطوابق</option>
                    {floors.map(f => <option key={f} value={f}>الطابق {f === '0' ? 'الأرضي' : f}</option>)}
                  </select>
                  <select 
                    value={activeOffice} 
                    onChange={e => setActiveOffice(e.target.value)}
                    className="bg-slate-50 border-2 border-transparent rounded-2xl p-4 font-black text-xs text-slate-700 outline-none focus:border-blue-600 transition-all appearance-none"
                  >
                    <option value="">رقم المكتب</option>
                    {Array.from(new Set(buildingPros.filter(p => activeFloor ? (p.floor || '0') === activeFloor : true).map(p => p.office_number))).filter(Boolean).sort().map(o => (
                      <option key={o} value={o}>مكتب {o}</option>
                    ))}
                  </select>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredPros.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-[32px] border border-slate-100 flex items-center justify-between shadow-sm group hover:border-blue-600 transition-all animate-in zoom-in duration-300">
                   <div className="flex items-center gap-4">
                      <img src={p.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name)}`} className="w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-white" />
                      <div>
                        <h5 className="font-black text-slate-900 text-sm">{p.full_name}</h5>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{p.specialty}</p>
                           <span className="text-slate-200 text-[8px]">•</span>
                           <p className="text-[10px] text-slate-400 font-bold">ط {p.floor} - م {p.office_number || 'N/A'}</p>
                        </div>
                      </div>
                   </div>
                   <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><ChevronRight size={18} className="rotate-180" /></div>
                </div>
              ))}
              {filteredPros.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-400 font-bold text-xs bg-white rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center">
                  <Search size={40} className="mb-4 text-slate-200" />
                  لا يوجد مهنيون مسجلون في هذا الطابق/المكتب حالياً
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildingDirectory;
