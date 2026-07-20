import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownProps {
  targetDateStr?: string;
  onExpiry?: () => void;
}

export const Countdown: React.FC<CountdownProps> = ({ targetDateStr, onExpiry }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    if (!targetDateStr) return;

    const calculateTime = () => {
      const difference = +new Date(targetDateStr) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onExpiry) onExpiry();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [targetDateStr, onExpiry]);

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center justify-center gap-2 text-rose-300 bg-rose-500/10 py-3 px-6 rounded-2xl border border-rose-500/20 max-w-md mx-auto">
        <Clock className="w-5 h-5" />
        <span className="font-bold text-sm">El período de registro ha finalizado.</span>
      </div>
    );
  }

  const timeUnits = [
    { label: 'Días', value: timeLeft.days },
    { label: 'Horas', value: timeLeft.hours },
    { label: 'Min.', value: timeLeft.minutes },
    { label: 'Seg.', value: timeLeft.seconds },
  ];

  return (
    <div className="text-center space-y-4">
      <p className="text-xs uppercase tracking-widest text-slate-300 font-extrabold flex items-center justify-center gap-2">
        <Clock className="w-4 h-4 text-[#FF5B22] animate-pulse" />
        <span>Inscripciones cierran en</span>
      </p>
      
      <div className="flex justify-center gap-3 md:gap-4">
        {timeUnits.map((unit) => (
          <div key={unit.label} className="flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#120E29]/80 rounded-2xl flex items-center justify-center border border-[#DBB8FF]/20 shadow-lg">
              <span className="text-xl md:text-2xl font-black font-display text-[#DBB8FF]">
                {unit.value.toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-2 font-bold">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Countdown;
