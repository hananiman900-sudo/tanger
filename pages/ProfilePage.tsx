
import React from 'react';
import { User, AccountStatus } from '../types';
import { 
  Camera, 
  MapPin, 
  Settings, 
  CreditCard, 
  Bell, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  Clock,
  Calendar,
  Share2,
  Trash2,
  AlertCircle,
  Wallet
} from 'lucide-react';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
  return (
    <div className="bg-slate-50 min-h-full">
      {/* Profile Header */}
      <div className="bg-white px-6 pb-8 pt-6 rounded-b-[40px] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Mon Profil</h2>
          <button className="p-2 bg-slate-100 rounded-full">
            <Settings size={20} className="text-slate-600" />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <img 
              src={user.profileImage || `https://picsum.photos/seed/${user.id}/200`} 
              className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-xl shadow-blue-100" 
              alt="profile" 
            />
            <button className="absolute bottom-[-5px] right-[-5px] bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg border-2 border-white">
              <Camera size={18} />
            </button>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{user.fullName}</h3>
          <p className="text-blue-600 font-semibold text-sm">{user.specialty}</p>
          
          <div className="flex items-center text-slate-400 text-xs mt-2">
            <MapPin size={12} className="mr-1" />
            <span>{user.neighborhood}, Tanger</span>
          </div>

          <div className="flex space-x-3 mt-6 w-full">
            <button className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2">
              <Share2 size={14} />
              <span>Partager Code</span>
            </button>
            <button className="flex-1 border border-slate-200 py-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2">
              <span>Modifier Info</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subscription & Wallet Section */}
      <div className="p-5 space-y-6">
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-[32px] text-white shadow-xl shadow-blue-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">Abonnement Annuel</p>
              <div className="flex items-center space-x-2">
                <ShieldCheck size={20} className="text-blue-200" />
                <span className="text-xl font-bold">Pack Premium Tanger</span>
              </div>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
              <span className="text-[10px] font-bold">ACTIF</span>
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-blue-100 text-[10px] mb-1">Date d'expiration</p>
              <p className="font-bold">31 Décembre 2024</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-[10px] mb-1">Statut Paiement</p>
              <p className="font-bold">300 DH / Payé</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="font-bold text-slate-800 ml-1">Paramètres du Compte</h4>
          <div className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100">
            <MenuItem icon={<Wallet className="text-emerald-500" />} label="Compte Bancaire (Retrait)" value="CIH Bank **** 12" />
            <MenuItem icon={<Bell className="text-blue-500" />} label="Notifications" value="Activées" />
            <MenuItem icon={<Calendar className="text-indigo-500" />} label="Mes Horaires" value="09:00 - 18:00" />
            <MenuItem icon={<ShieldCheck className="text-amber-500" />} label="Sécurité" value="Mise à jour" />
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="font-bold text-slate-800 ml-1">Administration</h4>
          <div className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100">
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-50 transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-red-50 p-2 rounded-xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <LogOut size={20} />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-red-600">Déconnexion</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>

            <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors mt-1 group">
              <div className="flex items-center space-x-4">
                <div className="bg-slate-100 p-2 rounded-xl text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Trash2 size={20} />
                </div>
                <span className="font-bold text-slate-700">Supprimer le compte</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          </div>
        </section>

        <div className="flex flex-col items-center py-6">
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start space-x-3 max-w-sm">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
              TangerHub Affiliate est une plateforme de réseautage professionnel. Les commissions sont souمسة à la validation finale du partenaire receveur.
            </p>
          </div>
          <p className="text-slate-400 text-[10px] mt-8 font-medium">Version 1.2.0 • Build 2024.12</p>
        </div>
      </div>
    </div>
  );
};

const MenuItem: React.FC<{icon: React.ReactNode, label: string, value: string}> = ({ icon, label, value }) => (
  <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors">
    <div className="flex items-center space-x-4">
      <div className="bg-slate-50 p-2 rounded-xl">
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
    <ChevronRight size={18} className="text-slate-300" />
  </button>
);

export default ProfilePage;
