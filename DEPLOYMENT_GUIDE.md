# Deployment Guide - Payment Instructions API

## ✅ Pre-Deployment Checklist

- [x] All 12 test cases pass locally
- [x] Server runs on port 3000
- [x] Endpoint responds correctly at `POST /payment-instructions`
- [x] HTTP status codes are correct (200 for success/pending, 400 for errors)
- [x] All validation rules implemented
- [x] Response format matches specification
- [x] No regex used in parsing
- [x] Code follows template structure

## 🚀 Deployment Options

### Option 1: Render.com (Recommended)

1. **Create Account:**
   - Go to [Render.com](https://render.com/)
   - Sign up for a free account

2. **Connect GitHub Repository:**
   - Click "New" → "Web Service"
   - Connect your GitHub account
   - Select your repository

3. **Configure Service:**
   - **Name:** `payment-instructions-api` (or your preferred name)
   - **Environment:** `Node`
   - **Build Command:** `npm install` or `pnpm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free tier is fine

4. **Environment Variables:**
   - Add `PORT` variable (Render will set this automatically, but you can override)
   - **MONGODB_URI** - Not required for this assessment (leave empty or remove)
   - **REDIS_URL** - Not required for this assessment (leave empty or remove)

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your service will be available at `https://your-app-name.onrender.com`

6. **Test Deployed Endpoint:**
   - Test URL: `https://your-app-name.onrender.com/payment-instructions`
   - Run all 12 test cases against the deployed endpoint

### Option 2: Heroku

1. **Install Heroku CLI:**
   - Download from [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

2. **Login:**
   ```bash
   heroku login
   ```

3. **Create App:**
   ```bash
   heroku create your-app-name
   ```

4. **Set Environment Variables:**
   ```bash
   heroku config:set PORT=3000
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

6. **Test:**
   ```bash
   heroku open
   ```

### Option 3: Railway

1. **Create Account:**
   - Go to [Railway.app](https://railway.app/)
   - Sign up with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository

3. **Configure:**
   - Railway will auto-detect Node.js
   - Build command: `npm install` or `pnpm install`
   - Start command: `npm start`

4. **Deploy:**
   - Railway will automatically deploy
   - Your service will be available at `https://your-app-name.up.railway.app`

## 🔧 Environment Variables

For this assessment, you only need:
- `PORT` - Usually set automatically by the platform (default: 3000)

**Optional (not required):**
- `MONGODB_URI` - Not needed (assessment doesn't require database)
- `REDIS_URL` - Not needed (assessment doesn't require Redis)

## 📋 Post-Deployment Testing

After deployment, test all 12 cases against your live endpoint:

1. **Test Case 1 - DEBIT format (Valid)**
2. **Test Case 2 - CREDIT format with future date (Pending)**
3. **Test Case 3 - Case insensitive (Valid)**
4. **Test Case 4 - Past date (Valid - Immediate execution)**
5. **Test Case 5 - Currency mismatch (Error - CU01)**
6. **Test Case 6 - Insufficient funds (Error - AC01)**
7. **Test Case 7 - Unsupported currency (Error - CU02)**
8. **Test Case 8 - Same account (Error - AC02)**
9. **Test Case 9 - Negative amount (Error - AM01)**
10. **Test Case 10 - Account not found (Error - AC03)**
11. **Test Case 11 - Decimal amount (Error - AM01)**
12. **Test Case 12 - Malformed instruction (Error - SY01/SY03)**

## ✅ Final Checklist Before Submission

- [ ] GitHub repository is **public**
- [ ] All code is committed and pushed
- [ ] Endpoint is deployed and accessible
- [ ] All 12 test cases pass on deployed endpoint
- [ ] Endpoint URL is: `https://your-app-name.onrender.com/payment-instructions` (or your platform)
- [ ] No authentication required
- [ ] Response format is correct
- [ ] HTTP status codes are correct (200/400)
- [ ] All validation rules work
- [ ] Error messages are clear

## 📝 Submission

1. **GitHub Repository:**
   - Ensure repository is **public**
   - Repository should contain all code
   - Include a README.md (optional but recommended)

2. **Deployed Endpoint:**
   - Full URL: `https://your-app-name.onrender.com/payment-instructions`
   - Must be publicly accessible
   - No authentication required

3. **Submit via Google Form:**
   - [Submit Assessment](https://docs.google.com/forms/d/e/1FAIpQLSd0X19LG0iKaqMI57UvePwacc7Cb9KmF3W05m0HD93ddGgvUg/viewform?usp=dialog)
   - Provide GitHub repository link
   - Provide full deployed endpoint URL

## 🐛 Troubleshooting

### Issue: Deployment fails
- **Solution:** Check build logs for errors
- Ensure all dependencies are in `package.json`
- Check that `package.json` has correct `start` script

### Issue: Endpoint returns 404
- **Solution:** Verify endpoint path is `/payment-instructions`
- Check that server is running
- Verify environment variables are set

### Issue: Port already in use
- **Solution:** Platform should set PORT automatically
- Remove PORT from environment variables if set manually

### Issue: MongoDB connection error
- **Solution:** Not required for this assessment
- The app should handle missing MongoDB gracefully
- Check that `createConnection` doesn't throw if URI is missing

## 🎯 Next Steps

1. ✅ Deploy to Render/Heroku/Railway
2. ✅ Test all 12 cases on deployed endpoint
3. ✅ Verify response format
4. ✅ Submit via Google Form
5. ✅ Wait for feedback

---

**Good luck with your submission!** 🚀

