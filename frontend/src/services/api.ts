import axios from 'axios';

// Configurar el URL de la API:
// 1. Usar VITE_API_URL si está definido (para despliegues en producción).
// 2. Si estamos en Vercel (u otro host remoto) y no se definió VITE_API_URL, redirigir al backend local en puerto 8000.
// 3. De lo contrario, usar la ruta relativa /api.
let API_URL = (import.meta as any).env?.VITE_API_URL;

if (!API_URL) {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    API_URL = 'http://localhost:8000/api';
  } else {
    API_URL = '/api';
  }
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Peticiones: Adjuntar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('meraki_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuestas: Manejar expiración de token y refresco automático
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es un error 401 y no es una petición de login o de refresh
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/login' &&
      originalRequest.url !== '/auth/refresh'
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('meraki_refresh_token');
      if (!refreshToken) {
        // Redirigir a login si no hay refresh token
        isRefreshing = false;
        localStorage.removeItem('meraki_access_token');
        localStorage.removeItem('meraki_refresh_token');
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: new_refresh_token } = response.data;
        
        localStorage.setItem('meraki_access_token', access_token);
        localStorage.setItem('meraki_refresh_token', new_refresh_token);

        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

        processQueue(null, access_token);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Limpiar tokens y redirigir
        localStorage.removeItem('meraki_access_token');
        localStorage.removeItem('meraki_refresh_token');
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
