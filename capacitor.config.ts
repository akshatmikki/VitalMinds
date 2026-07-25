import type { CapacitorConfig } from '@capacitor/cli';

// The Next.js app uses Server Actions + middleware-based Supabase auth +
// dynamic API routes, none of which survive a static export. Rather than
// bundling built assets into the native app, Capacitor is pointed at the
// live Vercel deployment (`server.url`) — the native shell behaves like a
// dedicated browser window over the real, already-working site. `webDir`
// still needs to exist for the CLI's tooling, but its contents are never
// shown once `server.url` takes over. It points at `www/` (committed)
// rather than Next.js's own `out/` (gitignored build output) so `npx cap
// sync` works on a fresh clone or in CI, not just on a machine that
// happens to have a stray `out/` directory lying around.
const config: CapacitorConfig = {
  appId: 'com.vitalmind.app',
  appName: 'VitalMind',
  webDir: 'www',
  server: {
    url: 'https://vital-minds.vercel.app',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#0f1623',
      showSpinner: false,
    },
  },
};

export default config;
