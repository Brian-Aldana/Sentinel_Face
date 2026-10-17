import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, RefreshCw, User, Calendar, FileText, Search, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface AuditItem {
  audit_id: number;
  hogar_id?: number;
  usuario_id?: number;
  usuario_name?: string;
  action: string;
  target_table?: string;
  target_id?: number;
  detail?: any;
  ip_address?: string;
  created_at: string;
  codigo_hogar?: string;
  nombre_titular?: string;
}

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/audit');
      // Aseguramos que siempre sea un array para evitar crashes
      const items = Array.isArray(res.data)
        ? res.data
        : res.data?.audit || res.data?.items || [];
      setLogs(items);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError(err.response?.data?.message || 'Error al cargar los registros de auditoría');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    } else if (action.includes('SUSPENDIDO')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    } else if (action.includes('DENEGADO')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    } else if (action.includes('RESOLVE')) {
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    } else if (action.includes('PASSWORD')) {
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
    return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
  };

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    const actionMatch = log.action.toLowerCase().includes(q);
    const userMatch = (log.usuario_name || '').toLowerCase().includes(q);
    const targetMatch = (log.target_table || '').toLowerCase().includes(q);
    const hogarMatch = (log.codigo_hogar || '').toLowerCase().includes(q) || (log.nombre_titular || '').toLowerCase().includes(q);
    return actionMatch || userMatch || targetMatch || hogarMatch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Bitácora de Auditoría del Sistema
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registro cronológico inmutable de todas las acciones administrativas, cambios de estado de hogares y eventos de seguridad.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAudit}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar Bitácora</span>
          </button>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por acción, usuario o inmueble..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium shrink-0">
          Total de registros: <span className="text-cyan-400 font-semibold">{filteredLogs.length}</span>
        </div>
      </div>

      {/* Content */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-3">
          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
          <span>Cargando bitácora de auditoría...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">Sin registros de auditoría</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No se encontraron eventos administrativos que coincidan con la búsqueda actual.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                  <th className="py-4 px-6 font-semibold">Acción Realizada</th>
                  <th className="py-4 px-6 font-semibold">Ejecutado Por</th>
                  <th className="py-4 px-6 font-semibold">Entidad / Hogar</th>
                  <th className="py-4 px-6 font-semibold">Detalle del Evento</th>
                  <th className="py-4 px-6 font-semibold">IP</th>
                  <th className="py-4 px-6 font-semibold text-right">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => (
                  <tr key={log.audit_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-[10px]">
                          {log.usuario_name ? log.usuario_name[0] : 'U'}
                        </div>
                        <span className="font-medium text-slate-200">
                          {log.usuario_name || 'Sistema'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {log.codigo_hogar ? (
                        <div>
                          <span className="font-mono text-cyan-400 font-semibold">{log.codigo_hogar}</span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">{log.nombre_titular}</span>
                        </div>
                      ) : (
                        <span className="font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {log.target_table} #{log.target_id}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate text-slate-300">
                      {typeof log.detail === 'object' && log.detail !== null
                        ? Object.entries(log.detail).map(([k, v]) => `${k}: ${v}`).join(' · ')
                        : String(log.detail || '—')}
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-500">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-right whitespace-nowrap">
                      {log.created_at.replace('T', ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
