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
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-20 bg-meraki-light">
        <Loader2 className="w-12 h-12 text-meraki-blue animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Cargando confirmación de boleto...</p>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 py-20">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center space-y-6 border border-rose-200 shadow-xl bg-white">
          <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <h2 className="font-display font-extrabold text-lg text-slate-900">Registro no encontrado</h2>
          <p className="text-xs text-slate-600">El código de confirmación "{code}" no es válido o ha sido cancelado.</p>
          <Link to="/" className="inline-block bg-meraki-blue text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md">
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#DBB8FF]/30 rounded-full blur-[100px] pointer-events-none" />

      {/* Ticket Container */}
      <div className="w-full max-w-xl space-y-6 relative z-10 print:my-0 print:p-0">
        {/* Cabecera Informativa de Estado - Oculta en Impresión */}
        <div className="text-center space-y-3 print:hidden">
          {isConfirmed ? (
            <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 text-emerald-800 py-1.5 px-4 rounded-full text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Inscripción Confirmada</span>
            </div>
          ) : isWaiting ? (
            <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-800 py-1.5 px-4 rounded-full text-xs font-bold shadow-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Registrado en Lista de Espera</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-300 text-slate-700 py-1.5 px-4 rounded-full text-xs font-bold">
              <span>Estado: {registration.status}</span>
            </div>
          )}

          <h2 className="font-display font-black text-2xl md:text-3xl text-slate-900">
            {isConfirmed ? '¡Tu participación ha sido confirmada!' : '¡Registro en lista de espera!'}
          </h2>
          
          <p className="text-xs font-medium text-slate-600 max-w-sm mx-auto leading-relaxed">
            {isConfirmed 
              ? 'Te esperamos en la Expo 360 Meraki el domingo 16 de agosto de 2026. Guarda este boleto digital.' 
              : 'Has quedado en la lista de espera para el taller. Si se libera un cupo, se te notificará o promoverá automáticamente.'}
          </p>
        </div>

        {/* El Ticket físico */}
        <div className="glass-panel rounded-[2rem] border border-meraki-blue/20 overflow-hidden shadow-2xl bg-white print:bg-white print:text-black print:border-none print:shadow-none">
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
            <div className="border-b border-slate-200 pb-4">
              <span className="block text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Nombre del Participante</span>
              <span className="block text-lg font-black text-slate-900 mt-1">{registration.full_name}</span>
              <span className="block text-xs font-medium text-slate-600 mt-0.5">{registration.email}</span>
            </div>

            {/* Fila Taller y Salón */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-200 pb-6">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Taller Seleccionado</span>
                <span className="block text-sm font-black text-slate-900 mt-1">{registration.workshop?.name}</span>
                <span className="block text-xs font-medium text-slate-600 mt-1">Expositor: {registration.workshop?.speaker_name}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <MapPin className="w-4 h-4 text-[#FF5B22]" />
                  <span>Salón: <strong className="text-slate-900">{registration.workshop?.room}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Clock className="w-4 h-4 text-meraki-blue" />
                  <span>Horario: <strong className="text-slate-900">{formatTime(registration.workshop?.start_time)} - {formatTime(registration.workshop?.end_time)}</strong></span>
                </div>
              </div>
            </div>

            {/* Fila Fecha y Código QR */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between pt-2">
              <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800 justify-center md:justify-start">
                  <Calendar className="w-4 h-4 text-meraki-blue" />
                  <span>Domingo 16 de agosto de 2026</span>
                </div>
                
                <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 inline-block shadow-xs">
                  <span className="block text-[9px] text-slate-500 uppercase font-extrabold tracking-wider">Código de Registro</span>
                  <span className="block text-base font-mono font-black text-meraki-blue tracking-wider mt-0.5">{registration.code}</span>
                </div>
              </div>

              {/* Renders QR Code SVG */}
              <div className="print:block bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                <QRCodeView value={registration.code} size={130} />
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción - Ocultos en Impresión */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center print:hidden">
          <Link
            to={`/invitacion/${registration.invitation?.token}`}
            className="flex items-center gap-2 text-slate-700 hover:text-meraki-blue text-xs font-bold py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al evento</span>
          </Link>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 text-white bg-meraki-blue hover:bg-blue-700 border border-meraki-blue py-3 px-6 rounded-2xl text-xs font-black transition-all w-full sm:w-auto justify-center shadow-md shadow-meraki-blue/20"
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
