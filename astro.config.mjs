import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://philosophiesofacyborg.com',
  output: 'server',
  devToolbar: {
    enabled: false
  },
  adapter: node({
    mode: 'standalone'
  })
});
