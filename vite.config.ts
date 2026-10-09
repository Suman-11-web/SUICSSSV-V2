import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      emptyOutDir: false,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          howToUse: path.resolve(__dirname, 'how-to-use.html'),
          docs: path.resolve(__dirname, 'docs/index.html'),
          buttons: path.resolve(__dirname, 'example/buttons.html'),
          cards: path.resolve(__dirname, 'example/cards.html'),
          forms: path.resolve(__dirname, 'example/forms.html'),
          tables: path.resolve(__dirname, 'example/tables.html'),
          modals: path.resolve(__dirname, 'example/modals.html'),
          navigation: path.resolve(__dirname, 'example/navigation.html'),
          feedback: path.resolve(__dirname, 'example/feedback.html'),
          layout: path.resolve(__dirname, 'example/layout.html'),
          utilities: path.resolve(__dirname, 'example/utilities.html'),
          advanced: path.resolve(__dirname, 'example/advanced.html'),
          animations: path.resolve(__dirname, 'example/animations.html'),
          tests: path.resolve(__dirname, 'tests/index.html'),
        },
      },
    },
  };
});
