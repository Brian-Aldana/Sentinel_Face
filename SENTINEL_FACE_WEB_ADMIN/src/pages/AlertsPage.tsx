import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Eye,
} from 'lucide-react';
import { alertService } from '../services/hogarService';
import { SecurityAlert } from '../types';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterResolved, setFilterResolved] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const isResolved =
        filterResolved === 'ALL'
          ? undefined
          : filterResolved === 'RESOLVED';
      const data = await alertService.getAlerts(isResolved);
      setAlerts(data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filterResolved]);

  const handleResolve = async (alertId: number) => {
    try {
      await alertService.resolveAlert(alertId);
      fetchAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Centro de Alertas de Seguridad & Liveness
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitoreo en tiempo real de intentos de fraude biométrico, suplantaciones (fotos/pantallas) y accesos no autorizados.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setFilterResolved('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterResolved === 'ALL'
              ? 'bg-cyan-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Todas las Alertas
        </button>
        <button
          onClick={() => setFilterResolved('PENDING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterResolved === 'PENDING'
              ? 'bg-rose-500 text-white font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Pendientes de Revisión
        </button>
        <button
          onClick={() => setFilterResolved('RESOLVED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterResolved === 'RESOLVED'
              ? 'bg-emerald-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Resueltas
        </button>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Cargando alertas del sistema...
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No hay alertas registradas</h3>
          <p className="text-xs text-slate-400 mt-1">
            El sistema no reporta incidentes de seguridad para el filtro actual.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.alert_id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-slate-700"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl shrink-0 mt-0.5 ${
                    alert.alert_type === 'SPOOFING_ATTEMPT'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-bold text-white">
                      {alert.alert_type === 'SPOOFING_ATTEMPT'
                        ? 'Intento de Suplantación (Spoofing Detectado)'
                        : alert.alert_type === 'UNKNOWN_FACE'
                        ? 'Rostro Desconocido'
                        : alert.alert_type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      Severidad: {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {alert.description || 'Intento de acceso rechazado por el motor de detección de vida.'}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.created_at}
                    </span>
                    {alert.log_id && (
                      <span className="font-mono">Ref Log #{alert.log_id}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                {alert.resolved ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Resuelta
                  </span>
                ) : (
                  <button
                    onClick={() => handleResolve(alert.alert_id)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Resolver Alerta</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
