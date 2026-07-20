import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrationSchema, RegistrationSchemaType } from '../schemas/validation';
import { Workshop } from '../types';
import { Loader2, User, Mail, Phone, School, UserCircle2 } from 'lucide-react';

interface RegistrationFormProps {
  onSubmit: (data: RegistrationSchemaType) => void;
  workshops: Workshop[];
  selectedWorkshopId?: number;
  invitationToken: string;
  isSubmitting: boolean;
  isWaitlistOnly?: boolean;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSubmit,
  workshops,
  selectedWorkshopId,
  invitationToken,
  isSubmitting,
  isWaitlistOnly = false
}) => {
  const selectedWorkshop = workshops.find((w) => w.id === selectedWorkshopId);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<RegistrationSchemaType>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      invitation_token: invitationToken,
      workshop_id: selectedWorkshopId,
      full_name: '',
      email: '',
      phone: '',
      institution: '',
      age: undefined,
      comments: '',
      terms_accepted: false,
      data_treatment_accepted: false
    }
  });

  // Mantener actualizado el ID del taller seleccionado
  React.useEffect(() => {
    if (selectedWorkshopId) {
      setValue('workshop_id', selectedWorkshopId, { shouldValidate: true });
    }
  }, [selectedWorkshopId, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Campo oculto para tokens de validación */}
      <input type="hidden" {...register('invitation_token')} />
      <input type="hidden" {...register('workshop_id')} />

      {/* Taller seleccionado informativo */}
      <div className="p-4 bg-[#DBB8FF]/20 rounded-2xl border border-[#DBB8FF]/50 space-y-1">
        <span className="text-[10px] uppercase tracking-widest text-meraki-blue font-black">Taller Seleccionado:</span>
        <h4 className="font-extrabold text-slate-900 text-sm">{selectedWorkshop ? selectedWorkshop.name : 'Ningún taller seleccionado'}</h4>
        {isWaitlistOnly && (
          <span className="inline-block bg-amber-100 text-amber-800 border border-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold mt-2">
            Entrarás en Lista de Espera (Cupos Agotados)
          </span>
        )}
      </div>

      {/* Nombre Completo */}
      <div className="space-y-1.5">
        <label htmlFor="full_name" className="text-xs font-bold text-slate-800 block">Nombre Completo *</label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="full_name"
            type="text"
            placeholder="Ej. Sofía Rodríguez"
            className={`w-full pl-10 glass-input ${errors.full_name ? 'border-rose-500 focus:ring-rose-500' : ''}`}
            disabled={isSubmitting}
            {...register('full_name')}
          />
        </div>
        {errors.full_name && <p className="text-[11px] text-rose-600 font-semibold">{errors.full_name.message}</p>}
      </div>

      {/* Fila Correo / Teléfono */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Correo */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-bold text-slate-800 block">Correo Electrónico *</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="email"
              type="email"
              placeholder="Ej. sofia@gmail.com"
              className={`w-full pl-10 glass-input ${errors.email ? 'border-rose-500 focus:ring-rose-500' : ''}`}
              disabled={isSubmitting}
              {...register('email')}
            />
          </div>
          {errors.email && <p className="text-[11px] text-rose-600 font-semibold">{errors.email.message}</p>}
        </div>

        {/* Teléfono */}
        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-xs font-bold text-slate-800 block">Número Telefónico *</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="phone"
              type="text"
              placeholder="Ej. +506 8888 8888"
              className={`w-full pl-10 glass-input ${errors.phone ? 'border-rose-500 focus:ring-rose-500' : ''}`}
              disabled={isSubmitting}
              {...register('phone')}
            />
          </div>
          {errors.phone && <p className="text-[11px] text-rose-600 font-semibold">{errors.phone.message}</p>}
        </div>
      </div>

      {/* Fila Institución / Edad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Centro Educativo */}
        <div className="md:col-span-2 space-y-1.5">
          <label htmlFor="institution" className="text-xs font-bold text-slate-800 block">Empresa o Institución (Opcional)</label>
          <div className="relative">
            <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="institution"
              type="text"
              placeholder="Ej. Universidad de Costa Rica"
              className="w-full pl-10 glass-input"
              disabled={isSubmitting}
              {...register('institution')}
            />
          </div>
          {errors.institution && <p className="text-[11px] text-rose-600 font-semibold">{errors.institution.message}</p>}
        </div>

        {/* Edad */}
        <div className="space-y-1.5">
          <label htmlFor="age" className="text-xs font-bold text-slate-800 block">Edad (Opcional)</label>
          <div className="relative">
            <UserCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="age"
              type="number"
              placeholder="Ej. 21"
              className="w-full pl-10 glass-input"
              disabled={isSubmitting}
              {...register('age')}
            />
          </div>
          {errors.age && <p className="text-[11px] text-rose-600 font-semibold">{errors.age.message}</p>}
        </div>
      </div>

      {/* Comentarios */}
      <div className="space-y-1.5">
        <label htmlFor="comments" className="text-xs font-bold text-slate-800 block">Comentarios Adicionales (Opcional)</label>
        <textarea
          id="comments"
          placeholder="Escribe alguna necesidad o consulta especial..."
          rows={3}
          className="w-full glass-input resize-none"
          disabled={isSubmitting}
          {...register('comments')}
        />
        {errors.comments && <p className="text-[11px] text-rose-600 font-semibold">{errors.comments.message}</p>}
      </div>

      {/* Checkboxes de Términos y Tratamiento de datos */}
      <div className="space-y-3 pt-2">
        {/* Términos */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            className="mt-1 rounded border-slate-300 text-meraki-blue focus:ring-meraki-blue"
            disabled={isSubmitting}
            {...register('terms_accepted')}
          />
          <span className="text-xs text-slate-600 leading-tight group-hover:text-slate-900 transition-colors">
            Acepto los términos y condiciones del evento, y declaro que mi asistencia está sujeta a la disponibilidad del taller.
          </span>
        </label>
        {errors.terms_accepted && <p className="text-[11px] text-rose-600 font-semibold">{errors.terms_accepted.message}</p>}

        {/* Tratamiento de datos */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            className="mt-1 rounded border-slate-300 text-meraki-blue focus:ring-meraki-blue"
            disabled={isSubmitting}
            {...register('data_treatment_accepted')}
          />
          <span className="text-xs text-slate-600 leading-tight group-hover:text-slate-900 transition-colors">
            Autorizo a la Carrera de Diseño Gráfico el tratamiento de mis datos personales para fines informativos y de logística del evento.
          </span>
        </label>
        {errors.data_treatment_accepted && <p className="text-[11px] text-rose-600 font-semibold">{errors.data_treatment_accepted.message}</p>}
      </div>

      {/* Botón Enviar */}
      <button
        type="submit"
        disabled={isSubmitting || !selectedWorkshopId}
        className="btn-meraki w-full flex items-center justify-center gap-2 mt-4 shadow-md"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Procesando inscripción...</span>
          </>
        ) : (
          <span>Confirmar Mi Asistencia</span>
        )}
      </button>
    </form>
  );
};
export default RegistrationForm;
