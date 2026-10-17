import React, { useState, useEffect } from 'react';
import {
  Home,
  ShieldCheck,
  ShieldAlert,
  Activity,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { statsService, alertService } from '../services/homeService';
import { DashboardStats } from '../types';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartKey, setChartKey] = useState<number>(Date.now());

  const fetchStats = async () => {
    try {
      const data = await statsService.getDashboardStats();
      setStats(data);
      setChartKey(Date.now());
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setChartKey(Date.now());
    fetchStats();
  };

  const handleResolveAlert = async (alertId: number) => {
    try {
      await alertService.resolveAlert(alertId);
      fetchStats();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Cargando métricas del sistema...</p>
        </div>
      </div>
    );
  }

  const homes = stats?.homes || {
    total_homes: 0,
    active_homes: 0,
    suspended_homes: 0,
    denied_homes: 0,
    trial_homes: 0,
  };

  const accesses = stats?.accesses || {
    total_history_accesses: 0,
    accesses_today: 0,
    accesses_granted_today: 0,
    accesses_denied_today: 0,
    spoofing_attempts_today: 0,
  };

  const alerts = stats?.alerts || {
    total_alerts: 0,
    pending_alerts: 0,
    critical_pending_alerts: 0,
    spoofing_alerts: 0,
    unknown_face_alerts: 0,
  };

  const residents = stats?.residents || {
    total_residents: 0,
    active_residents: 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header with quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Panel de Control del Proveedor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Supervisión integral de hogares, actividad biométrica y prevención de intrusiones en Girardot.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar Datos</span>
          </button>
          <Link
            to="/hogares"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors shadow-lg shadow-cyan-500/10"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Gestionar Hogares</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Hogares Registrados"
          value={homes.total_homes}
          subtitle={`${homes.active_homes} activos · ${homes.suspended_homes + homes.denied_homes} suspendidos`}
          icon={<Home className="w-6 h-6" />}
          color="cyan"
          trend={`${homes.active_homes > 0 ? ((homes.active_homes / (homes.total_homes || 1)) * 100).toFixed(0) : 0}% operativos`}
          trendType="positive"
        />

        <MetricCard
          title="Accesos Hoy"
          value={accesses.accesses_today}
          subtitle={`${accesses.accesses_granted_today} concedidos · ${accesses.accesses_denied_today} denegados`}
          icon={<Activity className="w-6 h-6" />}
          color="emerald"
          trend="En tiempo real"
          trendType="neutral"
        />

        <MetricCard
          title="Intentos de Suplantación"
          value={accesses.spoofing_attempts_today}
          subtitle="Ataques con foto / pantalla bloqueados"
          icon={<ShieldAlert className="w-6 h-6" />}
          color="rose"
          trend={accesses.spoofing_attempts_today > 0 ? 'Alerta activa' : '0 incidentes hoy'}
          trendType={accesses.spoofing_attempts_today > 0 ? 'negative' : 'positive'}
        />

        <MetricCard
          title="Personas Autorizadas"
          value={residents.total_residents}
          subtitle={`${residents.active_residents} con vector facial activo`}
          icon={<UserCheck className="w-6 h-6" />}
          color="indigo"
          trend="100% verificado"
          trendType="positive"
        />
      </div>

      {/* Activity Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-white">
              Histórico de Verificaciones Biométricas (Últimos 7 días)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Eventos de acceso concedido, accesos denegados e intentos de spoofing detectados.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Concedidos
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Denegados
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Spoofing
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          {stats?.chart_7_days && stats.chart_7_days.length > 0 ? (
            <ResponsiveContainer key={`container-${chartKey}`} width="100%" height="100%">
              <AreaChart key={`chart-${chartKey}`} data={stats.chart_7_days}>
                <defs>
                  <linearGradient id="colorConcedidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDenegados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area
                  key={`concedidos-${chartKey}`}
                  type="monotone"
                  dataKey="granted"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorConcedidos)"
                  name="Concedidos"
                  isAnimationActive={true}
                  animationDuration={1300}
                  animationEasing="ease-out"
                />
                <Area
                  key={`denegados-${chartKey}`}
                  type="monotone"
                  dataKey="denied"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorDenegados)"
                  name="Denegados"
                  isAnimationActive={true}
                  animationDuration={1300}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No hay datos históricos suficientes registrados aún.
            </div>
          )}
        </div>
      </div>

      {/* Two columns: Status summary & Recent alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-white mb-1">
              Distribución de Servicios
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Estado operativo de los contratos residenciales.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-300">Activos</span>
                  <span className="text-emerald-400 font-semibold">{homes.active_homes}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${(homes.active_homes / (homes.total_homes || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-300">Suspendidos</span>
                  <span className="text-amber-400 font-semibold">{homes.suspended_homes}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${(homes.suspended_homes / (homes.total_homes || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-300">Denegados / Cancelados</span>
                  <span className="text-rose-400 font-semibold">{homes.denied_homes}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{
                      width: `${(homes.denied_homes / (homes.total_homes || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-300">Periodo de Prueba</span>
                  <span className="text-cyan-400 font-semibold">{homes.trial_homes}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{
                      width: `${(homes.trial_homes / (homes.total_homes || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800">
            <Link
              to="/hogares"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center justify-between"
            >
              <span>Ver listado detallado de hogares</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Alerts Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-white">
                Alertas de Seguridad Recientes
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Incidentes detectados por las cámaras de los hogares.
              </p>
            </div>
            <Link
              to="/alertas"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recent_alerts && stats.recent_alerts.length > 0 ? (
              stats.recent_alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4 transition-colors hover:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        alert.alert_type === 'SPOOFING_ATTEMPT'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {alert.alert_type === 'SPOOFING_ATTEMPT'
                            ? 'Intento de Suplantación (Spoofing)'
                            : alert.alert_type}
                        </span>
                        {alert.home_code && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400 font-mono">
                            {alert.home_code}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {alert.owner_name ? `Hogar: ${alert.owner_name} · ` : ''}
                        {alert.created_at}
                      </p>
                    </div>
                  </div>

                  <div>
                    {alert.resolved ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Resuelta
                      </span>
                    ) : (
                      <button
                        onClick={() => handleResolveAlert(alert.alert_id)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      >
                        Marcar Resuelta
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                No hay alertas de seguridad registradas en este momento.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
