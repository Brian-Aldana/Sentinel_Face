import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, RefreshCw, User, Calendar, FileText } from 'lucide-react';
import api from '../services/api';

interface AuditItem {
  audit_id: number;
  usuario_id?: number;
  usuario_name?: string;
  action: string;
  target_table?: string;
  target_id?: number;
  detail?: any;
  ip_address?: string;
  created_at: string;
}

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAudit = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit');
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Bitácora de Auditoría del Sistema
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registro inmutable de todas las acciones administrativas, cambios de estado de hogares y modificaciones críticas.
          </p>
        </div>
        <div>
          <button
            onClick={fetchAudit}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refrescar Bitácora</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Cargando registros de auditoría...
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">Sin registros de auditoría</h3>
          <p className="text-xs text-slate-400 mt-1">
            Aún no se han ejecutado acciones administrativas registradas.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                  <th className="py-4 px-6 font-semibold">Acción Realizada</th>
                  <th className="py-4 px-6 font-semibold">Entidad / Objetivo</th>
                  <th className="py-4 px-6 font-semibold">Detalles del Cambio</th>
                  <th className="py-4 px-6 font-semibold">IP / Origen</th>
                  <th className="py-4 px-6 font-semibold text-right">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.audit_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-cyan-400">
                      {log.action}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {log.target_table} #{log.target_id}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 max-w-xs truncate">
                      {log.detail ? JSON.stringify(log.detail) : '—'}
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                      {log.ip_address || 'Local'}
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-right">
                      {log.created_at}
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
