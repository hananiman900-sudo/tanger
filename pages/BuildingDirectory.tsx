
import React, { useState, useEffect } from 'react';
import { Building2, Search, MapPin, ChevronRight, Layers, Users, Loader2, Navigation } from 'lucide-react';
import { NEIGHBORHOODS } from '../constants';
import { supabase } from '../supabase';

const BuildingDirectory: React.FC = () => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('5'); // Default Centre Ville
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    setLoading(true);
    // Fetch buildings and also count professionals per building for better UI
    const { data: bData } = await supabase
      .from('buildings')
      .select('*')
      .order('name');
    
    const { data: pData } = await supabase
      .from('profiles')
      .select('building_id')
      .eq('status', 'ACTIVE');

    if (bData) {
      setBuildings(bData);
    }

    if (pData) {
      const mapping: Record<string, number> = {};
      pData.forEach(p => {
        if (p.building_id) {
          mapping[p.building_id] = (mapping[p.building_id] || 0) + 1;
        }
      });
      setCounts(mapping);
    }
    
    setLoading(false);
  };

  const filteredBuildings = buildings.filter(b => b.neighborhood_id === selectedNeighborhood);

  return (
    <div className="flex flex-col min-h-full bg-[#F8FAFC]">
      {/* Search & Filter Header */}
      <div className="bg-white px-6 pt-8 pb-6 space-y-6 shadow-sm border-b sticky top-0 z-20">
        <div>
          <h2 className="text-3xl font-black text-slate-900">دليل العمارات</h2>
          <p className="text-sm text-slate-500 font-bold mt-1">استكشف الأقطاب المهنية والمكاتب في طنجة</p>
        </div>
        
        <div className="flex space-x-2 space-x-reverse overflow-x-auto pb-2 scrollbar-hide">
          {NEIGHBORHOODS.map(n => (
            <button 
              key={n.id} 
              onClick={() => setSelectedNeighborhood(n.id)}
              className={`px-5 py-3 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all duration-300 ${
                selectedNeighborhood === n.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              {n.name}
            </button>
          ))}
        </div>
      </div>

      {/* Buildings List */}
      <div className="p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-black text-sm uppercase tracking-widest">جاري تحميل البيانات...</p>
          </div>
        ) : filteredBuildings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredBuildings.map(building => (
              <div key={building.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="bg-blue-50 p-4 rounded-[22px] text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <Building2 size={28} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-xl leading-none">{building.name}</h3>
                      <div className="flex items-center text-slate-400 text-xs mt-2 font-bold">
                        <MapPin size={14} className="ml-1" />
                        <span>{building.address || 'طنجة، المغرب'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl text-slate-300 group-hover:text-blue-600 transition-colors">
                    <ChevronRight size={20} className="rotate-180" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50/50 rounded-2xl p-4 text-center border border-slate-100">
                    <Layers size={16} className="mx-auto mb-1.5 text-blue-600" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">الطوابق</p>
                    <p className="text-sm font-black text-slate-800">متعددة</p>
                  </div>
                  <div className="bg-slate-50/50 rounded-2xl p-4 text-center border border-slate-100">
                    <Users size={16} className="mx-auto mb-1.5 text-emerald-600" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">المهنيين</p>
                    <p className="text-sm font-black text-slate-800">{counts[building.id] || 0}</p>
                  </div>
                  <div className="bg-slate-50/50 rounded-2xl p-4 text-center border border-slate-100 flex flex-col items-center justify-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mb-1.5"></div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">الحالة</p>
                    <p className="text-[10px] font-black text-emerald-600">نشط</p>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-dashed border-slate-100 flex items-center justify-between">
                  <div className="flex -space-x-2 space-x-reverse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                        <img src={`https://picsum.photos/seed/${building.id + i}/40`} alt="pro" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                      +{counts[building.id] || 0}
                    </div>
                  </div>
                  <button className="text-[11px] font-black text-blue-600 flex items-center gap-1 hover:underline">
                    عرض المكاتب
                    <Navigation size={12} className="rotate-45" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-slate-300 space-y-4">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
              <Search size={64} className="opacity-20 mx-auto" />
            </div>
            <div className="text-center">
              <p className="text-slate-900 font-black">لا توجد نتائج</p>
              <p className="text-xs font-bold text-slate-400 mt-1">لم يتم إدراج أي عمارات في هذا الحي بعد</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Stats Footer */}
      <div className="mt-auto p-8 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
           <Building2 size={14} className="text-blue-600" />
           <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">إجمالي العمارات: {buildings.length}</span>
        </div>
      </div>
    </div>
  );
};

export default BuildingDirectory;
