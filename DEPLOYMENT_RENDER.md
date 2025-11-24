# Deploying JobDance Web to Render.com

This guide will walk you through deploying your Next.js application to Render.com step by step.

## Quick Start Summary

1. **Prepare**: Test build locally (`npm run build`)
2. **Create Service**: Go to Render.com → New Web Service
3. **Connect Repo**: Link your GitHub/GitLab repository
4. **Configure**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. **Set Environment Variables**: Add all required variables (see Step 3)
6. **Deploy**: Click "Create Web Service"
7. **Configure Supabase**: Update redirect URLs
8. **Test**: Verify all features work

**Estimated Time**: 15-20 minutes

---

## Prerequisites

- A Render.com account (sign up at https://render.com)
- Your Supabase project URL and keys
- Your AWS credentials (Access Key ID and Secret Access Key)
- Your AWS S3 bucket name
- Git repository (GitHub, GitLab, or Bitbucket)

---

## Step 1: Prepare Your Application

### 1.1 Ensure Build Works Locally

```bash
# Test the build locally first
npm run build
```

Make sure the build completes successfully without errors.

### 1.2 Create/Update `.env.production` (Optional)

You can create a `.env.production` file for production-specific variables, but we'll set these in Render's dashboard instead.

### 1.3 Commit and Push to Git

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

---

## Step 2: Create a New Web Service on Render

### 2.1 Sign In to Render

1. Go to https://dashboard.render.com
2. Sign in or create an account

### 2.2 Option A: Create New Web Service (Manual)

1. Click **"New +"** button in the top right
2. Select **"Web Service"**
3. Connect your Git repository:
   - If not connected, click **"Connect account"** and authorize Render
   - Select your repository: `JobDance Web` (or your repo name)
   - Click **"Connect"**

### 2.2 Option B: Use Blueprint (Recommended - Uses render.yaml)

1. Click **"New +"** button in the top right
2. Select **"Blueprint"**
3. Connect your Git repository
4. Render will automatically detect `render.yaml` and configure the service
5. Review the configuration and click **"Apply"**

### 2.3 Configure the Service

Fill in the following details:

- **Name**: `jobdance-web` (or your preferred name)
- **Region**: Choose closest to your users (e.g., `Singapore` for Asia-Pacific)
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (or `./` if your package.json is in a subdirectory)
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 2.4 Advanced Settings

Click **"Advanced"** and configure:

- **Node Version**: `18.x` or `20.x` (check your `.nvmrc` or `package.json` if specified)
- **Auto-Deploy**: `Yes` (automatically deploys on git push)

---

## Step 3: Configure Environment Variables

In the Render dashboard, go to your service's **"Environment"** tab and add the following variables:

### 3.1 Supabase Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**How to get these:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** and **anon/public key**

### 3.2 AWS Variables

```
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

**How to get these:**
1. AWS Access Key ID and Secret: From your AWS IAM user credentials
2. AWS Region: The region where your S3 bucket and Bedrock are configured (e.g., `ap-southeast-1`)
3. S3 Bucket Name: The name of your S3 bucket (e.g., `jobdance-interviews-1763988395`)

### 3.3 Next.js Variables (if needed)

```
NODE_ENV=production
```

---

## Step 4: Configure Build Settings

### 4.1 Build Command

Make sure your build command is:
```
npm install && npm run build
```

### 4.2 Start Command

Make sure your start command is:
```
npm start
```

### 4.3 Health Check Path (Optional)

- **Health Check Path**: `/` (or leave empty)

---

## Step 5: Deploy

### 5.1 Initial Deployment

1. Click **"Create Web Service"** at the bottom
2. Render will start building your application
3. Monitor the build logs in real-time
4. Wait for the build to complete (usually 3-5 minutes)

### 5.2 Check Build Logs

Watch for any errors in the build logs:
- ✅ **Success**: "Build successful"
- ❌ **Errors**: Check for missing dependencies, build errors, or environment variable issues

---

## Step 6: Post-Deployment Configuration

### 6.1 Update Supabase URLs (if needed)

If your Supabase project has specific redirect URLs configured:

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Render URL to **Redirect URLs**:
   ```
   https://your-app-name.onrender.com/auth/callback
   ```
3. Add to **Site URL**:
   ```
   https://your-app-name.onrender.com
   ```

### 6.2 Update CORS Settings (if needed)

If you have CORS issues:

1. Go to Supabase Dashboard → **Settings** → **API**
2. Add your Render domain to allowed origins

### 6.3 Test the Application

1. Visit your Render URL: `https://your-app-name.onrender.com`
2. Test the following:
   - User registration/login
   - Onboarding flow
   - AI interview practice
   - Report generation

---

## Step 7: Database Migrations

### 7.1 Run Supabase Migrations

Your migrations are in `supabase/migrations/`. Make sure they're applied:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run each migration file in order:
   - `001_initial_schema.sql`
   - `002_add_interview_reports.sql`
   - `003_fix_interview_sessions_rls.sql` (if created)
   - `004_fix_user_profiles_rls.sql` (if created)

### 7.2 Verify RLS Policies

Ensure all Row-Level Security policies are correctly set up for:
- `user_profiles`
- `interview_sessions`
- Other tables

---

## Step 8: Custom Domain (Optional)

### 8.1 Add Custom Domain

1. In Render dashboard, go to your service
2. Click **"Settings"** → **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter your domain (e.g., `app.jobdance.com`)
5. Follow the DNS configuration instructions

### 8.2 Update Environment Variables

After adding custom domain, update Supabase redirect URLs to use your custom domain.

---

## Step 9: Monitoring and Logs

### 9.1 View Logs

- **Real-time logs**: Click **"Logs"** tab in Render dashboard
- **Historical logs**: Available in the logs section

### 9.2 Monitor Performance

- Check **"Metrics"** tab for:
  - CPU usage
  - Memory usage
  - Request latency
  - Error rates

---

## Step 10: Troubleshooting Common Issues

### Issue: Build Fails

**Solution:**
- Check build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node version matches your local environment
- Check for TypeScript errors

### Issue: Environment Variables Not Working

**Solution:**
- Verify all variables are set in Render dashboard
- Ensure variable names match exactly (case-sensitive)
- Restart the service after adding new variables

### Issue: API Routes Return 500 Errors

**Solution:**
- Check server logs in Render dashboard
- Verify AWS credentials are correct
- Ensure Supabase connection is working
- Check RLS policies are set correctly

### Issue: Authentication Not Working

**Solution:**
- Verify Supabase redirect URLs include your Render domain
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Ensure cookies are being set (check browser dev tools)

### Issue: Slow Response Times

**Solution:**
- Upgrade to a higher tier plan on Render
- Check AWS Bedrock region (use `us-east-1` for better quotas)
- Optimize database queries
- Enable caching where possible

---

## Step 11: Continuous Deployment

### 11.1 Auto-Deploy

Render automatically deploys when you push to your connected branch (usually `main`).

### 11.2 Manual Deploy

1. Go to your service in Render dashboard
2. Click **"Manual Deploy"**
3. Select branch and commit
4. Click **"Deploy"**

---

## Step 12: Production Checklist

Before going live, verify:

- [ ] All environment variables are set
- [ ] Database migrations are applied
- [ ] RLS policies are configured correctly
- [ ] Supabase redirect URLs are updated
- [ ] AWS credentials are valid
- [ ] S3 bucket permissions are correct
- [ ] Bedrock model access is granted
- [ ] Build completes successfully
- [ ] Application loads without errors
- [ ] User registration works
- [ ] AI interview practice works
- [ ] Video upload works
- [ ] Report generation works

---

## Render Pricing Tiers

### Free Tier (Good for Testing)
- 750 hours/month
- Sleeps after 15 minutes of inactivity
- Limited resources

### Starter Tier ($7/month)
- Always on
- 512 MB RAM
- Better for production

### Standard Tier ($25/month)
- 2 GB RAM
- Better performance
- Recommended for production

---

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

---

## Support

If you encounter issues:

1. Check Render logs
2. Check browser console for client-side errors
3. Verify all environment variables
4. Test API routes individually
5. Check Supabase logs
6. Review AWS CloudWatch logs (if configured)

---

## Quick Reference: Environment Variables Summary

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# AWS
AWS_ACCESS_KEY_ID=AKIAxxx...
AWS_SECRET_ACCESS_KEY=xxx...
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET_NAME=jobdance-interviews-xxx

# Next.js
NODE_ENV=production
```

---

## Step 13: Using Render Blueprint (Alternative Method)

If you prefer to use the `render.yaml` file I've created:

1. Make sure `render.yaml` is committed to your repository
2. In Render dashboard, click **"New +"** → **"Blueprint"**
3. Select your repository
4. Render will auto-detect the `render.yaml` file
5. Review the configuration
6. **Important**: You still need to manually set the environment variables marked as `sync: false` in the dashboard
7. Click **"Apply"** to create the service

---

## Important Notes

### Security
- ✅ **Never commit** `.env.local` or `.env.production` files to Git
- ✅ Always use Render's environment variable settings
- ✅ Keep AWS credentials secure
- ✅ Rotate credentials periodically

### Performance
- Free tier services **sleep after 15 minutes** of inactivity
- First request after sleep may take 30-60 seconds (cold start)
- Consider upgrading to Starter tier ($7/month) for always-on service

### Database
- Your Supabase database is separate from Render
- No additional database setup needed on Render
- All database operations go through Supabase API

### File Storage
- Video files are stored in AWS S3, not on Render
- Render only hosts the application code
- S3 bucket should be in the same region as your AWS services

---

**Note**: Keep your environment variables secure. Never commit them to Git. Always use Render's environment variable settings.

