
import React, { useState, useEffect } from 'react';
import { Building2, Search, MapPin, ChevronRight, Layers, Users, Loader2, Navigation, X, Zap, ChevronLeft, Building } from 'lucide-react';
import { NEIGHBORHOODS } from '../constants';
import { supabase } from '../supabase';

const BuildingDirectory: React.FC = () => {
  const [step, setStep] = useState<'neighborhood' | 'building' | 'view'>('neighborhood');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<any>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Building View
  const [buildingPros, setBuildingPros] = useState<any[]>([]);
  const [activeFloor, setActiveFloor] = useState<string>('0');

  const fetchBuildings = async (neighborhoodId: string) => {
    setLoading(true);
    try {
      const { data: bData, error } = await supabase.from('buildings').select('*').eq('neighborhood_id', neighborhoodId).order('name');
      if (bData) setBuildings(bData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedNeighborhood) {
      fetchBuildings(selectedNeighborhood.id);
    }
  }, [selectedNeighborhood]);

  const openBuilding = async (building: any) => {
    setLoading(true);
    setSelectedBuilding(building);
    try {
      const { data: pData } = await supabase.from('profiles').select('*').eq('building_id', building.id).eq('status', 'ACTIVE');
      setBuildingPros(pData || []);
      
      if (pData && pData.length > 0) {
        const floorsSet = Array.from(new Set(pData.map(p => p.floor || '0'))).sort();
        setActiveFloor(floorsSet[0] as string);
      }
    } finally {
      setStep('view');
      setLoading(false);
    }
  };

  const floors = (Array.from(new Set(buildingPros.map(p => p.floor || '0'))) as string[]).sort((a,b) => parseInt(a) - parseInt(b));
  const filteredPros = buildingPros.filter(p => (p.floor || '0') === activeFloor);

  return (
    <div className="flex flex-col min-h-full bg-[#F8FAFC] pb-20">
      <div className="bg-white px-6 pt-10 pb-6 shadow-sm border-b rounded-b-[40px] z-20 sticky top-0">
        <div className="flex items-center gap-3 mb-2">
           {step !== 'neighborhood' && (
             <button onClick={() => {
                if (step === 'view') setStep('building');
                else setStep('neighborhood');
             }} className="p-2 bg-slate-100 rounded-xl text-slate-600"><ChevronLeft size={20}/></button>
           )}
           <h2 className="text-3xl font-black text-slate-900">دليل العمارات</h2>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2">
          {step === 'neighborhood' ? 'اختر المنطقة أولاً' : step === 'building' ? `عمارات حي ${selectedNeighborhood?.name}` : selectedBuilding?.name}
        </p>
      </div>

      <div className="p-6">
        {step === 'neighborhood' && (
          <div className="grid grid-cols-1 gap-4">
            {NEIGHBORHOODS.map(n => (
              <button 
                key={n.id} 
                onClick={() => { setSelectedNeighborhood(n); setStep('building'); }}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-right"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><MapPin size={24}/></div>
                  <span className="font-black text-slate-800 text-lg">{n.name}</span>
                </div>
                <ChevronRight size={20} className="text-slate-200 group-hover:text-blue-600 transition-all rotate-180" />
              </button>
            ))}
          </div>
        )}

        {step === 'building' && (
          <div className="grid grid-cols-1 gap-4">
            {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div> : buildings.map(b => (
              <button 
                key={b.id} 
                onClick={() => openBuilding(b)}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-600 transition-all text-right"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2 size={24}/></div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">{b.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">{b.address}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-200 rotate-180" />
              </button>
            ))}
            {buildings.length === 0 && !loading && (
              <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                <Building size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold">لا توجد عمارات مسجلة في هذا الحي حالياً</p>
                <button onClick={() => setStep('neighborhood')} className="mt-4 text-blue-600 font-black text-sm underline">العودة لاختيار حي آخر</button>
              </div>
            )}
          </div>
        )}

        {step === 'view' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex space-x-2 space-x-reverse overflow-x-auto pb-2 scrollbar-hide">
               {floors.map(f => (
                 <button key={f} onClick={() => setActiveFloor(f)} className={`px-8 py-4 rounded-2xl text-xs font-black transition-all shadow-sm shrink-0 ${activeFloor === f ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-slate-400 border border-slate-100'}`}>
                   الطابق {f}
                 </button>
               ))}
               {floors.length === 0 && <p className="text-[10px] text-slate-500 font-black uppercase py-4">لا توجد مكاتب مفعلة في هذه العمارة</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPros.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-[32px] border border-slate-100 flex items-center justify-between shadow-sm group hover:border-blue-600 transition-all">
                   <div className="flex items-center gap-4">
                      <img src={p.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name)}`} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                      <div>
                        <h5 className="font-black text-slate-900 text-sm">{p.full_name}</h5>
                        <p className="text-[10px] text-blue-600 font-bold">{p.specialty}</p>
                      </div>
                   </div>
                   <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><Zap size={16}/></div>
                </div>
              ))}
              {filteredPros.length === 0 && floors.length > 0 && <p className="col-span-2 py-20 text-center text-slate-400 font-bold text-xs">اختر طابقاً لعرض المهنيين</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildingDirectory;
