import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeViewProps {
  value: string;
  size?: number;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({ value, size = 180 }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-100 shadow-xl max-w-[240px] mx-auto">
      <div className="bg-white p-2 rounded-2xl">
        <QRCodeSVG 
          value={value} 
          size={size} 
          bgColor="#FFFFFF"
          fgColor="#000000"
          level="M"
          includeMargin={false}
        />
      </div>
      <span className="block mt-4 text-[10px] font-bold font-display uppercase tracking-widest text-slate-400">
        Código de Ingreso
      </span>
      <span className="block mt-1 text-sm font-extrabold text-slate-800 tracking-wider">
        {value}
      </span>
    </div>
  );
};
export default QRCodeView;
