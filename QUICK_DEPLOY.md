# Quick Deploy Checklist

## ✅ Pre-Deployment Checklist

- [x] Code is ready
- [x] Environment variables documented
- [x] Integration code created
- [x] Build passes (`npm run build`)

## 🚀 Deployment Steps (5 Minutes)

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **"Add New Project"**
3. Select your repository
4. Click **"Environment Variables"** → Add all variables from `scripts/export-env-vars.sh`
5. Click **"Deploy"**

### 3. Get Your URL
After deployment, you'll get a URL like:
```
https://apple-pass-scaler.vercel.app
```

### 4. Test It
```
https://your-url.vercel.app/api/issue-pass-and-redirect?click_id=test&redirect_url=https://example.com
```

## 📋 Integration Checklist

- [ ] Copy integration code from `integration/funnel-button.html`
- [ ] Replace `YOUR_VERCEL_URL` with your Vercel URL
- [ ] Set your next quiz step URL
- [ ] Test on iPhone
- [ ] Verify redirect works

## 📁 Files Created

- ✅ `DEPLOYMENT.md` - Complete deployment guide
- ✅ `scripts/export-env-vars.sh` - Environment variables list
- ✅ `integration/funnel-button.html` - HTML button code
- ✅ `integration/funnel-button.js` - JavaScript module
- ✅ `integration/README.md` - Integration guide
- ✅ `integration/example.html` - Working example

## 🎯 Next Steps

1. Deploy to Vercel (5 min)
2. Test pass generation
3. Copy integration code to quiz funnel
4. Test on iPhone
5. Go live! 🚀

