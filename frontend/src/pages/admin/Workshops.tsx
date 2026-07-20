import React, { useState } from 'react';
import { 
  useAdminWorkshops, 
  useCreateWorkshopMutation, 
  useUpdateWorkshopMutation, 
  useDeleteWorkshopMutation,
  useCloseWorkshopMutation,
  useOpenWorkshopMutation
} from '../../services/queries';
import { formatTime } from '../../utils/formatters';
import { 
  Loader2, Plus, Edit3, Trash2, XCircle, 
  CheckCircle, ArrowLeftRight, Clock, MapPin, Sparkles, X, Save 
} from 'lucide-react';

export const Workshops: React.FC = () => {
  const { data: workshops, isLoading } = useAdminWorkshops();

  // Mutaciones
  const createMutation = useCreateWorkshopMutation();
  const updateMutation = useUpdateWorkshopMutation();
  const deleteMutation = useDeleteWorkshopMutation();
  const closeMutation = useCloseWorkshopMutation();
  const openMutation = useOpenWorkshopMutation();

  // Estados locales para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Campos de formulario
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [speakerBio, setSpeakerBio] = useState('');
  const [room, setRoom] = useState('');
  const [capacity, setCapacity] = useState(30);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setSpeakerName('');
    setSpeakerBio('');
    setRoom('');
    setCapacity(30);
    setStartTime('10:00');
    setEndTime('12:00');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (w: any) => {
    setEditingId(w.id);
    setName(w.name);
    setDescription(w.description);
    setSpeakerName(w.speaker_name);
    setSpeakerBio(w.speaker_bio);
    setRoom(w.room);
    setCapacity(w.capacity);
    // Formatear hora de inicio y fin HH:MM
    setStartTime(w.start_time.slice(0, 5));
    setEndTime(w.end_time.slice(0, 5));
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const workshopData = {
      name,
      description,
      speaker_name: speakerName,
      speaker_bio: speakerBio,
      room,
      capacity,
      // Asegurar formato HH:MM:SS para el backend
      start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
      end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
      status: editingId ? undefined : 'available'
    };

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: workshopData },
        {
          onSuccess: () => {
            setIsModalOpen(false);
          },
          onError: (err: any) => {
            const detail = err.response?.data?.detail;
            setErrorMsg(detail?.message || 'Error al actualizar el taller.');
          }
        }
      );
    } else {
      createMutation.mutate(workshopData, {
        onSuccess: () => {
          setIsModalOpen(false);
        },
        onError: (err: any) => {
          const detail = err.response?.data?.detail;
          setErrorMsg(detail?.message || 'Error al crear el taller.');
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este taller? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(id, {
        onError: (err: any) => {
          const detail = err.response?.data?.detail;
          alert(detail?.message || 'Ocurrió un error al intentar eliminar el taller.');
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 text-meraki-purple animate-spin mr-3" />
        <span>Cargando listado de talleres...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex justify-between items-center bg-meraki-card border border-white/5 p-6 rounded-2xl shadow-lg">
        <div>
          <h3 className="font-display font-bold text-base text-white">Administración de Talleres</h3>
          <p className="text-xs text-slate-500 mt-1">Crea, edita o bloquea el registro en los talleres de la actividad.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-meraki flex items-center gap-2 py-2 px-4 text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Taller</span>
        </button>
      </div>

      {/* Grid de Talleres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workshops?.map((w) => {
          const isFullOrClosed = ['full', 'closed_manually', 'cancelled'].includes(w.status) || w.slots_available <= 0;
          return (
            <div key={w.id} className="bg-meraki-card border border-white/5 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-lg space-y-4">
              {/* Contenido */}
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-display font-bold text-base text-white">{w.name}</h4>
                  
                  {/* Badge de estado */}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    w.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    w.status === 'almost_full' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    w.status === 'full' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {w.status === 'available' ? 'Disponible' : 
                     w.status === 'almost_full' ? 'Casi Lleno' : 
                     w.status === 'full' ? 'Lleno' : 
                     w.status === 'closed_manually' ? 'Cerrado Admin' : 'Cancelado'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-meraki-purple" />
                    <span>{formatTime(w.start_time)} - {formatTime(w.end_time)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-meraki-purple" />
                    <span>Salón: <strong>{w.room}</strong></span>
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{w.description}</p>

                {/* Expositor */}
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="block text-[9px] text-slate-500 font-bold uppercase">Expositor</span>
                    <span className="block text-white font-semibold">{w.speaker_name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 italic max-w-[150px] truncate">{w.speaker_bio}</span>
                </div>
              </div>

              {/* Contadores y Acciones */}
              <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                {/* Contadores */}
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="block text-[9px] text-slate-500 uppercase font-bold">Capacidad</span>
                    <span className="font-bold text-white">{w.capacity}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500 uppercase font-bold">Confirmados</span>
                    <span className="font-bold text-white">{w.confirmed_count}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500 uppercase font-bold">Disponibles</span>
                    <span className={`font-bold ${isFullOrClosed ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {w.slots_available}
                    </span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  {/* Cerrar / Abrir Manual */}
                  {w.status === 'closed_manually' ? (
                    <button
                      type="button"
                      title="Abrir Inscripción"
                      onClick={() => openMutation.mutate(w.id)}
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      title="Cerrar Inscripción"
                      disabled={w.status === 'cancelled'}
                      onClick={() => closeMutation.mutate(w.id)}
                      className="p-2 bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-500/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}

                  {/* Editar */}
                  <button
                    type="button"
                    title="Editar Taller"
                    onClick={() => openEditModal(w)}
                    className="p-2 bg-meraki-purple/10 hover:bg-meraki-purple/20 text-meraki-accent border border-meraki-purple/20 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Eliminar */}
                  <button
                    type="button"
                    title="Eliminar Taller"
                    disabled={w.confirmed_count > 0}
                    onClick={() => handleDelete(w.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 p-6 md:p-8 space-y-6 bg-meraki-card animate-scale-in text-slate-300">
            {/* Header Modal */}
            <div className="flex justify-between items-center">
              <h3 className="font-display font-extrabold text-lg text-white">
                {editingId ? 'Editar Taller' : 'Crear Nuevo Taller'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2 items-center">
                <XCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Nombre del Taller</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Expositor</label>
                  <input
                    type="text"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Ubicación / Salón</label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Trayectoria / Biografía del Expositor</label>
                <textarea
                  value={speakerBio}
                  onChange={(e) => setSpeakerBio(e.target.value)}
                  rows={2}
                  className="w-full glass-input text-xs resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Hora Inicio</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Hora Finalización</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Capacidad Máxima</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value))}
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Descripción del Taller</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full glass-input text-xs resize-none"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 rounded-xl border border-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 btn-meraki flex items-center justify-center gap-2 py-2.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Taller</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Workshops;
