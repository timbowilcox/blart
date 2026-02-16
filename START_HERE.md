# START HERE 👈

Welcome to **blart.ai**! I've built the foundation. Now you'll set up the external services (database, payments, hosting).

## What I Built For You ✅

- Complete Next.js project with all dependencies installed
- Beautiful dark gallery homepage (cosmos.so inspired)
- Database schema with all tables and security rules
- API endpoints for fetching artworks
- Setup guides and checklists

## What You Need to Do Next

**Total time: 1-2 hours** (most of this is waiting for services to set up)

### Read First: CHECKLIST.md
Open **[CHECKLIST.md](./CHECKLIST.md)** — this is your step-by-step guide. Check off each box as you complete it.

### The 6 Steps (in order)
1. **Supabase** (database) — 15 min
2. **Stripe** (payments) — 10 min
3. **GitHub** (code hosting) — 10 min
4. **Vercel** (hosting your app) — 30 min
5. **Environment Variables** (tell app where services are) — 10 min
6. **Test** (verify everything works) — 10 min

### Detailed Help
If you get stuck, these files have more detail:
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** — Longer, more detailed version with screenshots and explanations
- **[README.md](./README.md)** — Technical overview and project structure

---

## The Path Forward

### Today (External Setup)
- [ ] Follow CHECKLIST.md from top to bottom
- [ ] Get your app live at vercel.app URL
- [ ] Test that the gallery loads

### Tomorrow (Phase 1 MVP)
Once you've completed the setup above, message me and we'll build:
- Lightbox modal (click artwork to view full size)
- Free 1080p downloads (no login needed)
- Sign up / login page
- Stripe checkout ($5 for 4K)
- Admin panel (review & publish)
- Daily art generation

---

## Important Reminders

### 📌 Use Test API Keys
When you get Stripe keys, use the **test keys** (starts with `sk_test_` and `pk_test_`).
Don't use production keys until you're ready to launch for real.

### 📌 Keep Secrets Secret
- Never commit `.env.local` to GitHub
- Never share your Supabase `SUPABASE_SERVICE_ROLE_KEY`
- Stripe webhooks will be added later (for now, skip)

### 📌 No Login Required for Free Download
The whole point of blart.ai is that anyone can download 1080p for free, instantly, no signup.
This is important for user experience.

---

## Questions While Following CHECKLIST.md?

If you get stuck:
1. Check the **Troubleshooting** section at the end of CHECKLIST.md
2. Check **SETUP_GUIDE.md** for more detail on that step
3. Paste any error messages you see

---

## You've Got This! 🚀

You're building something cool. The hard part (code) is done. Now it's just wiring up the pieces.

Start with **CHECKLIST.md** and check off the boxes as you go.

Message me when you're done! ✨
