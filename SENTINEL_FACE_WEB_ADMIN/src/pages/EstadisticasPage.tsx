import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Users,
  Activity,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Award,
} from 'lucide-react';
import { statsService } from '../services/hogarService';
import { DashboardStats } from '../types';

export const EstadisticasPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartKey, setChartKey] = useState<number>(Date.now());

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await statsService.getDashboardStats();
      setStats(data);
      setChartKey(Date.now());
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const hogares = stats?.hogares || {
    total_hogares: 0,
    hogares_activos: 0,
    hogares_suspendidos: 0,
    hogares_denegados: 0,
    hogares_prueba: 0,
  };

  const accesos = stats?.accesos || {
    total_accesos_historico: 0,
    accesos_hoy: 0,
    accesos_concedidos_hoy: 0,
    accesos_denegados_hoy: 0,
    intentos_spoofing_hoy: 0,
  };

  const alertas = stats?.alertas || {
    total_alertas: 0,
    alertas_pendientes: 0,
    alertas_criticas_pendientes: 0,
    alertas_spoofing: 0,
    alertas_rostro_desconocido: 0,
  };

  // Datos para gráfico de pastel de estados
  const pieData = [
    { name: 'Activos', value: hogares.hogares_activos, color: '#10b981' },
    { name: 'Suspendidos', value: hogares.hogares_suspendidos, color: '#f59e0b' },
    { name: 'Denegados', value: hogares.hogares_denegados, color: '#ef4444' },
    { name: 'Prueba', value: hogares.hogares_prueba, color: '#06b6d4' },
  ].filter((d) => d.value > 0);

  // Tasa de efectividad anti-spoofing
  const spoofingCount = alertas.alertas_spoofing || 0;
  const tasaResolucionAlertas =
    alertas.total_alertas > 0
      ? (((alertas.total_alertas - alertas.alertas_pendientes) / alertas.total_alertas) * 100).toFixed(1)
      : '100';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Métricas y Estadísticas Avanzadas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Análisis cuantitativo de adopción del servicio en Girardot, rendimiento del motor biométrico y efectividad de seguridad.
          </p>
        </div>
        <div>
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar Gráficos</span>
          </button>
        </div>
      </div>

      {/* Top 4 Performance Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tasa de Operatividad</span>
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white mt-2">
            {hogares.total_hogares > 0
              ? `${(((hogares.hogares_activos + hogares.hogares_prueba) / hogares.total_hogares) * 100).toFixed(0)}%`
              : '0%'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Hogares con servicio activo o en evaluación.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Verificaciones</span>
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-white mt-2">{accesos.total_accesos_historico}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Accesos faciales procesados por la API.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Ataques Bloqueados</span>
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-3xl font-bold text-rose-400 mt-2">{spoofingCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Intentos con fotos/pantallas neutralizados.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Resolución de Alertas</span>
            <CheckCircle className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-white mt-2">{tasaResolucionAlertas}%</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Incidentes atendidos por administradores.
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Volumen de Accesos por Día */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                Tendencia de Accesos e Incidentes (Últimos 7 días)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparativo diario entre accesos concedidos y denegados.
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {stats?.grafica_7_dias && stats.grafica_7_dias.length > 0 ? (
              <ResponsiveContainer key={`barchart-container-${chartKey}`} width="100%" height="100%">
                <BarChart key={`barchart-${chartKey}`} data={stats.grafica_7_dias} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="fecha" stroke="#64748b" tick={{ fontSize: 11 }} />
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
                  <Legend />
                  <Bar dataKey="concedidos" fill="#10b981" name="Concedidos" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1200} />
                  <Bar dataKey="denegados" fill="#ef4444" name="Denegados" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1200} />
                  <Bar dataKey="spoofing" fill="#f59e0b" name="Spoofing" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Sin datos suficientes para graficar.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Distribución de Hogares (Pie Chart) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">
              Distribución de Hogares por Estado
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Proporción sobre el total de {hogares.total_hogares} hogares registrados.
            </p>

            <div className="h-56 w-full mt-4">
              {pieData.length > 0 ? (
                <ResponsiveContainer key={`pie-container-${chartKey}`} width="100%" height="100%">
                  <PieChart key={`piechart-${chartKey}`}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={1200}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-800 text-xs">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                <span className="text-slate-400">{d.name}:</span>
                <span className="font-semibold text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Table: Capacidad y Despliegue en Girardot */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-semibold text-white mb-1">
          Resumen de Capacidad del Proveedor
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Balance de personas enroladas vs. capacidad asignada en el municipio de Girardot.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-slate-400 block font-medium">Hogares Suspendidos o Denegados</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400">
                {hogares.hogares_suspendidos + hogares.hogares_denegados}
              </span>
              <span className="text-slate-500">
                de {hogares.total_hogares} hogares ({hogares.total_hogares > 0 ? (((hogares.hogares_suspendidos + hogares.hogares_denegados) / hogares.total_hogares) * 100).toFixed(0) : 0}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Con acceso biométrico bloqueado por administración o mora.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-slate-400 block font-medium">Personas Enroladas en Total</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {stats?.personas?.total_personas_registradas || 0}
              </span>
              <span className="text-slate-500">residentes</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Promedio de {hogares.total_hogares > 0 ? ((stats?.personas?.total_personas_registradas || 0) / hogares.total_hogares).toFixed(1) : 0} personas por hogar.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-slate-400 block font-medium">Alertas de Suplantación Activas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-400">
                {alertas.alertas_criticas_pendientes}
              </span>
              <span className="text-slate-500">críticas por atender</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Requieren verificación directa con el titular del inmueble.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
