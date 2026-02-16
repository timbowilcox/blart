# blart.ai Launch Checklist

## Pre-Launch Setup (Do These First)

### 1. Supabase Setup ⬜
- [ ] Go to https://supabase.com and sign up
- [ ] Create a new project (region: closest to you)
- [ ] Save database password somewhere safe
- [ ] Wait for project to load (~1-2 min)
- [ ] Go to SQL Editor → New Query
- [ ] Copy entire contents of `schema.sql` and paste into editor
- [ ] Click "Run"
- [ ] Verify success message appears
- [ ] Go to Settings → API
- [ ] Copy **Project URL** and save to a text file
- [ ] Copy **Anon Key** and save
- [ ] Copy **Service Role Key** and save (KEEP SECRET!)

### 2. Stripe Setup ⬜
- [ ] Go to https://stripe.com and sign up
- [ ] Go to Developers → API Keys
- [ ] Check that you're in "Test mode" (see toggle at top)
- [ ] Copy **Secret key** (sk_test_...) and save
- [ ] Copy **Publishable key** (pk_test_...) and save
- [ ] Note: Don't use live keys until you're ready to launch

### 3. GitHub Setup ⬜
- [ ] Go to https://github.com/new
- [ ] Name: `blart-ai`
- [ ] Don't initialize with README
- [ ] Click "Create repository"
- [ ] Run these commands in your terminal:
```bash
cd /home/node/.openclaw/workspace/blart.ai
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/blart-ai.git
git push -u origin main
```
- [ ] Verify your code appears on GitHub (check repo)

### 4. Vercel Deployment ⬜
- [ ] Go to https://vercel.com
- [ ] Sign up with GitHub (authorize when prompted)
- [ ] Click "Import Project"
- [ ] Select `blart-ai` repo from list
- [ ] Click "Import"
- [ ] **Skip environment variables for now** (you'll add them in next step)
- [ ] Click "Deploy"
- [ ] Wait for deployment to finish (~2 min)
- [ ] You'll get a URL like `https://blart-ai.vercel.app` 🎉
- [ ] Copy this URL and save it

### 5. Add Environment Variables ⬜
- [ ] Go to your Vercel project → Settings → Environment Variables
- [ ] Add each of these (copy values from Step 1 + 2):

| Name | Value |
|------|-------|
| NEXT_PUBLIC_SUPABASE_URL | From Supabase (Project URL) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | From Supabase (Anon Key) |
| SUPABASE_SERVICE_ROLE_KEY | From Supabase (Service Role Key) |
| STRIPE_SECRET_KEY | From Stripe (Secret key sk_test_...) |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | From Stripe (Publishable key pk_test_...) |
| STRIPE_WEBHOOK_SECRET | Leave blank for now |
| NEXT_PUBLIC_APP_URL | Your Vercel URL (e.g., https://blart-ai.vercel.app) |
| NEXT_PUBLIC_APP_NAME | blart.ai |
| CRON_SECRET | Generate random string (e.g., 12345abcdef) |

- [ ] Click "Save" after each one (or add all then save)
- [ ] Click "Redeploy" button to apply changes

### 6. Test the App ⬜
- [ ] Go to your Vercel URL
- [ ] You should see: dark theme, "blart.ai" header, gallery grid (empty)
- [ ] Click on style filters (abstract, landscape, etc.)
- [ ] Select sort dropdown and try options
- [ ] You should see loading, then "No artworks found" (normal for MVP)

### 7. Add Sample Artwork (Optional) ⬜
To see the gallery working:
- [ ] Go to Supabase dashboard
- [ ] Click "Table Editor" (left sidebar)
- [ ] Click `artworks` table
- [ ] Click "Insert Row" button
- [ ] Fill in:
  - title: "Cosmic Abstract"
  - slug: "cosmic-abstract" 
  - style: "abstract"
  - status: "published"
  - image_thumbnail_url: leave blank
- [ ] Click "Save"
- [ ] Go back to your app and refresh
- [ ] You should see your artwork in the gallery!

---

## Phase 1 Features (Next Week)

Once the above is done, Tim will build:
- [ ] Lightbox modal (click artwork to view full size)
- [ ] Free 1080p download button
- [ ] User sign-up / login page
- [ ] Stripe checkout for 4K purchases
- [ ] Admin page to review and publish artworks
- [ ] Daily generation pipeline

**Chat with Tim when you reach this point.**

---

## Troubleshooting

### "Page is blank or shows error"
- [ ] Check browser console (Ctrl+Shift+K or Cmd+Option+K)
- [ ] Paste error message
- [ ] Check that all env vars are filled in Vercel

### "API returns empty results"
- [ ] Did you run schema.sql in Supabase?
- [ ] Did you add the environment variables?
- [ ] Did you click "Redeploy" in Vercel?
- [ ] Check Supabase → Table Editor → artworks (should have 1+ rows)

### "Stripe errors"
- [ ] Are you using **test keys** (sk_test_, pk_test_)?
- [ ] Don't use production keys yet

### "Can't push to GitHub"
- [ ] Make sure USERNAME is correct in git command
- [ ] Make sure you authorized Vercel with GitHub

---

## You Did It! 🎉

If everything above is checked, you have:
- ✅ Live gallery at blart.ai.vercel.app
- ✅ Database ready (Supabase)
- ✅ Payment infrastructure ready (Stripe)
- ✅ Auto-deployment pipeline (GitHub → Vercel)

Next: Chat with Tim to start Phase 1!
