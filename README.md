# blart.ai — AI Art Gallery

A fully automated, beautiful AI art gallery that publishes stunning digital artworks daily. Users browse for free, download screen resolutions at no cost, and pay for print-ready files or physical framed prints.

## 🎨 Features (MVP)

- **Public gallery** with masonry grid layout
- **Free downloads** (1080p, no login required)
- **Style filters** (abstract, landscape, portrait, surrealism, minimalist)
- **Sorting** (newest, trending, revenue)
- **Responsive design** (mobile, tablet, desktop)
- **Dark aesthetic** inspired by cosmos.so
- Payment and print fulfillment (infrastructure ready)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (already installed)
- GitHub account
- Supabase account (free tier is fine)
- Stripe account (free to test)

### 1. Local Development
```bash
cd /home/node/.openclaw/workspace/blart.ai

# Install dependencies (already done)
npm install

# Create .env.local (copy from .env.local.example)
cp .env.local.example .env.local
# Edit .env.local with your actual credentials

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see your app.

### 2. Deploy to Production
See **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for step-by-step instructions on:
- Creating Supabase database
- Setting up Stripe payments
- Deploying to Vercel
- Configuring environment variables

## 📁 Project Structure

```
blart.ai/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   └── artworks/        # Artwork endpoints
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Gallery homepage
│   └── globals.css          # Global styles
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── stripe.ts           # Stripe helpers
│   └── types.ts            # TypeScript types
├── public/                  # Static assets
├── schema.sql              # Database schema (run in Supabase)
├── .env.local.example      # Environment template
├── SETUP_GUIDE.md          # Detailed setup instructions
└── package.json            # Dependencies
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS + custom design tokens |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/Google OAuth) |
| File Storage | Supabase Storage |
| Payments | Stripe |
| Hosting | Vercel |

## 📊 Database Schema

### Tables
- `profiles` — User accounts and roles
- `artworks` — Generated and published artworks
- `purchases` — Digital and physical orders
- `downloads` — Free download tracking
- `generations` — Generation pipeline logs

See `schema.sql` for full details.

## 🔌 API Endpoints (MVP)

### Public
- `GET /api/artworks` — List published artworks (paginated, filterable)

### Admin (coming soon)
- `POST /api/admin/artworks/[id]/publish` — Publish artwork
- `POST /api/admin/artworks/[id]/reject` — Reject artwork
- More in phases 2+

## 🎯 Feature Roadmap

### Phase 1 (Now)
- [x] Gallery homepage
- [x] Masonry grid + filters
- [ ] Lightbox modal
- [ ] Free 1080p download (no auth)
- [ ] Rate limiting
- [ ] User auth (Supabase)
- [ ] Stripe checkout
- [ ] Admin staging area
- [ ] Daily generation pipeline (mocked)

### Phase 2 (Weeks 2-3)
- [ ] Prodigi integration (physical prints)
- [ ] Print configuration UI
- [ ] 4K/8K upscaling
- [ ] Instagram auto-posting
- [ ] User account dashboard
- [ ] Email transactionals (Resend)
- [ ] Admin analytics

### Phase 3+ (Month 2+)
- [ ] 8K tier ($10)
- [ ] Favourites / collections
- [ ] Art newsletter
- [ ] Subscription model
- [ ] Custom art generation
- [ ] AR preview

## 🔐 Security

- **Row-Level Security (RLS)** on Supabase tables
- **Signed URLs** for paid downloads (24h expiry, 3 uses max)
- **Admin auth** via role-based access control
- **Stripe webhook verification**
- **Rate limiting** on free downloads (20/day per IP)
- **No public service keys** — all sensitive operations on backend

See `schema.sql` for RLS policies.

## 📝 Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
PRODIGI_API_KEY=... (optional)
INSTAGRAM_ACCESS_TOKEN=... (optional)
REPLICATE_API_TOKEN=... (optional)
NEXT_PUBLIC_APP_URL=...
NEXT_PUBLIC_APP_NAME=blart.ai
CRON_SECRET=...
RESEND_API_KEY=... (optional)
```

**Never commit `.env.local` to git.**

## 🚦 Development

### Running Locally
```bash
npm run dev
```
Visit `http://localhost:3000`

### Building for Production
```bash
npm run build
npm run start
```

### Linting
```bash
npm run lint
```

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** — Step-by-step setup (non-technical friendly)
- **[schema.sql](./schema.sql)** — Full database schema
- **.env.local.example** — All environment variables explained

## 🤝 Support

Questions? Stuck on setup? Message Tim or check the troubleshooting section in SETUP_GUIDE.md.

## 📄 License

TBD

---

Built with ❤️ for beautiful, accessible digital art.
