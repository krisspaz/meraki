import React, { useState } from 'react';
import { 
  useAdminRegistrations, 
  useAdminWorkshops,
  useRecordAttendanceMutation,
  useChangeWorkshopMutation,
  useUpdateRegistrationMutation
} from '../../services/queries';
import { formatDateTime } from '../../utils/formatters';
import { api } from '../../services/api';
import { 
  Loader2, Search, CheckSquare, XCircle, ArrowLeftRight, 
  Download, Filter, AlertCircle, X, HelpCircle, Save 
} from 'lucide-react';

export const Registrations: React.FC = () => {
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [filterWorkshop, setFilterWorkshop] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  // Queries
  const { data: regData, isLoading: loadingRegs } = useAdminRegistrations(skip, limit, search, filterWorkshop, filterStatus);
  const { data: workshops } = useAdminWorkshops();

  // Mutations
  const recordAttendanceMutation = useRecordAttendanceMutation();
  const changeWorkshopMutation = useChangeWorkshopMutation();
  const updateRegMutation = useUpdateRegistrationMutation();

  // Estados locales
  const [changingRegId, setChangingRegId] = useState<number | null>(null);
  const [selectedNewWorkshopId, setSelectedNewWorkshopId] = useState<number | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('meraki_access_token');
      const response = await fetch('/api/admin/exports/registrations.csv', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al descargar el archivo.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registros_confirmados_meraki_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert('No se pudo exportar la base de datos a CSV.');
    } finally {
      setExporting(false);
    }
  };

  const handleAttendance = (id: number) => {
    recordAttendanceMutation.mutate(id, {
      onError: (err: any) => {
        const detail = err.response?.data?.detail;
        alert(detail?.message || 'Error al registrar la asistencia.');
      }
    });
  };

  const handleCancelRegistration = (id: number, code: string) => {
    const reason = window.prompt('Ingrese el motivo de la cancelación de este registro:');
    if (reason === null) return; // cancelado por el administrador

    // Usar el endpoint de cancelación (reutiliza lógica de cancelación pública pero por ID)
    updateRegMutation.mutate(
      { id, data: { status: 'cancelled', cancellation_reason: reason } },
      {
        onSuccess: () => {
          alert('Inscripción cancelada con éxito.');
        },
        onError: (err: any) => {
          const detail = err.response?.data?.detail;
          alert(detail?.message || 'Error al cancelar la inscripción.');
        }
      }
    );
  };

  const handleChangeWorkshopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingRegId || !selectedNewWorkshopId) return;
    setErrorMsg(null);

    changeWorkshopMutation.mutate(
      { id: changingRegId, newWorkshopId: selectedNewWorkshopId },
      {
        onSuccess: () => {
          setChangingRegId(null);
          setSelectedNewWorkshopId(undefined);
        },
        onError: (err: any) => {
          const detail = err.response?.data?.detail;
          setErrorMsg(detail?.message || 'Error al reasignar el taller.');
        }
      }
    );
  };

  const totalPages = regData ? Math.ceil(regData.total / limit) : 0;
  const currentPage = skip / limit + 1;

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-meraki-card border border-white/5 p-6 rounded-2xl shadow-lg gap-4">
        <div>
          <h3 className="font-display font-bold text-base text-white">Administración de Participantes</h3>
          <p className="text-xs text-slate-500 mt-1">Monitorea los participantes registrados, realiza check-in de asistencia y reasigna talleres.</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="flex items-center gap-2 py-2 px-4 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/10"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Exportar Base Completa (CSV)</span>
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Buscador */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, teléfono o código..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSkip(0);
            }}
            className="w-full pl-10 glass-input text-xs"
          />
        </div>

        {/* Filtro Taller */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <select
            value={filterWorkshop || ''}
            onChange={(e) => {
              const val = e.target.value;
              setFilterWorkshop(val ? parseInt(val) : undefined);
              setSkip(0);
            }}
            className="w-full pl-9 glass-input text-xs appearance-none"
          >
            <option value="">Todos los talleres</option>
            {workshops?.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Filtro Estado */}
        <div>
          <select
            value={filterStatus || ''}
            onChange={(e) => {
              setFilterStatus(e.target.value || undefined);
              setSkip(0);
            }}
            className="w-full glass-input text-xs"
          >
            <option value="">Todos los estados</option>
            <option value="confirmed">Confirmado</option>
            <option value="waiting">En Espera</option>
            <option value="attended">Asistió</option>
            <option value="cancelled">Cancelado</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>
      </div>

      {/* Listado de participantes */}
      <div className="bg-meraki-card border border-white/5 rounded-2xl shadow-lg overflow-hidden">
        {loadingRegs ? (
          <div className="flex justify-center items-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 text-meraki-purple animate-spin mr-3" />
            <span>Cargando participantes...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-white/5 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Participante</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4">Taller Registrado</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4">Fecha de Registro</th>
                  <th className="py-3 px-4 text-center rounded-r-lg">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {regData?.registrations.map((reg) => {
                  const canCheckIn = reg.status === 'confirmed';
                  const canChangeW = reg.status === 'confirmed' || reg.status === 'waiting';
                  const canCancel = reg.status !== 'cancelled' && reg.status !== 'rejected';

                  return (
                    <tr key={reg.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-meraki-accent">{reg.code}</td>
                      <td className="py-3.5 px-4">
                        <span className="block text-white font-medium">{reg.full_name}</span>
                        <span className="block text-[10px] text-slate-500">
                          {reg.institution ? `${reg.institution}` : ''} {reg.age ? `• ${reg.age} años` : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="block">{reg.email}</span>
                        <span className="block text-[10px] text-slate-500">{reg.phone}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {reg.workshop?.name}
                        {reg.status === 'waiting' && (
                          <span className="block text-[9px] text-amber-400 font-medium">Lista de espera</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          reg.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          reg.status === 'waiting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          reg.status === 'attended' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {reg.status === 'confirmed' ? 'Confirmado' :
                           reg.status === 'waiting' ? 'En Espera' :
                           reg.status === 'attended' ? 'Asistencia' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDateTime(reg.created_at)}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex gap-2 justify-center">
                          {/* Check-In */}
                          <button
                            type="button"
                            disabled={!canCheckIn}
                            onClick={() => handleAttendance(reg.id)}
                            className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Marcar asistencia (Check-In)"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Cambiar Taller */}
                          <button
                            type="button"
                            disabled={!canChangeW}
                            onClick={() => {
                              setChangingRegId(reg.id);
                              setSelectedNewWorkshopId(reg.workshop_id);
                              setErrorMsg(null);
                            }}
                            className="p-1.5 bg-meraki-purple/10 hover:bg-meraki-purple/20 text-meraki-accent border border-meraki-purple/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Cambiar de taller"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Cancelar Registro */}
                          <button
                            type="button"
                            disabled={!canCancel}
                            onClick={() => handleCancelRegistration(reg.id, reg.code)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Cancelar inscripción"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {regData?.registrations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No se encontraron participantes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-4 bg-white/5 border-t border-white/5 flex justify-between items-center text-xs">
            <span className="text-slate-500">Página {currentPage} de {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={skip === 0}
                onClick={() => setSkip(Math.max(0, skip - limit))}
                className="py-1 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-300 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setSkip(skip + limit)}
                className="py-1 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-300 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Cambiar Taller */}
      {changingRegId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 p-6 md:p-8 space-y-6 bg-meraki-card text-slate-300">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-extrabold text-lg text-white">Reasignar Taller</h3>
              <button 
                type="button" 
                onClick={() => setChangingRegId(null)} 
                className="text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangeWorkshopSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Seleccionar Taller de Destino</label>
                <select
                  value={selectedNewWorkshopId || ''}
                  onChange={(e) => setSelectedNewWorkshopId(parseInt(e.target.value))}
                  className="w-full glass-input text-xs"
                  required
                >
                  <option value="" disabled>Seleccione un taller</option>
                  {workshops?.map((w) => (
                    <option 
                      key={w.id} 
                      value={w.id}
                      disabled={w.slots_available <= 0}
                    >
                      {w.name} ({w.slots_available} libres)
                    </option>
                  ))}
                </select>
                <span className="block text-[10px] text-slate-500 mt-1 leading-normal">
                  Nota: El backend verificará la capacidad actual aplicando bloqueos asíncronos concurrentes.
                </span>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setChangingRegId(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 rounded-xl border border-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={changeWorkshopMutation.isPending}
                  className="flex-1 btn-meraki flex items-center justify-center gap-2 py-2.5"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Reasignar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Registrations;
