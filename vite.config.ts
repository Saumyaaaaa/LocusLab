import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration enabling React fast refresh and modular builds
export default defineConfig({
  plugins: [react()],
});
