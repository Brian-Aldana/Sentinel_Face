import React, { useState, useEffect } from 'react';
import {
  Home,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  MoreVertical,
  ShieldAlert,
  Users,
  MapPin,
  Phone,
  Mail,
  Loader2,
  RefreshCw,
  Ban,
  Check,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { hogarService } from '../services/hogarService';
import { Hogar, EstadoServicio } from '../types';

export const HogaresPage: React.FC = () => {
  const [hogares, setHogares] = useState<Hogar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');

  // Modal para Nuevo Hogar
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    codigo_hogar: '',
    nombre_titular: '',
    direccion: '',
    telefono: '',
    email_contacto: '',
    estado_servicio: 'ACTIVO' as EstadoServicio,
    limite_personas: 10,
    limite_camaras: 2,
    notas: '',
  });

  // Modal para Cambiar Estado (Suspender / Denegar)
  const [selectedHogar, setSelectedHogar] = useState<Hogar | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<EstadoServicio>('SUSPENDIDO');
  const [motivoSuspension, setMotivoSuspension] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchHogares = async () => {
    try {
      setLoading(true);
      const data = await hogarService.getHogares();
      setHogares(data);
    } catch (err) {
      console.error('Error fetching hogares:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHogares();
  }, []);

  const handleCreateHogar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      await hogarService.createHogar(formData);
      setIsCreateOpen(false);
      setFormData({
        codigo_hogar: '',
        nombre_titular: '',
        direccion: '',
        telefono: '',
        email_contacto: '',
        estado_servicio: 'ACTIVO',
        limite_personas: 10,
        limite_camaras: 2,
        notas: '',
      });
      fetchHogares();
    } catch (err: any) {
      setCreateError(
        err.response?.data?.message || 'Error al registrar el nuevo hogar'
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenStatusModal = (hogar: Hogar, statusToSet: EstadoServicio) => {
    setSelectedHogar(hogar);
    setNewStatus(statusToSet);
    setMotivoSuspension(hogar.motivo_suspension || '');
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedHogar) return;
    setStatusLoading(true);

    try {
      await hogarService.setHogarStatus(
        selectedHogar.hogar_id,
        newStatus,
        motivoSuspension
      );
      setIsStatusModalOpen(false);
      fetchHogares();
    } catch (err) {
      console.error('Error cambiando estado del hogar:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const filteredHogares = hogares.filter((h) => {
    const matchesSearch =
      h.nombre_titular.toLowerCase().includes(search.toLowerCase()) ||
      h.codigo_hogar.toLowerCase().includes(search.toLowerCase()) ||
      (h.direccion && h.direccion.toLowerCase().includes(search.toLowerCase())) ||
      h.email_contacto.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filterStatus === 'TODOS' || h.estado_servicio === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Gestión de Hogares y Servicios
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Control de suscripciones, límites de personas autorizadas y estado de servicio por residencia.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchHogares}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors shadow-lg shadow-cyan-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Hogar</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por titular, código, dirección..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['TODOS', 'ACTIVO', 'SUSPENDIDO', 'DENEGADO', 'PRUEBA'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterStatus === status
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800/80 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Hogares Table / Cards */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : filteredHogares.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Home className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No se encontraron hogares</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No hay residencias que coincidan con los criterios de búsqueda o filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                  <th className="py-4 px-6 font-semibold">Código / Titular</th>
                  <th className="py-4 px-6 font-semibold">Ubicación & Contacto</th>
                  <th className="py-4 px-6 font-semibold">Estado del Servicio</th>
                  <th className="py-4 px-6 font-semibold">Capacidad</th>
                  <th className="py-4 px-6 font-semibold">Actividad</th>
                  <th className="py-4 px-6 font-semibold text-right">Acciones de Proveedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHogares.map((hogar) => (
                  <tr
                    key={hogar.hogar_id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Código / Titular */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          {hogar.codigo_hogar.replace('HOG-', '')}
                        </div>
                        <div>
                          <span className="font-semibold text-white block text-sm">
                            {hogar.nombre_titular}
                          </span>
                          <span className="text-[11px] text-cyan-400 font-mono">
                            {hogar.codigo_hogar}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Ubicación & Contacto */}
                    <td className="py-4 px-6 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {hogar.direccion || 'Sin dirección registrada'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{hogar.email_contacto}</span>
                      </div>
                    </td>

                    {/* Estado del Servicio */}
                    <td className="py-4 px-6">
                      <div>
                        <StatusBadge status={hogar.estado_servicio} />
                        {hogar.motivo_suspension && (
                          <p className="text-[10px] text-amber-400/90 mt-1 max-w-[180px] truncate" title={hogar.motivo_suspension}>
                            Motivo: {hogar.motivo_suspension}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Capacidad */}
                    <td className="py-4 px-6">
                      <div className="text-slate-300">
                        <span className="font-semibold text-white">{hogar.total_personas || 0}</span>
                        <span className="text-slate-500"> / {hogar.limite_personas} personas</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        Hasta {hogar.limite_camaras} cámaras IP
                      </span>
                    </td>

                    {/* Actividad */}
                    <td className="py-4 px-6">
                      <div className="text-slate-300">
                        <span className="font-medium">{hogar.total_accesos || 0}</span> accesos
                      </div>
                      {hogar.alertas_activas && hogar.alertas_activas > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold mt-0.5">
                          <ShieldAlert className="w-3 h-3" />
                          {hogar.alertas_activas} alertas activas
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">0 alertas activas</span>
                      )}
                    </td>

                    {/* Acciones de Proveedor */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hogar.estado_servicio === 'ACTIVO' ? (
                          <button
                            onClick={() => handleOpenStatusModal(hogar, 'SUSPENDIDO')}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-medium transition-colors flex items-center gap-1"
                            title="Suspender servicio temporalmente"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Suspender</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenStatusModal(hogar, 'ACTIVO')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-medium transition-colors flex items-center gap-1"
                            title="Reactivar servicio"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Activar</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenStatusModal(hogar, 'DENEGADO')}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-medium transition-colors"
                          title="Denegar o revocar servicio definitivamente"
                        >
                          Denegar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Crear Nuevo Hogar */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Dar de Alta a un Nuevo Hogar"
      >
        {createError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {createError}
          </div>
        )}
        <form onSubmit={handleCreateHogar} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Código del Hogar *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. HOG-002"
                value={formData.codigo_hogar}
                onChange={(e) =>
                  setFormData({ ...formData, codigo_hogar: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Estado Inicial
              </label>
              <select
                value={formData.estado_servicio}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estado_servicio: e.target.value as EstadoServicio,
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="PRUEBA">PRUEBA</option>
                <option value="SUSPENDIDO">SUSPENDIDO</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Nombre de la Familia o Titular *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Familia Rodríguez Castro"
              value={formData.nombre_titular}
              onChange={(e) =>
                setFormData({ ...formData, nombre_titular: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                placeholder="titular@correo.com"
                value={formData.email_contacto}
                onChange={(e) =>
                  setFormData({ ...formData, email_contacto: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                placeholder="310 123 4567"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Dirección del Inmueble (Girardot)
            </label>
            <input
              type="text"
              placeholder="Ej. Manzana C Casa 12, Barrio Pozo Azul"
              value={formData.direccion}
              onChange={(e) =>
                setFormData({ ...formData, direccion: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Límite de Personas
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.limite_personas}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    limite_personas: parseInt(e.target.value) || 10,
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Límite de Cámaras IP
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.limite_camaras}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    limite_camaras: parseInt(e.target.value) || 2,
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Registrar Hogar</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Cambiar Estado (Suspender / Denegar / Activar) */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Cambiar Estado de Servicio — ${selectedHogar?.nombre_titular}`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Está a punto de cambiar el estado del servicio para{' '}
            <span className="font-semibold text-white">
              {selectedHogar?.nombre_titular} ({selectedHogar?.codigo_hogar})
            </span>{' '}
            a <span className="font-bold text-cyan-400">{newStatus}</span>.
          </p>

          {newStatus === 'DENEGADO' || newStatus === 'SUSPENDIDO' ? (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
              <strong>Importante:</strong> Al {newStatus.toLowerCase()} el servicio, los residentes no podrán acceder mediante reconocimiento facial en la puerta y la app móvil reflejará la suspensión inmediatamente.
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
              Al reactivar el servicio, el reconocimiento biométrico y la app móvil volverán a operar normalmente.
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Motivo o Justificación Administrativa
            </label>
            <textarea
              rows={3}
              value={motivoSuspension}
              onChange={(e) => setMotivoSuspension(e.target.value)}
              placeholder="Ej. Falta de pago de mensualidad, solicitud del propietario, mantenimiento preventivo..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={statusLoading}
              onClick={handleConfirmStatusChange}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-1.5 ${
                newStatus === 'ACTIVO'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-rose-500 hover:bg-rose-400 text-white'
              }`}
            >
              {statusLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirmar {newStatus}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
