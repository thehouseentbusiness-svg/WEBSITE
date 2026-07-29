# T.H.E. Mix Comparator — Deploy Guide

## What this is
A React + Vite site with the A/B mix comparator lead-gen tool.
Currently uses a synthesized demo loop (Tone.js) — swap in real audio when ready (see "Swapping in real audio" below).

## Deploy to Vercel (recommended path)

### Option A — GitHub + Vercel dashboard (recommended, no terminal needed after this)
1. Create a new GitHub repo (e.g. `the-mix-comparator`)
2. Push this folder to it:
   ```
   git init
   git add .
   git commit -m "initial comparator"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/the-mix-comparator.git
   git push -u origin main
   ```
3. Go to vercel.com → New Project → Import the GitHub repo
4. Vercel auto-detects Vite. Leave build settings default. Click Deploy.
5. You'll get a live `*.vercel.app` URL within ~1 minute.

### Option B — Vercel CLI (faster if you're comfortable in terminal)
```
npm i -g vercel
cd mix-comparator-site
vercel
```
Follow the prompts. It deploys directly without needing GitHub.

## Connecting the subdomain (compare.thehouseentertainmentrecords.com)
1. In the Vercel project dashboard → Settings → Domains → add `compare.thehouseentertainmentrecords.com`
2. Vercel will show a CNAME target (something like `cname.vercel-dns.com`)
3. In Dynadot → DNS settings for thehouseentertainmentrecords.com → add:
   - Type: CNAME
   - Host: `compare`
   - Value: (exactly what Vercel gave you)
4. Wait for the domain in Vercel's dashboard to show a green "Valid Configuration" — SSL is automatic once it does.

## Swapping in real audio (when ready)
Right now `src/App.jsx` generates both versions synthetically via Tone.js (see `buildAudio()`).
To use real level-matched clips instead:
1. Drop two audio files (raw + mixed version of the same clip) into `public/audio/`
2. Replace the Tone.js synth chain in `buildAudio()` with two `Tone.Player` instances pointed at those files, routed the same way (raw → harsh/thin chain, mixed → eq/comp/reverb chain — or skip the chains entirely since real audio won't need synthetic processing)
3. Keep the same play/pause/meter logic — it doesn't care what's generating the sound

## Wiring the email gate to your real funnel
Right now emails save to `window.storage` (artifact-only, for testing in Claude).
For production, replace the `handleSubmitEmail` function's storage call with a `fetch()` POST to your Google Apps Script Web App URL (which writes to the Sheet that Zapier watches).

## CTA link
The "Get your track evaluated" button in the unlocked breakdown is currently inert (`href="#"`).
Point it at your EngineEars booking page before going live.
