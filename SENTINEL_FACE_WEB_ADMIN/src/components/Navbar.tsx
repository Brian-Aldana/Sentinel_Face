import React from 'react';
import { Bell, ShieldCheck, Activity } from 'lucide-react';

interface NavbarProps {
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-semibold text-white tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {/* System Health Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>Servicio Activo en Nube</span>
        </div>

        {/* Girardot Location Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Nodo: Girardot, Cundinamarca</span>
        </div>
      </div>
    </header>
  );
};
