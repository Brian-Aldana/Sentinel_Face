import React from 'react';
import { ServiceStatus } from '../types';

interface StatusBadgeProps {
  status: ServiceStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const norm = (status || '').toUpperCase();

  const getLabel = () => {
    switch (norm) {
      case 'ACTIVE':
      case 'ACTIVO':
        return 'ACTIVO';
      case 'SUSPENDED':
      case 'SUSPENDIDO':
        return 'SUSPENDIDO';
      case 'DENIED':
      case 'DENEGADO':
        return 'DENEGADO';
      case 'TRIAL':
      case 'PRUEBA':
        return 'PRUEBA';
      default:
        return status;
    }
  };

  const getBadgeStyle = () => {
    switch (norm) {
      case 'ACTIVE':
      case 'ACTIVO':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'SUSPENDED':
      case 'SUSPENDIDO':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'DENIED':
      case 'DENEGADO':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'TRIAL':
      case 'PRUEBA':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getDotStyle = () => {
    switch (norm) {
      case 'ACTIVE':
      case 'ACTIVO':
        return 'bg-emerald-400';
      case 'SUSPENDED':
      case 'SUSPENDIDO':
        return 'bg-amber-400';
      case 'DENIED':
      case 'DENEGADO':
        return 'bg-rose-400';
      case 'TRIAL':
      case 'PRUEBA':
        return 'bg-cyan-400';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getBadgeStyle()} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotStyle()}`}></span>
      {getLabel()}
    </span>
  );
};
