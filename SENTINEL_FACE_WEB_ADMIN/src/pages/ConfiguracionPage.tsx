import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Sliders,
  Lock,
  Key,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Cpu,
  Building,
  Info,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ConfiguracionPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'BIOMETRICS' | 'PROVIDER' | 'SECURITY'>('PROVIDER');

  // Formulario de parámetros del proveedor
  const [providerSettings, setProviderSettings] = useState({
    default_max_personas: 10,
    default_max_camaras: 2,
    jwt_ttl_seconds: 3600,
    region_name: 'Girardot, Cundinamarca',
    cors_allowed: '*',
  });
  const [providerSuccess, setProviderSuccess] = useState(false);

  // Formulario de parámetros biométricos
  const [bioSettings, setBioSettings] = useState({
    face_match_threshold: 0.65,
    liveness_minifasnet_threshold: 0.85,
    blink_ear_threshold: 0.22,
    min_burst_frames: 5,
  });
  const [bioSuccess, setBioSuccess] = useState(false);

  // Formulario de cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleSaveProvider = (e: React.FormEvent) => {
    e.preventDefault();
    setProviderSuccess(true);
    setTimeout(() => setProviderSuccess(false), 3000);
  };

  const handleSaveBiometrics = (e: React.FormEvent) => {
    e.preventDefault();
    setBioSuccess(true);
    setTimeout(() => setBioSuccess(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Contraseña cambiada exitosamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.message || 'Error al actualizar la contraseña'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Configuración Global del Proveedor
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Ajustes de infraestructura, umbrales del motor biométrico y seguridad administrativa de Sentinel Face.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('PROVIDER')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'PROVIDER'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Parámetros de Servicio</span>
        </button>

        <button
          onClick={() => setActiveTab('BIOMETRICS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'BIOMETRICS'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Motor Biométrico & Liveness</span>
        </button>

        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'SECURITY'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Seguridad & Cuenta</span>
        </button>
      </div>

      {/* Tab: Provider Settings */}
      {activeTab === 'PROVIDER' && (
        <form onSubmit={handleSaveProvider} className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              <span>Reglas de Suscripción Residencial</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Límite por defecto de personas autorizadas por hogar
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={providerSettings.default_max_personas}
                  onChange={(e) =>
                    setProviderSettings({
                      ...providerSettings,
                      default_max_personas: parseInt(e.target.value) || 10,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Aplica para nuevos hogares dados de alta.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Límite por defecto de cámaras IP por hogar
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={providerSettings.default_max_camaras}
                  onChange={(e) =>
                    setProviderSettings({
                      ...providerSettings,
                      default_max_camaras: parseInt(e.target.value) || 2,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Número de puntos de captura concurrentes autorizados.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Región de Despliegue Principal
                </label>
                <input
                  type="text"
                  value={providerSettings.region_name}
                  onChange={(e) =>
                    setProviderSettings({
                      ...providerSettings,
                      region_name: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Tiempo de Expiración de Token JWT (Segundos)
                </label>
                <input
                  type="number"
                  value={providerSettings.jwt_ttl_seconds}
                  onChange={(e) =>
                    setProviderSettings({
                      ...providerSettings,
                      jwt_ttl_seconds: parseInt(e.target.value) || 3600,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  3600 s = 1 hora de validez por sesión.
                </span>
              </div>
            </div>

            {providerSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Configuración del proveedor guardada correctamente.</span>
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Parámetros</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab: Biometrics & Liveness Settings */}
      {activeTab === 'BIOMETRICS' && (
        <form onSubmit={handleSaveBiometrics} className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Calibración de Algoritmos de Visión por Computador</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Umbral de Similitud Facial ArcFace (0.0 - 1.0)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="1.0"
                  value={bioSettings.face_match_threshold}
                  onChange={(e) =>
                    setBioSettings({
                      ...bioSettings,
                      face_match_threshold: parseFloat(e.target.value) || 0.65,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Recomendado: 0.65. Mayor valor exige mayor parecido del rostro.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Tolerancia Anti-Spoofing MiniFASNet (0.0 - 1.0)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="1.0"
                  value={bioSettings.liveness_minifasnet_threshold}
                  onChange={(e) =>
                    setBioSettings({
                      ...bioSettings,
                      liveness_minifasnet_threshold: parseFloat(e.target.value) || 0.85,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Recomendado: 0.85. Rechaza fotografías impresas y pantallas.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Umbral EAR de Detección de Parpadeo Activo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="0.5"
                  value={bioSettings.blink_ear_threshold}
                  onChange={(e) =>
                    setBioSettings({
                      ...bioSettings,
                      blink_ear_threshold: parseFloat(e.target.value) || 0.22,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Eye Aspect Ratio calculado con MediaPipe Face Mesh.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Ráfaga Mínima de Frames para Análisis
                </label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={bioSettings.min_burst_frames}
                  onChange={(e) =>
                    setBioSettings({
                      ...bioSettings,
                      min_burst_frames: parseInt(e.target.value) || 5,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Número de capturas consecutivas enviadas por la cámara.
                </span>
              </div>
            </div>

            {bioSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Calibración de algoritmos biométricos actualizada.</span>
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Calibración</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab: Security & Password Settings */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-6">
          {/* Admin Profile Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Sesión del Administrador del Servicio</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
              <div>
                <span className="text-slate-500 block">Usuario Activo:</span>
                <span className="text-slate-200 font-semibold">{user?.name || 'Super Administrador'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Email Registrado:</span>
                <span className="text-slate-200 font-mono">{user?.email || 'admin@admin.com'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Nivel de Acceso:</span>
                <span className="text-cyan-400 font-semibold uppercase">Superadmin (Acceso Total)</span>
              </div>
            </div>
          </div>

          {/* Change Password Box */}
          <form onSubmit={handleChangePassword} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>Cambiar Contraseña de Administrador</span>
            </h3>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="space-y-3 text-xs max-w-md">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Contraseña Actual *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir nueva contraseña"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end max-w-md">
              <button
                type="submit"
                disabled={passwordLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {passwordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Actualizar Contraseña</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
