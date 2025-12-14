# Vercel Deployment Guide

## Quick Deploy (5 Minutes)

### Prerequisites
- GitHub account
- Vercel account (free tier works perfectly)
- Your code pushed to GitHub

### Step 1: Push Code to GitHub

If you haven't already, create a GitHub repository and push your code:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Apple Pass Scaler"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub
2. **Click "Add New Project"** (or "New Project" button)
3. **Import your GitHub repository**
   - Select the repository you just pushed
   - Vercel will auto-detect Next.js - no configuration needed!
4. **Configure Project Settings** (usually auto-detected):
   - Framework Preset: Next.js ✅
   - Root Directory: `./` ✅
   - Build Command: `npm run build` ✅
   - Output Directory: `.next` ✅
5. **Add Environment Variables**
   - Click "Environment Variables" section
   - Run `./scripts/export-env-vars.sh` to get the list
   - Copy each variable from the output and paste into Vercel
   - Make sure to add them for **Production**, **Preview**, and **Development**
6. **Click "Deploy"**
   - First deployment takes 2-3 minutes
   - You'll get a URL like: `apple-pass-scaler.vercel.app`

### Step 3: Verify Deployment

1. **Check the deployment**
   - Wait for build to complete (green checkmark)
   - Click on the deployment to see the live URL

2. **Test the endpoint**
   ```
   https://your-app.vercel.app/api/issue-pass-and-redirect?click_id=test&redirect_url=https://example.com
   ```

3. **Access the dashboard**
   ```
   https://your-app.vercel.app/dashboard
   ```

### Step 4: Configure Cron Jobs

Cron jobs are automatically configured via `vercel.json`. Vercel will:
- Automatically detect the cron configuration
- Run `/api/cron/sequences` once per day at 9 AM UTC (due to Hobby plan limitations)
- Use `VERCEL_CRON_SECRET` for authentication

**Note:** Vercel Hobby plan only allows daily cron jobs. The sequence automation runs once per day. If you need hourly execution, upgrade to Vercel Pro plan and change the schedule in `vercel.json` to `0 * * * *`.

**No additional setup needed!** ✅

## Environment Variables

All environment variables are listed in `scripts/export-env-vars.sh`. Run it to get the exact list:

```bash
./scripts/export-env-vars.sh
```

### Required Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_CRON_SECRET`
- `DIGITALOCEAN_SPACES_ENDPOINT`
- `DIGITALOCEAN_SPACES_KEY`
- `DIGITALOCEAN_SPACES_SECRET`
- `ENCRYPTION_SECRET`

## Post-Deployment Checklist

- [ ] Environment variables added to Vercel
- [ ] Deployment successful (green checkmark)
- [ ] Test pass generation endpoint works
- [ ] Dashboard accessible at `/dashboard`
- [ ] Apple Developer Account added via dashboard
- [ ] Test pass generation on iPhone
- [ ] Integration code copied to quiz funnel

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Fails
- Check environment variables are all set
- Verify `package.json` has all dependencies
- Check build logs in Vercel dashboard

### Pass Generation Fails
- Verify Apple Developer Account is added via dashboard
- Check that all certificates are correct
- Test locally first: `npm run dev`

### Cron Jobs Not Running
- Verify `VERCEL_CRON_SECRET` is set
- Check `vercel.json` is in root directory
- Wait 1 hour and check logs

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Test locally with `npm run dev`
3. Verify all environment variables are set
4. Check Supabase database connection

## Next Steps

After deployment:
1. Get your Vercel URL
2. Test pass generation
3. Copy integration code from `integration/` folder
4. Add to your quiz funnel
5. Test on iPhone!

