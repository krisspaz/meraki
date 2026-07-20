import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#120E29] overflow-hidden">
      {/* Elementos abstractos de fondo en colores de marca: Celeste (#AEE6ED), Morado (#DBB8FF), Naranja (#FF5B22), Azul (#3939FF) */}
      <div className="absolute top-[-10%] left-[-10%] w-[45rem] h-[45rem] rounded-full bg-[#3939FF]/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-[#DBB8FF]/25 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[35rem] h-[35rem] rounded-full bg-[#FF5B22]/15 blur-[130px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-[#DBB8FF]/20 py-4 px-6 md:px-12 flex justify-between items-center shadow-lg">
        <Link to="/" className="flex items-center gap-3 group transition-transform duration-300 hover:scale-105">
          <img 
            src="/logo-1.png" 
            alt="Expo 360 Meraki Logo" 
            className="h-10 md:h-12 w-auto object-contain filter drop-shadow-[0_2px_12px_rgba(219,184,255,0.4)]" 
          />
        </Link>
        
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-300 bg-[#1A1638]/80 py-1.5 px-3.5 rounded-full border border-[#DBB8FF]/20 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5B22] animate-pulse" />
          <span>Carrera de Diseño Gráfico</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 glass-panel border-t border-[#DBB8FF]/20 py-8 px-6 md:px-12 text-center text-sm text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p className="font-bold text-white">&copy; {new Date().getFullYear()} Expo 360 Meraki</p>
          <p className="text-xs text-slate-400 mt-1">
            <Link to="/admin/login" className="hover:text-[#DBB8FF] font-semibold transition-colors duration-200 cursor-pointer">
              Organizado por estudiantes de la Carrera de Diseño Gráfico
            </Link>
          </p>
        </div>
        
        <a 
          href="mailto:expo360.meraki@gmail.com" 
          className="flex items-center gap-2 text-[#AEE6ED] font-bold hover:text-white hover:bg-[#3939FF] transition-all duration-200 bg-[#3939FF]/20 py-2 px-4 rounded-full border border-[#3939FF]/40 text-xs shadow-sm"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>expo360.meraki@gmail.com</span>
        </a>
      </footer>
    </div>
  );
};
export default PublicLayout;
