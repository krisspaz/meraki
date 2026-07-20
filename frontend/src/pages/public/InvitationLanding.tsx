import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useInvitation, 
  usePublicEvent, 
  usePublicWorkshops, 
  useRegisterMutation 
} from '../../services/queries';
import { Countdown } from '../../components/Countdown';
import { WorkshopCard } from '../../components/WorkshopCard';
import { RegistrationForm } from '../../components/RegistrationForm';
import { RegistrationSchemaType } from '../../schemas/validation';
import { formatDateLong } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import { Loader2, AlertCircle, Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';

export const InvitationLanding: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const invitationToken = token || 'general';
  const navigate = useNavigate();
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<number | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Consultas asíncronas
  const { data: invitation, error: invError, isLoading: loadingInv } = useInvitation(invitationToken);
  const { data: event, isLoading: loadingEvent } = usePublicEvent();
  const { data: workshops, isLoading: loadingWorkshops } = usePublicWorkshops();

  // Mutación de Registro
  const registerMutation = useRegisterMutation();

  const isLoading = loadingInv || loadingEvent || loadingWorkshops;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20 bg-meraki-darker">
        <Loader2 className="w-12 h-12 text-meraki-purple animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wider">Verificando tu invitación especial...</p>
      </div>
    );
  }

  // Manejar errores de invitación inválida, vencida o deshabilitada
  if (invError || !invitation) {
    const errData = (invError as any)?.response?.data?.detail;
    const errCode = errData?.code || 'INVITATION_INVALID';
    const errMessage = errData?.message || 'Esta invitación no es válida o no existe.';

    return (
      <div className="flex-1 flex items-center justify-center p-6 py-20">
        <div className="glass-panel p-8 md:p-12 rounded-3xl max-w-lg w-full text-center space-y-6 border border-rose-500/20">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-xl text-white">Invitación no disponible</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{errMessage}</p>
          </div>
          <div className="text-xs text-slate-500 pt-4 border-t border-white/5">
            Si crees que esto es un error, por favor contacta a la organización en:
            <a href="mailto:expo360.meraki@gmail.com" className="block text-meraki-accent font-semibold mt-1 hover:underline">
              expo360.meraki@gmail.com
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Verificar si la actividad completa está llena
  const isEventFull = event && event.max_participants <= workshops?.reduce((acc, w) => acc + w.confirmed_count, 0)!;

  const handleSubmit = (formData: RegistrationSchemaType) => {
    setSubmitError(null);
    registerMutation.mutate(formData, {
      onSuccess: (data) => {
        // Disparar confeti para un efecto de UX Premium
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        // Redirigir a la página de éxito después de un breve delay
        setTimeout(() => {
          navigate(`/confirmacion/${data.code}`);
        }, 1200);
      },
      onError: (err: any) => {
        const errDetail = err.response?.data?.detail;
        const msg = errDetail?.message || 'Ocurrió un error al procesar el registro. Inténtelo nuevamente.';
        setSubmitError(msg);
      }
    });
  };

  const selectedWorkshopObj = workshops?.find((w) => w.id === selectedWorkshopId);
  const isWorkshopFull = selectedWorkshopObj && (selectedWorkshopObj.status === 'full' || selectedWorkshopObj.slots_available <= 0);

  return (
    <div className="flex-1 py-10 px-4 md:px-8 space-y-12 max-w-7xl mx-auto">
      {/* Banner Principal e Invitación */}
      <section className="glass-panel p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row gap-8 items-center border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-meraki-gradient opacity-10 rounded-full blur-[100px]" />
        
        <div className="space-y-6 md:flex-1">
          <div className="inline-block bg-meraki-purple/20 border border-meraki-purple/30 text-meraki-accent text-xs px-3.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Invitación Especial
          </div>
          
          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-3xl md:text-5xl text-white uppercase tracking-tight leading-none">
              {event?.name}
            </h1>
            <p className="font-display text-slate-400 text-sm font-semibold tracking-wider">
              Organizado por la {event?.organizer}.
            </p>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            La Carrera de Diseño Gráfico tiene el gusto de invitarte a <strong>Expo 360 Meraki</strong>, 
            una actividad creada para compartir conocimientos, creatividad y nuevas experiencias por medio 
            de dos talleres especiales.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
              <Calendar className="w-5 h-5 text-meraki-accent" />
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Fecha</span>
                <span className="block text-xs font-bold text-white">{event ? formatDateLong(event.start_date.toString()) : ''}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
              <Clock className="w-5 h-5 text-meraki-accent" />
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Hora de inicio</span>
                <span className="block text-xs font-bold text-white">10:00 a. m.</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
              <MapPin className="w-5 h-5 text-meraki-accent" />
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Ubicación</span>
                <span className="block text-xs font-bold text-white truncate max-w-[150px]">{event?.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Imagen representativa / Cuenta Regresiva */}
        <div className="w-full md:w-80 shrink-0 space-y-6">
          <div className="aspect-[4/3] w-full bg-black/40 rounded-3xl overflow-hidden border border-white/5 shadow-inner p-1 flex items-center justify-center bg-meraki-dark">
            <img src="/logo-1.png" alt="Meraki Logo" className="w-48 h-auto object-contain animate-float" />
          </div>
          
          <Countdown targetDateStr={event?.registration_deadline} />
        </div>
      </section>

      {/* Bloqueo General: si la actividad completa está llena */}
      {isEventFull ? (
        <section className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-3xl text-center space-y-4 max-w-2xl mx-auto shadow-lg">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="font-display font-extrabold text-lg text-white">Actividad Completa</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Los cupos disponibles para esta actividad se han agotado. Gracias por tu interés.
          </p>
          <p className="text-xs text-slate-500">
            Para dudas sobre acreditación o lista de espera manual, puedes escribirnos a <a href="mailto:expo360.meraki@gmail.com" className="text-meraki-accent font-semibold hover:underline">expo360.meraki@gmail.com</a>.
          </p>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Listado de Talleres */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-1.5">
              <h2 className="font-display font-extrabold text-xl text-white uppercase tracking-wider flex items-center gap-2">
                <span>Talleres Disponibles</span>
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona uno de los dos talleres especializados para realizar tu inscripción en la plataforma.
              </p>
            </div>

            {/* Alerta de Cupos Limitados */}
            <div className="p-4 bg-meraki-purple/10 border border-meraki-purple/20 rounded-2xl flex gap-3 items-start">
              <CheckCircle className="w-5 h-5 text-meraki-accent shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-white">¡Reserva tu espacio!</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Los talleres tienen cupos limitados. Cuando un taller alcance su capacidad máxima, 
                  las inscripciones se cerrarán automáticamente para evitar registros excesivos.
                </p>
              </div>
            </div>

            {/* Grid de Talleres */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {workshops?.map((w) => (
                <WorkshopCard
                  key={w.id}
                  workshop={w}
                  selectedId={selectedWorkshopId}
                  onSelect={(id) => {
                    setSelectedWorkshopId(id);
                    setSubmitError(null);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Formulario de Registro */}
          <div className="glass-panel p-6 md:p-8 rounded-[2rem] border border-white/5 self-start shadow-xl space-y-6">
            <div>
              <h3 className="font-display font-bold text-lg text-white">Formulario de Registro</h3>
              <p className="text-xs text-slate-500 mt-1">Completa tus datos personales para asegurar tu pase.</p>
            </div>

            {submitError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2.5 items-start">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{submitError}</span>
              </div>
            )}

            {selectedWorkshopId ? (
              <RegistrationForm
                onSubmit={handleSubmit}
                workshops={workshops || []}
                selectedWorkshopId={selectedWorkshopId}
                invitationToken={invitationToken}
                isSubmitting={registerMutation.isPending}
                isWaitlistOnly={isWorkshopFull}
              />
            ) : (
              <div className="py-12 text-center space-y-3 bg-black/10 rounded-2xl border border-dashed border-white/5">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                  Por favor, selecciona uno de los talleres de la izquierda para habilitar el formulario de inscripción.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default InvitationLanding;
