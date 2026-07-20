import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, CalendarRange, Ticket, Users, LogOut, Loader2, Sparkles } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-meraki-darker flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 text-meraki-purple animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide">Cargando sesión administrativa...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const menuItems = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/workshops', name: 'Talleres', icon: CalendarRange },
    { path: '/admin/invitations', name: 'Invitaciones', icon: Ticket },
    { path: '/admin/registrations', name: 'Participantes', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-meraki-darker flex flex-col md:flex-row text-slate-100">
      {/* Sidebar para pantallas medianas/grandes */}
      <aside className="w-full md:w-64 bg-meraki-card border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-meraki-gradient flex items-center justify-center shadow-lg shadow-meraki-purple/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-display font-bold tracking-wider text-sm block">PANEL ADMIN</span>
              <span className="text-[9px] uppercase tracking-widest text-meraki-accent font-semibold block leading-none">Expo 360 Meraki</span>
            </div>
          </div>

          {/* Menú de navegación */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-meraki-purple/10 text-meraki-accent border-l-2 border-meraki-purple pl-3'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Info Usuario & Logout */}
        <div className="p-4 border-t border-white/5 space-y-3 bg-black/10">
          <div className="px-4 py-2">
            <span className="block text-xs font-semibold text-slate-300 truncate">{user?.username}</span>
            <span className="block text-[10px] text-slate-500 truncate">{user?.email}</span>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Área de Contenido Principal */}
      <main className="flex-1 flex flex-col overflow-x-hidden min-w-0">
        <header className="h-16 border-b border-white/5 px-6 md:px-8 flex items-center justify-between bg-meraki-dark/45 backdrop-blur-md shrink-0">
          <h1 className="font-display font-semibold text-lg text-white">
            {menuItems.find((item) => item.path === location.pathname)?.name || 'Panel de Administración'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs py-1 px-3 rounded-full bg-meraki-purple/10 border border-meraki-purple/20 text-meraki-accent font-semibold">
              Admin Activo
            </span>
          </div>
        </header>
        
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
export default AdminLayout;
