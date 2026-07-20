import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Detectar si estamos dentro del contenedor Docker (tiene VITE_API_URL seteado)
// En Docker: el backend es alcanzable por el nombre del servicio "backend"
// Fuera de Docker: el backend es alcanzable por "localhost"
const isDocker = !!process.env.VITE_API_URL;
const backendTarget = isDocker ? 'http://backend:8000' : 'http://localhost:8000';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // necesario para Docker
    allowedHosts: true,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        rewrite: (path) => path, // no reescribir ya que el backend espera /api
      },
    },
  },
});
