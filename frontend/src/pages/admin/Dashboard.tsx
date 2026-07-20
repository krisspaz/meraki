import React, { useState } from 'react';
import { 
  useAdminDashboard, 
  useAdminSettings, 
  useAdminEvent, 
  useUpdateSettingMutation, 
  useUpdateEventMutation 
} from '../../services/queries';
import { formatDateTime } from '../../utils/formatters';
import { 
  Loader2, Ticket, Users, CheckCircle2, 
  AlertTriangle, Settings, Save, AlertCircle 
} from 'lucide-react';

const CircularProgress: React.FC<{ percentage: number; label: string; sublabel: string }> = ({ 
  percentage, 
  label, 
  sublabel 
}) => {
  const radius = 60;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center p-5 bg-white/5 rounded-2xl border border-white/5 text-center shrink-0 w-44">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="rgba(255, 255, 255, 0.03)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="url(#dash-grad)"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <defs>
            <linearGradient id="dash-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-extrabold text-base text-white">{percentage.toFixed(0)}%</span>
        </div>
      </div>
      
      <div className="mt-3">
        <span className="block text-xs font-bold text-white truncate max-w-[150px]">{label}</span>
        <span className="block text-[10px] text-slate-500 mt-0.5">{sublabel}</span>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { data: stats, isLoading: loadingStats } = useAdminDashboard();
  const { data: settingsList, isLoading: loadingSettings } = useAdminSettings();
  const { data: event, isLoading: loadingEvent } = useAdminEvent();

  const updateSettingMutation = useUpdateSettingMutation();
  const updateEventMutation = useUpdateEventMutation();

  // Estados locales para formularios
  const [eventName, setEventName] = useState('');
  const [eventOrganizer, setEventOrganizer] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventMaxParticipants, setEventMaxParticipants] = useState(200);
  const [eventDeadline, setEventDeadline] = useState('');
  const [eventEmail, setEventEmail] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  const [initialized, setInitialized] = useState(false);

  // Sincronizar campos de edición de evento al cargar
  React.useEffect(() => {
    if (event && !initialized) {
      setEventName(event.name);
      setEventOrganizer(event.organizer);
      setEventLocation(event.location);
      setEventMaxParticipants(event.max_participants);
      setEventEmail(event.contact_email);
      setEventDescription(event.description);
      
      if (event.registration_deadline) {
        // Convertir formato backend a datetime-local input YYYY-MM-DDThh:mm
        const dateObj = new Date(event.registration_deadline);
        const tzOffset = dateObj.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16);
        setEventDeadline(localISOTime);
      }
      setInitialized(true);
    }
  }, [event, initialized]);

  const handleUpdateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    updateEventMutation.mutate({
      name: eventName,
      organizer: eventOrganizer,
      location: eventLocation,
      max_participants: eventMaxParticipants,
      contact_email: eventEmail,
      description: eventDescription,
      registration_deadline: new Date(eventDeadline).toISOString(),
    });
  };

  const waitlistSetting = settingsList?.find(s => s.key === 'waitlist_enabled');
  const waitlistEnabled = waitlistSetting?.value === 'true';

  const handleToggleWaitlist = () => {
    updateSettingMutation.mutate({
      key: 'waitlist_enabled',
      value: waitlistEnabled ? 'false' : 'true'
    });
  };

  const isLoading = loadingStats || loadingSettings || loadingEvent;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 text-meraki-purple animate-spin mr-3" />
        <span>Cargando estadísticas del panel...</span>
      </div>
    );
  }

  const occupancyTotalPct = stats ? (stats.participants.total_active / stats.participants.max_participants_limit * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Invitaciones */}
        <div className="bg-meraki-card border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-lg shadow-black/10">
          <div className="w-12 h-12 rounded-xl bg-meraki-purple/10 border border-meraki-purple/20 flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6 text-meraki-accent" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Invitaciones Creadas</span>
            <span className="block text-2xl font-extrabold font-display text-white">{stats?.invitations.total}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Utilizadas: {stats?.invitations.used}</span>
          </div>
        </div>

        {/* Participantes Confirmados */}
        <div className="bg-meraki-card border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-lg shadow-black/10">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Confirmados Activos</span>
            <span className="block text-2xl font-extrabold font-display text-white">{stats?.participants.total_active}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Asistencias: {stats?.participants.attended}</span>
          </div>
        </div>

        {/* Lista de Espera */}
        <div className="bg-meraki-card border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-lg shadow-black/10">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">En Lista de Espera</span>
            <span className="block text-2xl font-extrabold font-display text-white">{stats?.participants.waiting}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              Waitlist: {waitlistEnabled ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>

        {/* Cupos Evento Disponibles */}
        <div className="bg-meraki-card border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-lg shadow-black/10">
          <div className="w-12 h-12 rounded-xl bg-meraki-coral/10 border border-meraki-coral/20 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-meraki-coral" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cupos Libres Evento</span>
            <span className="block text-2xl font-extrabold font-display text-white">{stats?.participants.general_slots_available}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Límite: {stats?.participants.max_participants_limit}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráficos de Ocupación y Lista Recientes */}
        <div className="lg:col-span-2 space-y-8">
          {/* Seccion Ocupación de Talleres */}
          <div className="bg-meraki-card border border-white/5 p-6 rounded-2xl shadow-lg space-y-6">
            <div>
              <h3 className="font-display font-bold text-base text-white">Ocupación y Gráficas de Cupos</h3>
              <p className="text-xs text-slate-500 mt-1">Porcentaje de ocupación respecto a la capacidad asignada a cada taller.</p>
            </div>
            
            <div className="flex flex-wrap gap-6 justify-center md:justify-start">
              <CircularProgress 
                percentage={occupancyTotalPct} 
                label="Evento General" 
                sublabel={`${stats?.participants.total_active} / ${stats?.participants.max_participants_limit} cupos`} 
              />
              {stats?.workshops.map((w) => (
                <CircularProgress
                  key={w.id}
                  percentage={w.occupation_percentage}
                  label={w.name}
                  sublabel={`${w.confirmed_count} / ${w.capacity} cupos`}
                />
              ))}
            </div>
          </div>

          {/* Registros Recientes */}
          <div className="bg-meraki-card border border-white/5 p-6 rounded-2xl shadow-lg space-y-6">
            <div>
              <h3 className="font-display font-bold text-base text-white">Inscripciones Recientes</h3>
              <p className="text-xs text-slate-500 mt-1">Últimas personas registradas en la plataforma de forma automática.</p>
            </div>

            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-white/5 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4 rounded-l-lg">Código</th>
                    <th className="py-3 px-4">Nombre Completo</th>
                    <th className="py-3 px-4">Correo</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 rounded-r-lg">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats?.recent_registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-meraki-accent">{reg.code}</td>
                      <td className="py-3.5 px-4 text-white font-medium">{reg.full_name}</td>
                      <td className="py-3.5 px-4 text-slate-400">{reg.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          reg.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          reg.status === 'waiting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {reg.status === 'confirmed' ? 'Confirmado' : reg.status === 'waiting' ? 'En Espera' : reg.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDateTime(reg.created_at)}</td>
                    </tr>
                  ))}
                  {stats?.recent_registrations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                        No hay registros guardados en la base de datos aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel Lateral: Configuración de la Actividad y Reglas */}
        <div className="space-y-8">
          {/* Toggles del Sistema */}
          <div className="bg-meraki-card border border-white/5 p-6 rounded-2xl shadow-lg space-y-5">
            <div>
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Settings className="w-4.5 h-4.5 text-meraki-accent animate-spin" />
                <span>Reglas del Sistema</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">Configuración y control dinámico del comportamiento de registro.</p>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
              <div>
                <span className="block text-xs font-semibold text-white">Lista de Espera Opcional</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Encola usuarios al llenarse un taller.</span>
              </div>
              <button
                type="button"
                onClick={handleToggleWaitlist}
                disabled={updateSettingMutation.isPending}
                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${
                  waitlistEnabled ? 'bg-meraki-purple' : 'bg-slate-700'
                } flex items-center`}
              >
                <div 
                  className={`bg-white w-4 h-4 rounded-full shadow transform duration-300 ${
                    waitlistEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Formulario Configuración de la Actividad */}
          <div className="bg-meraki-card border border-white/5 p-6 rounded-2xl shadow-lg space-y-5">
            <div>
              <h3 className="font-display font-bold text-base text-white">Editar Evento Activo</h3>
              <p className="text-xs text-slate-500 mt-1">Modifica los detalles públicos de la landing page.</p>
            </div>

            {updateEventMutation.isSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex gap-2 items-center">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold">Evento actualizado con éxito.</span>
              </div>
            )}
            {updateEventMutation.isError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2 items-center">
                <AlertCircle className="w-4 h-4" />
                <span className="font-semibold">Ocurrió un error al actualizar.</span>
              </div>
            )}

            <form onSubmit={handleUpdateEvent} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Nombre de la Actividad</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full glass-input text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Carrera Organizadora</label>
                <input
                  type="text"
                  value={eventOrganizer}
                  onChange={(e) => setEventOrganizer(e.target.value)}
                  className="w-full glass-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Cupo Máximo Total</label>
                  <input
                    type="number"
                    value={eventMaxParticipants}
                    onChange={(e) => setEventMaxParticipants(parseInt(e.target.value))}
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Correo de Contacto</label>
                  <input
                    type="email"
                    value={eventEmail}
                    onChange={(e) => setEventEmail(e.target.value)}
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Ubicación o Lugar</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full glass-input text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Límite de Inscripción (Deadline)</label>
                <input
                  type="datetime-local"
                  value={eventDeadline}
                  onChange={(e) => setEventDeadline(e.target.value)}
                  className="w-full glass-input text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Descripción del Evento</label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={4}
                  className="w-full glass-input text-xs resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={updateEventMutation.isPending}
                className="w-full btn-meraki flex items-center justify-center gap-2 py-2"
              >
                {updateEventMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Guardar Cambios Evento</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
