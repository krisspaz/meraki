import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { Event, Workshop, Invitation, Registration, DashboardStats } from '../types';

// --- CONSULTAS PÚBLICAS ---

export const usePublicEvent = () => {
  return useQuery<Event>({
    queryKey: ['publicEvent'],
    queryFn: async () => {
      const response = await api.get('/public/event');
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};

export const usePublicWorkshops = () => {
  return useQuery<Workshop[]>({
    queryKey: ['publicWorkshops'],
    queryFn: async () => {
      const response = await api.get('/public/workshops');
      return response.data;
    },
    refetchInterval: 25000, // Actualizar automáticamente cada 25 segundos
  });
};

export const useInvitation = (token?: string) => {
  return useQuery<Invitation>({
    queryKey: ['invitation', token],
    queryFn: async () => {
      const response = await api.get(`/public/invitations/${token}`);
      return response.data;
    },
    enabled: !!token,
    retry: false,
  });
};

export const useRegistration = (code?: string) => {
  return useQuery<Registration>({
    queryKey: ['registration', code],
    queryFn: async () => {
      const response = await api.get(`/public/registrations/${code}`);
      return response.data;
    },
    enabled: !!code,
    retry: false,
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Registration, any, any>({
    mutationFn: async (data) => {
      const response = await api.post('/public/registrations', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidar talleres para refrescar los cupos disponibles de inmediato
      queryClient.invalidateQueries({ queryKey: ['publicWorkshops'] });
      queryClient.invalidateQueries({ queryKey: ['invitation'] });
    },
  });
};

export const useCancelRegistrationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Registration, any, { code: string; reason?: string }>({
    mutationFn: async ({ code, reason }) => {
      const response = await api.post(`/public/registrations/${code}/cancel`, { reason });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['publicWorkshops'] });
      queryClient.invalidateQueries({ queryKey: ['registration', data.code] });
    },
  });
};

// --- CONSULTAS ADMINISTRATIVAS ---

export const useAdminDashboard = () => {
  return useQuery<DashboardStats>({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard');
      return response.data;
    },
    refetchInterval: 30000, // Refrescar cada 30s en el panel
  });
};

export const useAdminWorkshops = () => {
  return useQuery<Workshop[]>({
    queryKey: ['adminWorkshops'],
    queryFn: async () => {
      const response = await api.get('/admin/workshops');
      return response.data;
    },
  });
};

export const useCreateWorkshopMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Workshop, any, any>({
    mutationFn: async (data) => {
      const response = await api.post('/admin/workshops', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWorkshops'] });
      queryClient.invalidateQueries({ queryKey: ['publicWorkshops'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });
};

export const useUpdateWorkshopMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Workshop, any, { id: number; data: any }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/workshops/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminWorkshops'] });
      queryClient.invalidateQueries({ queryKey: ['publicWorkshops'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });
};

export const useDeleteWorkshopMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, any, number>({
    mutationFn: async (id) => {
      await api.delete(`/admin/workshops/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWorkshops'] });
      queryClient.invalidateQueries({ queryKey: ['publicWorkshops'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });
};

export const useCloseWorkshopMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Workshop, any, number>({
    mutationFn: async (id) => {
      const response = await api.post(`/admin/workshops/${id}/close`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWorkshops'] });
      queryClient.invalidateQueries({ queryKey: ['publicWorkshops'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });
};

export const useOpenWorkshopMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Workshop, any, number>({
    mutationFn: async (id) => {
      const response = await api.post(`/admin/workshops/${id}/open`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWorkshops'] });
      queryClient.invalidateQueries({ queryKey: ['publicWorkshops'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });
};

// --- INVITACIONES ADMIN ---

export const useAdminInvitations = (skip: number, limit: number, search: string) => {
  return useQuery<{ invitations: Invitation[]; total: number }>({
    queryKey: ['adminInvitations', skip, limit, search],
    queryFn: async () => {
      const response = await api.get('/admin/invitations', {
        params: { skip, limit, search },
      });
      return response.data;
    },
  });
};

export const useCreateInvitationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Invitation, any, any>({
    mutationFn: async (data) => {
      const response = await api.post('/admin/invitations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });
};

export const useCreateBulkInvitationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Invitation[], any, any>({
    mutationFn: async (data) => {
      const response = await api.post('/admin/invitations/bulk', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });
};

export const useToggleInvitationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Invitation, any, { id: number; active: boolean }>({
    mutationFn: async ({ id, active }) => {
      const response = await api.post(`/admin/invitations/${id}/toggle`, null, {
        params: { active },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });
};

// --- REGISTROS ADMIN ---

export const useAdminRegistrations = (skip: number, limit: number, search: string, workshopId?: number, status?: string) => {
  return useQuery<{ registrations: Registration[]; total: number }>({
    queryKey: ['adminRegistrations', skip, limit, search, workshopId, status],
    queryFn: async () => {
      const response = await api.get('/admin/registrations', {
        params: { skip, limit, search, workshop_id: workshopId, status },
      });
      return response.data;
    },
  });
};

export const useUpdateRegistrationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Registration, any, { id: number; data: any }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/registrations/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRegistrations'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['adminWorkshops'] });
    },
  });
};

export const useChangeWorkshopMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Registration, any, { id: number; newWorkshopId: number }>({
    mutationFn: async ({ id, newWorkshopId }) => {
      const response = await api.post(`/admin/registrations/${id}/change-workshop`, null, {
        params: { new_workshop_id: newWorkshopId },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRegistrations'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['adminWorkshops'] });
      queryClient.invalidateQueries({ queryKey: ['publicWorkshops'] });
    },
  });
};

export const useRecordAttendanceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Registration, any, number>({
    mutationFn: async (id) => {
      const response = await api.post(`/admin/registrations/${id}/attendance`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRegistrations'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });
};

// --- CONFIGURACIÓN Y EVENTOS ADMIN ---

export const useAdminSettings = () => {
  return useQuery<any[]>({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      const response = await api.get('/admin/settings');
      return response.data;
    },
  });
};

export const useUpdateSettingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<any, any, { key: string; value: string }>({
    mutationFn: async ({ key, value }) => {
      const response = await api.put(`/admin/settings/${key}`, { value });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['publicWorkshops'] });
    },
  });
};

export const useAdminEvent = () => {
  return useQuery<Event>({
    queryKey: ['adminEvent'],
    queryFn: async () => {
      const response = await api.get('/admin/event');
      return response.data;
    },
  });
};

export const useUpdateEventMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Event, any, any>({
    mutationFn: async (data) => {
      const response = await api.put('/admin/event', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvent'] });
      queryClient.invalidateQueries({ queryKey: ['publicEvent'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });
};

