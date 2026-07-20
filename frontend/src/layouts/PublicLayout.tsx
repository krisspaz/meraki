import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Mail, Sparkles } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col bg-meraki-light overflow-hidden">
      {/* Elementos abstractos de fondo en colores de marca: Celeste (#AEE6ED), Morado (#DBB8FF), Naranja (#FF5B22) */}
      <div className="absolute top-[-10%] left-[-10%] w-[45rem] h-[45rem] rounded-full bg-[#AEE6ED]/30 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-[#DBB8FF]/40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[35rem] h-[35rem] rounded-full bg-[#FF5B22]/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-meraki-blue/10 py-4 px-6 md:px-12 flex justify-between items-center shadow-sm">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-meraki-gradient p-[2px] flex items-center justify-center shadow-md shadow-meraki-blue/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-meraki-blue" />
            </div>
          </div>
          <div>
            <span className="font-display font-black text-xl tracking-wider text-slate-900">MERAKI</span>
            <span className="block text-[10px] uppercase tracking-widest text-meraki-blue font-bold leading-none">EXPO 360</span>
          </div>
        </Link>
        
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white py-1.5 px-3.5 rounded-full border border-slate-200 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5B22] animate-pulse" />
          <span>Carrera de Diseño Gráfico</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 glass-panel border-t border-meraki-blue/10 py-8 px-6 md:px-12 text-center text-sm text-slate-600 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p className="font-bold text-slate-800">&copy; {new Date().getFullYear()} Expo 360 Meraki</p>
          <p className="text-xs text-slate-600 mt-1">
            <Link to="/admin/login" className="hover:text-meraki-blue font-semibold transition-colors duration-200 cursor-pointer">
              Organizado por estudiantes de la Carrera de Diseño Gráfico
            </Link>
          </p>
        </div>
        
        <a 
          href="mailto:expo360.meraki@gmail.com" 
          className="flex items-center gap-2 text-meraki-blue font-bold hover:text-white hover:bg-meraki-blue transition-all duration-200 bg-[#DBB8FF]/30 py-2 px-4 rounded-full border border-[#DBB8FF] text-xs shadow-sm"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>expo360.meraki@gmail.com</span>
        </a>
      </footer>
    </div>
  );
};
export default PublicLayout;
