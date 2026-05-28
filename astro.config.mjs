import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.ositukengere.xyz',
  output: 'server',
  devToolbar: {
    enabled: false
  },
  adapter: vercel()
});
