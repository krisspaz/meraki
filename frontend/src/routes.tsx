import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Páginas Públicas
import { InvitationLanding } from './pages/public/InvitationLanding';
import { ConfirmationPage } from './pages/public/ConfirmationPage';
import { CancellationPage } from './pages/public/CancellationPage';

// Páginas Administrativas
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Workshops } from './pages/admin/Workshops';
import { Invitations } from './pages/admin/Invitations';
import { Registrations } from './pages/admin/Registrations';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<InvitationLanding />} />
        <Route path="/invitacion/:token" element={<InvitationLanding />} />
        <Route path="/confirmacion/:code" element={<ConfirmationPage />} />
        <Route path="/cancelar/:code" element={<CancellationPage />} />
      </Route>

      {/* Login de Administrador sin Sidebar */}
      <Route path="/admin/login" element={<Login />} />

      {/* Rutas de Administración Protegidas */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/workshops" element={<Workshops />} />
        <Route path="/admin/invitations" element={<Invitations />} />
        <Route path="/admin/registrations" element={<Registrations />} />
      </Route>

      {/* Ruta comodín de redirección */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
