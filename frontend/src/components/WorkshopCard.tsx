import React from 'react';
import { Workshop } from '../types';
import { formatTime } from '../utils/formatters';
import { User2, Clock, MapPin, CheckCircle2 } from 'lucide-react';

interface WorkshopCardProps {
  workshop: Workshop;
  selectedId?: number;
  onSelect?: (id: number) => void;
  disabled?: boolean;
}

export const WorkshopCard: React.FC<WorkshopCardProps> = ({
  workshop,
  selectedId,
  onSelect,
  disabled
}) => {
  const isSelected = selectedId === workshop.id;
  
  // Determinar color de badge de estado
  const getStatusBadge = () => {
    switch (workshop.status) {
      case 'available':
        return <span className="badge-available">Disponible</span>;
      case 'almost_full':
        return <span className="badge-almost">Casi lleno</span>;
      case 'full':
        return <span className="badge-full">Lleno</span>;
      case 'closed_manually':
        return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded-full text-xs font-semibold">Cerrado</span>;
      case 'cancelled':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-xs font-semibold">Cancelado</span>;
      default:
        return null;
    }
  };

  const isFullOrClosed = ['full', 'closed_manually', 'cancelled'].includes(workshop.status) || workshop.slots_available <= 0;

  return (
    <div 
      className={`glass-card p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
        isSelected 
          ? 'ring-2 ring-[#DBB8FF] shadow-xl shadow-[#3939FF]/30 translate-y-[-4px] bg-[#1E1945]/90' 
          : 'bg-[#1E1945]/60'
      } ${isFullOrClosed ? 'opacity-75' : ''}`}
    >
      {/* Glow para tarjetas seleccionadas */}
      {isSelected && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3939FF]/30 rounded-full blur-[40px] pointer-events-none" />
      )}

      <div className="space-y-4 relative z-10">
        {/* Imagen del taller */}
        <div className="aspect-[16/9] w-full rounded-2xl bg-[#120E29]/80 relative overflow-hidden border border-[#DBB8FF]/20 shadow-inner">
          {workshop.image_url ? (
            <img 
              src={workshop.image_url} 
              alt={workshop.name} 
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-meraki-gradient text-white flex items-center justify-center font-display font-black text-3xl tracking-widest shadow-md">
              EXPO 360
            </div>
          )}
          <div className="absolute top-3 left-3 bg-[#120E29]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#DBB8FF]/20 shadow-md">
            {getStatusBadge()}
          </div>
        </div>

        {/* Detalles Taller */}
        <div>
          <h3 className="font-display font-black text-lg text-white leading-snug">{workshop.name}</h3>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#AEE6ED]" />
              <span>{formatTime(workshop.start_time)} - {formatTime(workshop.end_time)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#FF5B22]" />
              <span>{workshop.room}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed font-normal">{workshop.description}</p>
        </div>

        {/* Expositor */}
        <div className="bg-[#120E29]/70 rounded-2xl p-3 border border-[#DBB8FF]/15 flex gap-3 items-center">
          <div className="w-10 h-10 rounded-xl bg-[#3939FF]/20 border border-[#3939FF]/40 flex items-center justify-center shrink-0">
            <User2 className="w-5 h-5 text-[#DBB8FF]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-white leading-tight truncate">{workshop.speaker_name}</span>
            <span className="block text-[10px] font-medium text-slate-400 truncate mt-0.5">{workshop.speaker_bio}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4 relative z-10">
        {/* Cupos disponibles */}
        <div className="flex justify-between items-center text-xs border-t border-white/10 pt-3.5 font-semibold">
          <span className="text-slate-400">Cupos disponibles:</span>
          <span className={`font-bold font-display text-sm ${isFullOrClosed ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isFullOrClosed ? '0 cupos' : `${workshop.slots_available} / ${workshop.capacity}`}
          </span>
        </div>

        {/* Acción de Selección */}
        {onSelect && (
          <button
            type="button"
            disabled={disabled || (isFullOrClosed && !isSelected)}
            onClick={() => onSelect(workshop.id)}
            className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 ${
              isSelected
                ? 'bg-meraki-gradient text-white shadow-lg shadow-[#FF5B22]/30'
                : isFullOrClosed
                ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                : 'bg-[#120E29]/80 hover:bg-[#3939FF]/30 text-white border border-[#DBB8FF]/20 hover:border-[#DBB8FF]'
            }`}
          >
            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
            {isSelected ? 'Seleccionado' : isFullOrClosed ? 'Agotado' : 'Seleccionar taller'}
          </button>
        )}
      </div>
    </div>
  );
};
export default WorkshopCard;
