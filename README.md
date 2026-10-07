# VitalMind 🌿

Your AI-powered mental, physical, and emotional wellness companion. Built with Next.js, Supabase, and Groq (free AI).

## Features
- 🤖 **AI Companion** — streaming chat with Groq (Llama 3.1, free tier)
- 📊 **Mood tracking** — daily check-ins with trend charts
- 📖 **Journal** — guided prompts with AI reflections
- ✅ **Habit tracker** — daily habits with streaks
- 💪 **Health metrics** — sleep, steps, water, weight
- 👥 **Community** — realtime chat rooms (anonymous option)

## Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database:** Supabase (Postgres + Auth + Realtime)
- **AI:** Groq API (free) with Llama 3.1
- **Deployment:** Vercel (free Hobby plan)
- **Mobile:** Capacitor (native iOS/Android shell over the live web app — see [Mobile app](#mobile-app-ios--android-via-capacitor))

## Cost: $0
- Vercel Hobby: free
- Supabase Free: free
- Groq API: free tier
- Total: **$0/month**

---

## Setup (10 minutes)

### 1. Clone and install
```bash
git clone <your-repo>
cd vitalmind
npm install
```

### 2. Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Go to SQL Editor → paste contents of `supabase/migrations/001_initial.sql` → Run
3. Go to Settings → API → copy your URL and anon key

### 3. Get Groq API key (free)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up → API Keys → Create new key

### 4. Configure environment
```bash
cp .env.local.example .env.local
```
Fill in your keys in `.env.local`

### 5. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 6. Deploy to Vercel (free)
```bash
npx vercel
```
Add your environment variables in the Vercel dashboard.

---

## Mobile app (iOS / Android via Capacitor)

The app ships as a native shell via [Capacitor](https://capacitorjs.com) that loads the **live Vercel deployment** (`server.url` in `capacitor.config.ts`) instead of a bundled static build. This is deliberate: the app relies on Next.js Server Actions, middleware-based Supabase auth, and dynamic API routes, none of which survive a static export (`next export`/`output: 'export'`). The native app is effectively a dedicated browser window over the real site, which means:

- Every web change ships to the native apps automatically the moment it's deployed to Vercel — no native rebuild needed for ordinary feature work.
- A native rebuild (`npx cap sync`) is only needed when you change `capacitor.config.ts`, add/update a Capacitor plugin, or change native assets (icons, splash screen).
- Native APIs (haptics on the games in `components/games/`, status bar styling, splash screen) are wired through `lib/haptics.ts` and `components/NativeInit.tsx` — both feature-detect `Capacitor.isNativePlatform()` and no-op harmlessly in the regular web app.

### One-time setup (already done in this repo)
```bash
npm install @capacitor/core @capacitor/haptics @capacitor/splash-screen @capacitor/status-bar
npm install --save-dev @capacitor/cli
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```
This created the `ios/` and `android/` native project folders (commit these) and `capacitor.config.ts`, plus `www/` (a placeholder `webDir`, committed — required by the CLI so `npx cap sync` works on a fresh clone or in CI, but its contents are never actually shown since `server.url` takes over immediately).

### Updating `capacitor.config.ts`
`server.url` points at `https://vital-minds.vercel.app`. If the production domain ever changes, update it there. For testing against a local dev server on a physical device, temporarily set `server.url` to `http://<your-LAN-IP>:3000` while `npm run dev` is running (your phone and computer need to be on the same network), then change it back before shipping.

### Building & running
```bash
npx cap sync        # re-copies webDir + updates native plugins after any config/plugin change
npx cap open android # opens the project in Android Studio
npx cap open ios     # opens the project in Xcode (macOS only)
```

- **Android**: works fully on Windows/Linux/macOS. Requires [Android Studio](https://developer.android.com/studio). From Android Studio you can run on an emulator or a USB-connected device, and later build a signed release for the Play Console.
- **iOS**: requires **Xcode, which only runs on macOS**. If you're on Windows, you'll need either a Mac, a cloud Mac build service (e.g. Codemagic, Ionic Appflow), or a colleague's machine to open `ios/App/App.xcworkspace`, run `pod install` (the CLI already tried once and skipped it since CocoaPods isn't installed on this machine), and produce a signed build.

### Building without a Mac or Android Studio (GitHub Actions)

Two workflows in `.github/workflows/` build installable app files on GitHub's own servers — nothing to install locally beyond the app itself:

- **`android-build.yml`** — builds a debug **APK** on a Linux runner. Every push to `main` that touches `android/`, `capacitor.config.ts`, or `package.json` (or a manual run from the Actions tab) produces a `vitalmind-debug-apk` artifact. Download it, transfer to an Android phone, and tap to install (allow "install from unknown sources" the first time).
- **`ios-build.yml`** — builds an **unsigned `.ipa`** on a macOS runner (Apple provides these — Xcode comes preinstalled, no Mac purchase needed). It can't produce a directly-installable app on its own because there's no Apple Developer account wired into CI for code signing. Instead:
  1. Download the `vitalmind-unsigned-ipa` artifact from the workflow run.
  2. Install [Sideloadly](https://sideloadly.io) (free, Windows/macOS) on your computer.
  3. Connect your iPhone via USB, drag the `.ipa` into Sideloadly, sign in with your Apple ID when prompted (this happens locally in Sideloadly, using the same free-tier personal-signing mechanism Xcode itself uses), and install.
  4. Free Apple ID signing expires after **7 days** — re-run the same Sideloadly steps on the existing `.ipa` to reinstall, no rebuild needed unless the app itself changed.

  If you'd rather have a properly signed build with a 1-year expiry (and a path to TestFlight later), get an Apple Developer Program membership ($99/yr) and let me know — the workflow can be extended to sign in CI once you have a distribution certificate, provisioning profile, and your device's UDID registered.

### Automatic tracking from the phone (steps, walking, sleep, heart rate)

In the native app, the Health page's **Phone tracking** card replaces the Google Fit card (Google blocks its OAuth sign-in inside app WebViews, so Google Fit stays web-only).

- **Health Connect (Android) / Apple Health (iOS)** via `@capgo/capacitor-health` — reads daily steps, walking distance, active calories, sleep, average heart rate and weight. iPhones count steps on their own; on Android the steps come from whatever writes to Health Connect (Google Fit, Samsung Health, Fitbit, most watch apps — install Google Fit if nothing does yet).
- **Sleep from phone usage (Android)** — `PhoneUsagePlugin.java` reads screen on/off history (needs the "Usage access" special permission), and `lib/health/phone-health.ts` estimates sleep as the longest overnight screen-off stretch, ignoring quick checks under 5 minutes. A real sleep tracker's data always wins over this estimate, and sleep the user typed in by hand is never overwritten.
- `components/health/PhoneHealthAutoSync.tsx` (in the dashboard layout) re-syncs the last 7 days whenever the app is opened or brought back to the foreground, at most every 15 minutes. Everything lands in `health_metrics`, so the wellness score, charts and AI companion all use it.
- Run `supabase/migrations/015_phone_health.sql` for the extra columns (distance, calories, heart rate, sleep source). Without it, sync still works but only saves steps, sleep and weight.
- iOS: HealthKit needs the `App/App.entitlements` capability to be signed into the app. Xcode or a paid developer account does this; free Sideloadly signing may not keep it.

### App store prerequisites (not something the CLI can do for you)
- **Apple Developer Program** — $99/year, needed for TestFlight and App Store submission.
- **Google Play Console** — $25 one-time, needed for Play Store submission.
- A real app icon (at least 1024×1024 PNG) — `public/manifest.json` currently references `/icon-192.png` and `/icon-512.png`, which don't exist yet in `public/`. Generate native icon/splash sizes from a source image with [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets) once you have one.

---

## Project Structure
```
app/
  (auth)/login          — Login + signup page
  (auth)/onboarding     — Goal selection onboarding
  (dashboard)/
    dashboard           — Overview + stats
    chat                — AI companion chat
    journal             — Journaling with AI reflection
    habits              — Daily habit tracker
    health              — Health metrics + charts
    community/          — Community rooms
      [roomId]          — Realtime room chat
  api/
    chat                — Groq streaming chat endpoint
    journal             — AI journal reflection endpoint
components/
  chat, mood, habits, journal, health, community, ui
lib/
  supabase/             — Browser + server clients
  ai/groq.ts            — Groq client + system prompts
  utils.ts              — Helper functions
supabase/
  migrations/001_initial.sql  — Full database schema
```

## Customization

### Change AI model
In `lib/ai/groq.ts`, change `MODEL`:
- `llama-3.1-8b-instant` — fastest, free
- `llama-3.1-70b-versatile` — smarter, still free
- `mixtral-8x7b-32768` — longer context

### Add crisis resources
Edit `buildSystemPrompt` in `lib/ai/groq.ts`

### Add more community rooms
Add to the seed SQL in `supabase/migrations/001_initial.sql`
