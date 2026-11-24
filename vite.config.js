import { createHash } from 'node:crypto';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'offline-shell',
    apply: 'build',
    generateBundle(_, bundle) {
      const assets = ['./', ...Object.keys(bundle)
        .filter((file) => !/\.(svg|ttf|woff)$/.test(file))
        .map((file) => './' + file)];
      const version = createHash('sha256').update(JSON.stringify(assets)).update(String(bundle['index.html']?.source)).digest('hex').slice(0, 12);
      this.emitFile({ type: 'asset', fileName: 'offline.js', source: `
        const key = 'shiftproof-${version}';
        const assets = ${JSON.stringify(assets)}.map(path => new URL(path, self.registration.scope).href);
        self.addEventListener('install', event => event.waitUntil(caches.open(key).then(cache => cache.addAll(assets))));
        self.addEventListener('activate', event => event.waitUntil((async () => {
          const keys = await caches.keys();
          await Promise.all(keys.filter(name => name.startsWith('shiftproof-') && name !== key).map(name => caches.delete(name)));
          await self.clients.claim();
        })()));
        self.addEventListener('fetch', event => {
          if (event.request.method !== 'GET') return;
          const url = event.request.url;
          const isHome = event.request.mode === 'navigate' && (
            new URL(url).pathname === new URL(self.registration.scope).pathname ||
            new URL(url).pathname === new URL('index.html', self.registration.scope).pathname
          );
          if (isHome) event.respondWith(fetch(event.request).catch(async () => (await caches.open(key)).match(assets[0])));
          else if (assets.includes(url)) event.respondWith(caches.open(key).then(async cache => await cache.match(url) || fetch(event.request)));
        });
      ` });
    },
  }],
});
