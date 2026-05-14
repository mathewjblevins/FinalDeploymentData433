# CineMatch: Cost Model

## Current Cost: $0/month

All services are on free tiers for the current demo traffic level.

| Service | Free tier | Usage at demo scale |
|---|---|---|
| **Vercel Hobby** | 100 GB bandwidth/mo, unlimited deploys | <<1 GB |
| **Render free web service** | 750 hrs/mo (one always-on service), 512 MB RAM | ~730 hrs |
| **Supabase free** | 500 MB database, 50k MAU, 5 GB storage | <<10 MB, <<10 MAU |
| **Upstash Redis free** | 10,000 commands/day, 256 MB | <<1k commands/day |
| **TMDB API** | Free for non-commercial use with attribution | Well within limits |

**Monthly total: $0.00**

---

## Breakeven Economics

### At 5,000 DAU (daily active users)

| Service | Upgrade needed | Cost |
|---|---|---|
| Vercel Pro | ~5 TB bandwidth | $20/mo |
| Render Starter | 1 GB RAM, no spin-down | $7/mo |
| Supabase Pro | 8 GB DB, 100k MAU | $25/mo |
| Upstash Pay-as-you-go | ~500k commands/day | ~$3/mo |
| **Total** | | **~$55/mo** |

### Unit economics

At 5k DAU with a $55/mo infrastructure cost:
- **$0.011 per user per month** (fraction of a cent)
- If monetized via a $4.99/mo subscription: breakeven at **12 paying subscribers** out of 5,000 MAU (0.24% conversion rate)

### Path to $0 → sustainable

| Milestone | Revenue model |
|---|---|
| 0–5k MAU | Free; demo and course project |
| 5k–50k MAU | $4.99/mo Pro (ad-free, unlimited favorites, history) |
| 50k+ MAU | Enterprise API licensing for streaming services |

---

## Free Tier Caveats (slide-ready disclosures)

1. **Render cold start:** Free web services spin down after 15 min of inactivity. The first request after idle takes ~10s. A Vercel cron that pings `/health` every 14 min keeps the service warm during demos.
2. **Supabase 50k MAU cap:** At scale, would upgrade to Pro ($25/mo) or move to self-hosted.
3. **TMDB rate limits:** 40 requests/10s on the free tier. Our TTLCache (1h) eliminates ~80% of repeat calls.
