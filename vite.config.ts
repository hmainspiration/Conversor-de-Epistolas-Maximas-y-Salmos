import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno (incluyendo las que empiezan por VITE_)
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Reemplazo estático para que 'process.env.API_KEY' funcione en el navegador
      // tomando el valor de VITE_API_KEY configurado en Vercel/local
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
    }
  };
});