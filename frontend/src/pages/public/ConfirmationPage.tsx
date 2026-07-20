import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRegistration } from '../../services/queries';
import { QRCodeView } from '../../components/QRCodeView';
import { formatTime } from '../../utils/formatters';
import { Loader2, CheckCircle2, AlertTriangle, Printer, ArrowLeft, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';

export const ConfirmationPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { data: registration, isLoading, error } = useRegistration(code);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20 bg-[#120E29]">
        <Loader2 className="w-12 h-12 text-[#DBB8FF] animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-300">Cargando confirmación de boleto...</p>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 py-20">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center space-y-6 border border-rose-500/30 shadow-2xl bg-[#1A1638]/90">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <h2 className="font-display font-extrabold text-lg text-white">Registro no encontrado</h2>
          <p className="text-xs text-slate-300">El código de confirmación "{code}" no es válido o ha sido cancelado.</p>
          <Link to="/" className="inline-block btn-meraki text-xs font-bold px-5 py-2.5 rounded-xl shadow-md">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const isConfirmed = registration.status === 'confirmed' || registration.status === 'attended';
  const isWaiting = registration.status === 'waiting';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 py-12 md:py-20 relative">
      {/* Decoración de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#DBB8FF]/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Ticket Container */}
      <div className="w-full max-w-xl space-y-6 relative z-10 print:my-0 print:p-0">
        {/* Cabecera Informativa de Estado - Oculta en Impresión */}
        <div className="text-center space-y-3 print:hidden">
          {isConfirmed ? (
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 py-1.5 px-4 rounded-full text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Inscripción Confirmada</span>
            </div>
          ) : isWaiting ? (
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 py-1.5 px-4 rounded-full text-xs font-bold shadow-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Registrado en Lista de Espera</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 py-1.5 px-4 rounded-full text-xs font-bold">
              <span>Estado: {registration.status}</span>
            </div>
          )}

          <h2 className="font-display font-black text-2xl md:text-3xl text-white">
            {isConfirmed ? '¡Tu participación ha sido confirmada!' : '¡Registro en lista de espera!'}
          </h2>
          
          <p className="text-xs font-medium text-slate-300 max-w-sm mx-auto leading-relaxed">
            {isConfirmed 
              ? 'Te esperamos en la Expo 360 Meraki el domingo 16 de agosto de 2026. Guarda este boleto digital.' 
              : 'Has quedado en la lista de espera para el taller. Si se libera un cupo, se te notificará o promoverá automáticamente.'}
          </p>
        </div>

        {/* El Ticket físico */}
        <div className="glass-panel rounded-[2rem] border border-[#DBB8FF]/20 overflow-hidden shadow-2xl bg-[#1A1638]/90 print:bg-white print:text-black print:border-none print:shadow-none">
          {/* Encabezado del Ticket */}
          <div className="bg-meraki-gradient p-6 text-center text-white relative shadow-md">
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <span className="text-[9px] uppercase tracking-widest font-black">Meraki Ticket</span>
            </div>
            <h3 className="font-display font-black text-xl md:text-2xl tracking-tight uppercase mt-2">Expo 360 Meraki</h3>
            <span className="text-[10px] tracking-wider uppercase font-extrabold opacity-95 block mt-1">Boleto Digital de Acceso</span>
          </div>

          <div className="p-6 md:p-8 space-y-6 print:text-black">
            {/* Participante */}
            <div className="border-b border-white/10 pb-4">
              <span className="block text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Nombre del Participante</span>
              <span className="block text-lg font-black text-white mt-1">{registration.full_name}</span>
              <span className="block text-xs font-medium text-[#AEE6ED] mt-0.5">{registration.email}</span>
            </div>

            {/* Fila Taller y Salón */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-white/10 pb-6">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Taller Seleccionado</span>
                <span className="block text-sm font-black text-white mt-1">{registration.workshop?.name}</span>
                <span className="block text-xs font-medium text-slate-300 mt-1">Expositor: {registration.workshop?.speaker_name}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <MapPin className="w-4 h-4 text-[#FF5B22]" />
                  <span>Salón: <strong className="text-white">{registration.workshop?.room}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Clock className="w-4 h-4 text-[#AEE6ED]" />
                  <span>Horario: <strong className="text-white">{formatTime(registration.workshop?.start_time)} - {formatTime(registration.workshop?.end_time)}</strong></span>
                </div>
              </div>
            </div>

            {/* Fila Fecha y Código QR */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between pt-2">
              <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-200 justify-center md:justify-start">
                  <Calendar className="w-4 h-4 text-[#DBB8FF]" />
                  <span>Domingo 16 de agosto de 2026</span>
                </div>
                
                <div className="bg-[#120E29] p-3 rounded-2xl border border-[#DBB8FF]/20 inline-block shadow-sm">
                  <span className="block text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">Código de Registro</span>
                  <span className="block text-base font-mono font-black text-[#DBB8FF] tracking-wider mt-0.5">{registration.code}</span>
                </div>
              </div>

              {/* Renders QR Code SVG */}
              <div className="print:block bg-white p-2.5 rounded-2xl border border-white/20 shadow-md">
                <QRCodeView value={registration.code} size={130} />
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción - Ocultos en Impresión */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center print:hidden">
          <Link
            to={`/invitacion/${registration.invitation?.token}`}
            className="flex items-center gap-2 text-slate-200 hover:text-white text-xs font-bold py-2.5 px-4 rounded-xl bg-[#1A1638] hover:bg-[#272156] border border-[#DBB8FF]/20 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#AEE6ED]" />
            <span>Volver al evento</span>
          </Link>

          <button
            onClick={handlePrint}
            className="btn-meraki flex items-center gap-2 text-white py-3 px-6 rounded-2xl text-xs font-black transition-all w-full sm:w-auto justify-center shadow-lg shadow-[#FF5B22]/30"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Boleto / Guardar PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default ConfirmationPage;
