import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://ositukenegere.xyz',
  output: 'server',
  devToolbar: {
    enabled: false
  },
  adapter: vercel()
});
