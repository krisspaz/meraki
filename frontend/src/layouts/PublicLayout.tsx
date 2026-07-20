import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Mail, Sparkles } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col bg-meraki-darker overflow-hidden">
      {/* Elementos abstractos de fondo para darle el toque artístico de Diseño Gráfico */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-meraki-purple/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-meraki-coral/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-meraki-gradient p-[1px] flex items-center justify-center shadow-lg shadow-meraki-purple/30 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-meraki-darker rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-meraki-accent" />
            </div>
          </div>
          <div>
            <span className="font-display font-bold text-lg tracking-wider text-white">MERAKI</span>
            <span className="block text-[10px] uppercase tracking-widest text-meraki-accent font-semibold leading-none">EXPO 360</span>
          </div>
        </Link>
        
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-white/5 py-1.5 px-3 rounded-full border border-white/5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Carrera de Diseño Gráfico</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 glass-panel border-t border-white/5 py-8 px-6 md:px-12 text-center text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p className="font-medium text-slate-400">&copy; {new Date().getFullYear()} Expo 360 Meraki</p>
          <p className="text-xs text-slate-500 mt-1">Organizado por estudiantes de la Carrera de Diseño Gráfico</p>
        </div>
        
        <a 
          href="mailto:expo360.meraki@gmail.com" 
          className="flex items-center gap-2 text-meraki-accent hover:text-white transition-colors duration-200 bg-meraki-purple/10 py-1.5 px-3.5 rounded-full border border-meraki-purple/20 text-xs"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>expo360.meraki@gmail.com</span>
        </a>
      </footer>
    </div>
  );
};
export default PublicLayout;
