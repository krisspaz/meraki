import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { UserMeResponse } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const checkUser = useCallback(async () => {
    const accessToken = localStorage.getItem('meraki_access_token');
    if (!accessToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setError(null);
    } catch (err: any) {
      // Si falla, el interceptor de Axios ya maneja el refresh de token.
      // Si aún así da error, significa que la sesión expiró del todo.
      console.error('Error al obtener usuario actual:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // FastAPI OAuth2PasswordRequestForm espera x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, refresh_token } = response.data;
      localStorage.setItem('meraki_access_token', access_token);
      localStorage.setItem('meraki_refresh_token', refresh_token);
      
      // Obtener datos del usuario logueado
      const meResponse = await api.get('/auth/me');
      setUser(meResponse.data);
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Error en login:', err);
      const errMsg = err.response?.data?.detail || 'Error de conexión con el servidor.';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('meraki_access_token');
    localStorage.removeItem('meraki_refresh_token');
    setUser(null);
    navigate('/admin/login');
  }, [navigate]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    checkUser,
    isAuthenticated: !!user,
  };
};
