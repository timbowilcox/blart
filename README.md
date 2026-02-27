# Blart.ai — AI Generated Art Store

Minimal AI art gallery with free 4K downloads and museum-quality framed prints. Built with Next.js, Supabase, Stripe, and Prodigi.

## Architecture

```
Next.js 14 (Vercel)     →  Frontend + API routes
Supabase (PostgreSQL)   →  Database + Image storage
Stripe                  →  Payment processing
Prodigi                 →  Print fulfillment + shipping
Anthropic API           →  AI image generation
```

## Features

- **Gallery** — Masonry grid with style filtering, staggered animations
- **Free 4K Downloads** — Every artwork downloadable at full resolution
- **Framed Prints** — 5 sizes, 8 frame colours, giclée archival printing
- **Checkout** — Stripe Checkout with global shipping
- **Auto-fulfillment** — Stripe webhook → Prodigi order submission
- **Art Generation Engine** — Single + batch generation with style-aware prompting
- **Daily Auto-generation** — Vercel cron generates 10 new pieces daily
- **Admin Panel** — Review, publish, feature, and archive artworks
- **Agentic Compatibility** — Public API, llms.txt, Schema.org JSON-LD
- **Superuser Dashboard** — `/admin` for generation and curation

## Quick Start

### 1. Clone and Install

```bash
git clone <repo>
cd blart-ai
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migration:

```bash
# In Supabase SQL Editor, paste contents of:
supabase/schema.sql
```

3. Create a Storage bucket:
   - Go to Storage → New Bucket
   - Name: `artworks`
   - Public: **Yes**
   - File size limit: 50MB

4. Copy your project credentials from Settings → API

### 3. Set Up Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Copy your API keys from Developers → API Keys
3. Set up webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`
4. Copy the webhook signing secret

### 4. Set Up Prodigi

1. Sign up at [prodigi.com](https://www.prodigi.com)
2. Get your API key from the dashboard
3. Start with `sandbox` environment for testing

### 5. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Prodigi
PRODIGI_API_KEY=your-key
PRODIGI_ENVIRONMENT=sandbox

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_SECRET=choose-a-strong-secret

# AI Generation
ANTHROPIC_API_KEY=sk-ant-...

# Vercel Cron (auto-set by Vercel)
CRON_SECRET=auto-generated
```

### 6. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

## Deployment (Vercel)

```bash
npm i -g vercel
vercel
```

1. Connect your GitHub repo
2. Add all environment variables in Vercel dashboard
3. Set `NEXT_PUBLIC_APP_URL` to your production URL
4. Switch `PRODIGI_ENVIRONMENT` to `live` when ready
5. Update Stripe webhook URL to production domain

## Admin Panel

Visit `/admin` and enter your `ADMIN_SECRET`.

### Generating Art

1. Go to the **Generate** tab
2. Select a style (or leave empty to rotate all styles)
3. Choose orientation (or random)
4. Click **Generate** for single, or switch to **Batch** mode
5. Generated artworks appear in the **Review** tab
6. Publish, archive, or feature from there

### Batch Generation (First 200 artworks)

Use the API directly for large batches:

```bash
curl -X POST https://blart.ai/api/admin/generate \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"mode": "batch", "count": 50}'
```

Run this 4 times to generate 200 artworks. Then review and publish from the admin panel.

### Daily Auto-generation

The Vercel cron job at `/api/cron/generate` runs daily at 6:00 AM UTC, generating 10 new artworks in "review" status. Configure the schedule in `vercel.json`.

## API Reference

### Public Gallery API

```
GET /api/gallery
```

| Param     | Description                        |
|-----------|------------------------------------|
| style     | Filter by style slug               |
| tag       | Filter by tag                      |
| featured  | "true" for featured only           |
| limit     | Results per page (max 100)         |
| offset    | Pagination offset                  |
| sort      | "newest", "popular", "most_downloaded" |

### Admin API

All admin endpoints require `Authorization: Bearer {ADMIN_SECRET}`.

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /api/admin/artworks   | List artworks by status  |
| POST   | /api/admin/artworks   | Create artwork manually  |
| PATCH  | /api/admin/artworks   | Update artwork           |
| GET    | /api/admin/generate   | List available styles    |
| POST   | /api/admin/generate   | Generate artwork(s)      |

### Webhooks

| Endpoint               | Source | Purpose                        |
|------------------------|--------|--------------------------------|
| /api/webhooks/stripe   | Stripe | Process payments, submit prints|

## Pricing

| Size    | Prodigi Cost | Retail (50% markup) | + Shipping |
|---------|-------------|---------------------|------------|
| 8×10"   | ~$35 AUD    | $52.50              | + $15      |
| 12×16"  | ~$45 AUD    | $67.50              | + $15      |
| 16×20"  | ~$60 AUD    | $90.00              | + $15      |
| 20×28"  | ~$85 AUD    | $127.50             | + $15      |
| 24×36"  | ~$120 AUD   | $180.00             | + $15      |

## Project Structure

```
blart-ai/
├── public/
│   └── llms.txt              # AI agent site guide
├── supabase/
│   └── schema.sql            # Database migration
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout + JSON-LD
│   │   ├── page.tsx          # Homepage
│   │   ├── globals.css       # Design system
│   │   ├── gallery/          # Gallery page
│   │   ├── artwork/[slug]/   # Artwork detail
│   │   ├── about/            # About page
│   │   ├── order/success/    # Order confirmation
│   │   ├── admin/            # Admin dashboard
│   │   └── api/
│   │       ├── gallery/      # Public gallery API
│   │       ├── checkout/     # Stripe session creation
│   │       ├── track/        # Analytics tracking
│   │       ├── admin/        # Admin CRUD + generation
│   │       ├── cron/         # Daily auto-generation
│   │       └── webhooks/     # Stripe webhooks
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ArtworkGrid.tsx
│   │   └── ArtworkActions.tsx
│   └── lib/
│       ├── supabase.ts       # Database clients + types
│       ├── stripe.ts         # Payment helpers
│       ├── prodigi.ts        # Print fulfillment
│       └── generate.ts       # AI art generation engine
├── vercel.json               # Cron configuration
├── package.json
└── tailwind.config.js
```

## Agentic Compatibility

Blart is optimised for discovery by AI agents:

1. **`/llms.txt`** — Machine-readable site guide with API docs
2. **`/api/gallery`** — JSON API with CORS, filtering, pagination
3. **JSON-LD** — Schema.org structured data on every page
4. **Schema.org** — Store, VisualArtwork, and Offer markup

## Tech Stack

- **Next.js 14** — App Router, Server Components, API Routes
- **Tailwind CSS** — Custom design system with Cormorant Garamond + DM Sans
- **Supabase** — PostgreSQL + Row Level Security + Storage
- **Stripe** — Checkout Sessions + Webhooks
- **Prodigi** — Print-on-demand fulfillment
- **Anthropic** — AI image generation
- **Vercel** — Hosting + Edge Network + Cron Jobs

## License

All generated artworks are free to download. Print sales are the revenue model.
