import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Home,
  ShieldAlert,
  History,
  Settings,
  Users,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();

  const navigation = [
    { name: 'Dashboard Global', href: '/', icon: LayoutDashboard },
    { name: 'Gestión de Hogares', href: '/hogares', icon: Home },
    { name: 'Alertas de Seguridad', href: '/alertas', icon: ShieldAlert },
    { name: 'Monitoreo de Accesos', href: '/accesos', icon: History },
    { name: 'Auditoría del Sistema', href: '/auditoria', icon: Users },
    { name: 'Configuración', href: '/configuracion', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-white block leading-none">
            SENTINEL<span className="text-cyan-400">_FACE</span>
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Admin Provider
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Supervisión & Control
        </div>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile & logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold flex items-center justify-center text-sm border border-cyan-500/40">
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@sentinel.com'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
