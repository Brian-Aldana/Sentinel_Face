import React from 'react';
import { ShieldCheck, Calendar } from 'lucide-react';

interface NavbarProps {
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-semibold text-white tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {/* Girardot Location Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Nodo Residencial: Girardot, Cundinamarca</span>
        </div>

        {/* Current Date */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 capitalize">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{today}</span>
        </div>
      </div>
    </header>
  );
};
