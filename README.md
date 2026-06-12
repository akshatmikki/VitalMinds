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
