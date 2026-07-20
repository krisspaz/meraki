import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRegistration, useCancelRegistrationMutation } from '../../services/queries';
import { Loader2, AlertTriangle, CheckCircle, Home, Send } from 'lucide-react';

export const CancellationPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Consulta de registro
  const { data: registration, isLoading, error } = useRegistration(code);
  const cancelMutation = useCancelRegistrationMutation();

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    cancelMutation.mutate(
      { code, reason },
      {
        onSuccess: () => {
          setSuccess(true);
        },
        onError: (err: any) => {
          const detail = err.response?.data?.detail;
          setErrorMsg(detail?.message || 'Ocurrió un error al procesar la cancelación.');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20 bg-meraki-darker">
        <Loader2 className="w-12 h-12 text-meraki-purple animate-spin mb-4" />
        <p className="text-sm">Buscando tu inscripción...</p>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 py-20">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center space-y-6 border border-rose-500/20">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <h2 className="font-display font-extrabold text-lg text-white">Registro no encontrado</h2>
          <p className="text-xs text-slate-400">El código de inscripción "{code}" no es válido o ya ha sido cancelado.</p>
          <Link to="/" className="inline-block bg-white/5 border border-white/10 text-white text-xs px-4 py-2 rounded-xl hover:bg-white/10 transition-all">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 py-20">
        <div className="glass-panel p-8 md:p-12 rounded-3xl max-w-md w-full text-center space-y-6 border border-emerald-500/20 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-xl text-white">Cancelación exitosa</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Tu participación en la <strong>Expo 360 Meraki</strong> ha sido cancelada correctamente y el cupo ha sido liberado para otro participante.
            </p>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 bg-meraki-purple/20 hover:bg-meraki-purple/30 border border-meraki-purple/30 text-white text-xs py-2.5 px-6 rounded-2xl font-bold transition-all mx-auto">
            <Home className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-16 md:py-20 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="glass-panel p-6 md:p-8 rounded-3xl max-w-md w-full border border-rose-500/15 relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <h2 className="font-display font-extrabold text-xl text-white">Cancelar Inscripción</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Estás a punto de cancelar tu inscripción para el taller <strong>"{registration.workshop?.name}"</strong>.
          </p>
        </div>

        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1.5 text-xs">
          <div>
            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px]">Código</span>
            <span className="font-mono text-white font-bold">{registration.code}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px]">Nombre</span>
            <span className="text-white font-semibold">{registration.full_name}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleCancel} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="reason" className="text-xs font-semibold text-slate-300 block">
              Motivo de la Cancelación (Opcional)
            </label>
            <textarea
              id="reason"
              placeholder="Ej. Conflicto de horario, enfermedad, etc..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full glass-input resize-none text-xs"
              disabled={cancelMutation.isPending}
            />
          </div>

          <button
            type="submit"
            disabled={cancelMutation.isPending}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando cancelación...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirmar Cancelación de Registro</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <Link
            to={`/confirmacion/${registration.code}`}
            className="text-[11px] text-slate-500 hover:text-white transition-colors"
          >
            Volver a mi boleto
          </Link>
        </div>
      </div>
    </div>
  );
};
export default CancellationPage;
