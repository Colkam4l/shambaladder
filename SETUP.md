# SETUP.md — ShambaLadder Setup Guide
# Kenya AI Challenge 2025 · AgriFin Track

> Complete this guide **before** running any sprint. Every external service must be live and credentials in `.env.local` before you write a line of application code.

---

## Prerequisites

- Node.js 18+ and npm
- Git
- A Vercel account connected to the `shambaladder` GitHub repo
- A Neo4j Aura Free account
- A Featherless account with an API key

---

## Step 1 — Clone and install

```bash
git clone https://github.com/Colkam4l/shambaladder.git
cd shambaladder
npm install
```

---

## Step 2 — Copy the environment template

```bash
cp .env.local.example .env.local
```

Open `.env.local` in your editor. You will fill in each section below.

---

## Step 3 — Neo4j Aura credentials

1. Go to [https://console.neo4j.io](https://console.neo4j.io) and sign in.
2. Open your free Aura instance (or create one if you haven't yet — choose **AuraDB Free**).
3. Click **Connect** → download the credentials file, or copy the values directly.
4. Fill in `.env.local`:

```env
NEO4J_URI=neo4j+s://XXXXXXXX.databases.neo4j.io   # from the Aura console
NEO4J_USERNAME=neo4j                               # always "neo4j" for Aura Free
NEO4J_PASSWORD=your-aura-password                  # from the credentials file
```

> **Important:** The URI must use the `neo4j+s://` scheme (TLS). Plain `neo4j://` will not connect to Aura.

---

## Step 4 — Featherless API key

1. Go to [https://featherless.ai](https://featherless.ai) and sign in.
2. Navigate to **API Keys** and create a new key.
3. Fill in `.env.local`:

```env
FEATHERLESS_API_KEY=your-featherless-api-key
FEATHERLESS_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

> The model `mistralai/Mistral-7B-Instruct-v0.2` is the default. If output quality is insufficient, switch to `meta-llama/Meta-Llama-3-8B-Instruct` — same variable, different value.

---

## Step 5 — App URL

For local development:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

After deploying to Vercel, update this to your production URL (e.g. `https://shambaladder.vercel.app`).

---

## Step 6 — Verify your `.env.local`

Your completed `.env.local` should look like this (with real values):

```env
NEO4J_URI=neo4j+s://abc12345.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=SuperSecretPassword123

FEATHERLESS_API_KEY=fl-xxxxxxxxxxxxxxxxxxxxxxxx
FEATHERLESS_MODEL=mistralai/Mistral-7B-Instruct-v0.2

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 7 — Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). The scaffold will be live.

> **Note:** No UI exists yet at this point — Sprint 1 builds the Next.js scaffold. Running `npm run dev` at this stage confirms Node/npm and env vars are wired correctly.

---

## Step 8 — Seed Neo4j (run after Sprint 2 is built)

Once the Neo4j client and seed script exist (`scripts/seed-neo4j.ts`), populate the graph:

```bash
npx tsx scripts/seed-neo4j.ts
```

This seeds **50 synthetic farmers** into the Kisii Cooperative on Neo4j Aura.

**Verify the seed worked** by opening the Neo4j Browser at [https://console.neo4j.io](https://console.neo4j.io) → **Open** → run:

```cypher
MATCH (f:Farmer) RETURN count(f)
```

Expected result: `50`

---

## Step 9 — Deploy to Vercel

### Add environment variables to Vercel

You must add the same variables from `.env.local` to your Vercel project.

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard) → your `shambaladder` project.
2. Click **Settings** → **Environment Variables**.
3. Add each variable one by one:

| Variable | Environment |
|---|---|
| `NEO4J_URI` | Production, Preview, Development |
| `NEO4J_USERNAME` | Production, Preview, Development |
| `NEO4J_PASSWORD` | Production, Preview, Development |
| `FEATHERLESS_API_KEY` | Production, Preview, Development |
| `FEATHERLESS_MODEL` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | Production (set to your live URL) |

> **Never paste API keys into Vercel's "Development" environment if you use `vercel dev` — use `.env.local` locally instead.**

### Deploy

```bash
git add .
git commit -m "Initial project scaffold"
git push origin main
```

Vercel will auto-deploy on push. Check the deployment log in the Vercel dashboard.

---

## External APIs — No Setup Required

These two APIs require no credentials and are free at prototype volume:

| API | Used for | Docs |
|---|---|---|
| **Open-Meteo** | Rainfall, drought index for GPS coordinates | https://open-meteo.com |
| **SoilGrids** | Soil quality for GPS coordinates | https://soilgrids.org |

Both are called directly from Next.js API routes. No API key, no auth, no rate-limit registration needed for hackathon volume.

---

## Environment Variables — Quick Reference

| Variable | Required | Notes |
|---|---|---|
| `NEO4J_URI` | ✅ Yes | `neo4j+s://` scheme required |
| `NEO4J_USERNAME` | ✅ Yes | Always `neo4j` for Aura Free |
| `NEO4J_PASSWORD` | ✅ Yes | From Aura credentials file |
| `FEATHERLESS_API_KEY` | ✅ Yes | From featherless.ai dashboard |
| `FEATHERLESS_MODEL` | ✅ Yes | Default: `mistralai/Mistral-7B-Instruct-v0.2` |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | `http://localhost:3000` locally |

> All API keys are server-only (no `NEXT_PUBLIC_` prefix). They are never exposed to the browser.

---

## Troubleshooting

**Neo4j connection refused**
- Check the URI uses `neo4j+s://` not `neo4j://`
- Confirm the Aura instance status is **Running** in the console
- Verify the password matches the downloaded credentials file exactly

**Featherless 401 Unauthorized**
- Double-check the API key has no leading/trailing whitespace in `.env.local`
- Confirm the key is active in the Featherless dashboard

**`NEXT_PUBLIC_APP_URL` not working for share links**
- In production this must be the full Vercel URL with no trailing slash
- Example: `https://shambaladder.vercel.app` ✅ not `https://shambaladder.vercel.app/` ❌

---

*ShambaLadder · Kenya AI Challenge 2025 · AgriFin Track*
