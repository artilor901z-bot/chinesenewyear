import { defineConfig } from 'vite';

export default defineConfig({
  base: '/chinesenewyear/',
  plugins: [],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        fu: 'fu/index.html',
        gacha: 'gacha/index.html',
        collection: 'collection/index.html'
      }
    }
  }
});
