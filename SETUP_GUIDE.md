# blart.ai Setup Guide

This guide will walk you through setting up **blart.ai** step-by-step. Don't worry if this looks long — I've broken it into sections. We'll do external setup (creating accounts), then come back to deploy the app.

## Table of Contents
1. [What You Need (Pre-requisites)](#what-you-need)
2. [Set Up Supabase (Database)](#set-up-supabase)
3. [Set Up Stripe (Payments)](#set-up-stripe)
4. [Deploy to Vercel](#deploy-to-vercel)
5. [Configure Environment Variables](#configure-environment-variables)
6. [Test the App](#test-the-app)

---

## What You Need

Before we start, make sure you have:
- A **GitHub account** (free, [create one here](https://github.com/signup))
- An **email address** for sign-ups
- 10 minutes per service to create accounts

**Optional (for full features):**
- Stripe account (for payments)
- Instagram Business account (for auto-posting)
- Replicate account (for image generation — MVPs can mock this)

---

## Set Up Supabase (Database)

Supabase is where we store all your artwork data, user profiles, and purchase history.

### Step 1: Create a Supabase Account
1. Go to **https://supabase.com**
2. Click **"Start your project"** (top right)
3. Click **"Sign up with GitHub"** and authorize Supabase
4. You'll be taken to the dashboard

### Step 2: Create a New Project
1. Click **"New Project"** (big button in the middle)
2. Choose a **name**: `blart-ai` (or whatever you like)
3. Choose a **region**: Pick the one closest to you or your audience (e.g., `us-east-1` for US, `ap-southeast-1` for Australia)
4. Set a **database password** — write this down somewhere safe (you won't need it often, but it's good to have)
5. Click **"Create new project"**

Supabase will spend ~1-2 minutes setting up. You'll see a loading screen. Grab a coffee ☕

### Step 3: Create the Database Schema
Once your project is ready:

1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"** (button near top)
3. Delete any default text and **copy-paste the entire contents** of `schema.sql` from the project folder into this editor
4. Click the blue **"Run"** button
5. You should see a success message

This creates all the tables and security rules for your app.

### Step 4: Get Your Credentials
You need two things from Supabase:

1. Click **"Settings"** (bottom of left sidebar)
2. Click **"API"** in the left menu
3. You'll see:
   - **Project URL** — copy this (looks like `https://xxxxx.supabase.co`)
   - **Anon key** — copy this (long string starting with `eyJ...`)
   - **Service Role Key** — copy this (long string, **keep this SECRET**)

Save these somewhere safe (we'll use them in Step 5).

---

## Set Up Stripe (Payments)

Stripe handles all the payment processing for digital and physical orders.

### Step 1: Create a Stripe Account
1. Go to **https://stripe.com**
2. Click **"Sign in"** (top right) → **"Create account"**
3. Enter your email and create a password
4. Verify your email
5. Fill in your business details (you can use "Solo" or your personal name for now)

### Step 2: Activate Test Mode
By default, Stripe starts in **Test Mode**. This is perfect for development — you can test payments without spending real money.

1. In your Stripe dashboard, look for the toggle in the top bar: **"View test data"**
2. Make sure it's **ON** (you should see "Test mode" somewhere)

### Step 3: Get Your API Keys
1. Click **"Developers"** (left sidebar, bottom)
2. Click **"API Keys"**
3. You'll see two keys under "Secret key" (in test mode):
   - **Secret key** — copy this (starts with `sk_test_...`)
   - **Publishable key** — copy this (starts with `pk_test_...`)

Save both of these.

### Step 4: Create a Webhook Endpoint (for Production Later)
For now, you can skip this. We'll set it up when you deploy to production.

---

## Deploy to Vercel

Vercel is the easiest way to deploy Next.js apps. It integrates with GitHub and auto-deploys when you push code.

### Step 1: Push Your Code to GitHub
1. Go to **https://github.com/new** to create a new repository
2. Name it `blart-ai`
3. **Do NOT initialize with README** (leave all checkboxes unchecked)
4. Click **"Create repository"**
5. You'll see a page with instructions. Follow the "…or push an existing repository from the command line" section.

**Here's the exact command** (copy-paste this into your terminal):

```bash
cd /home/node/.openclaw/workspace/blart.ai
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/blart-ai.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 2: Deploy to Vercel
1. Go to **https://vercel.com**
2. Click **"Sign up"** or **"Log in"** (sign in with GitHub is easiest)
3. Authorize Vercel to access your GitHub account
4. Click **"Import Project"** on the dashboard
5. Select your `blart-ai` repository from the list
6. Click **"Import"**

Vercel will ask about environment variables. **Skip this for now** — we'll add them in the next step.

7. Click **"Deploy"**

Vercel will build and deploy your app. This takes ~2 minutes. You'll see a progress indicator.

Once done, you'll get a URL like `https://blart-ai.vercel.app` — **this is your live app!** 🎉

---

## Configure Environment Variables

Now we need to tell your app where to find Supabase, Stripe, and other services.

### Step 1: Create .env.local File
1. In your project folder, create a new file called `.env.local` (note the dot at the start)
2. Copy the contents of `.env.local.example` (it's in the project folder)
3. Fill in each variable with the credentials you saved earlier:

```
# From Supabase (Step 4 above)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# From Stripe (Step 3 above, use test keys for now)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (leave blank for now)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Leave these blank for MVP
PRODIGI_API_KEY=
PRODIGI_WEBHOOK_SECRET=
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_BUSINESS_ACCOUNT_ID=
REPLICATE_API_TOKEN=

# App Config
NEXT_PUBLIC_APP_URL=https://blart-ai.vercel.app (or your custom domain)
NEXT_PUBLIC_APP_NAME=blart.ai
CRON_SECRET=generate-a-random-string-here
RESEND_API_KEY=
```

### Step 2: Add to Vercel
1. Go to your Vercel project dashboard
2. Click **"Settings"** (top navigation)
3. Click **"Environment Variables"** (left sidebar)
4. For each variable above:
   - Paste the name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Paste the value
   - Click **"Add"**
5. Once all are added, click **"Redeploy"** to apply them

---

## Test the App

### Step 1: Load Your App
1. Go to `https://blart-ai.vercel.app` (or your Vercel URL)
2. You should see the gallery homepage (dark theme, "blart.ai" header)
3. The gallery should be empty (no artworks yet — that's normal)

### Step 2: Test the Gallery Filter
1. Click on a style filter (e.g., "abstract")
2. You should see loading, then no results (expected)
3. Click "All" to clear the filter

**If you see an error:** Check the browser console (right-click → Inspect → Console tab). Let me know what it says.

### Step 3: Add a Test Artwork (Optional)
To see the gallery working, you can manually add a test artwork to Supabase:

1. Go to your Supabase dashboard
2. Click **"Table Editor"** (left sidebar)
3. Click the `artworks` table
4. Click **"Insert Row"** (or the `+` button)
5. Fill in:
   - `title`: "Test Artwork"
   - `slug`: "test-artwork"
   - `style`: "abstract"
   - `status`: "published"
   - `image_thumbnail_url`: (leave blank for now)
   - Everything else: use defaults
6. Click **"Save"**

Refresh your gallery page — the artwork should appear!

---

## Next Steps

Once you've completed this setup:

1. **Image Generation**: Set up Replicate API for AI art generation
2. **Admin Panel**: Build the `/admin` pages so you can manage artworks
3. **Free Download**: Implement the free 1080p download flow
4. **Payments**: Test Stripe checkout with a real transaction
5. **Instagram**: Set up Instagram Business account for auto-posting

Let me know when you've deployed and we can move to the next phase!

---

## Troubleshooting

### "CORS error" or "Cannot fetch artworks"
- **Check:** Is your Supabase URL correct in the environment variables?
- **Fix:** Go back to Supabase → Settings → API, copy the URL again, and update Vercel environment variables

### "Database connection error"
- **Check:** Did you run the `schema.sql` file in Supabase?
- **Fix:** Go to SQL Editor, paste the schema again, and run it

### "Stripe error"
- **Check:** Are you using **test keys** (sk_test_, pk_test_)?
- **Fix:** Don't use production keys until you're ready to launch

### "Page is blank"
- **Check:** Open browser console (Inspect → Console)
- **Share:** Tell me what error you see

---

Good luck! You're building something cool. 🚀
