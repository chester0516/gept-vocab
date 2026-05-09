import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/gept-vocab/',
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
});
