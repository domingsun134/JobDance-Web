# Supabase Setup Instructions

## 1. Create Environment Variables

Create a `.env.local` file in the root directory with the following content:

```
NEXT_PUBLIC_SUPABASE_URL=https://iaguerjulffetwydcuch.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZ3Vlcmp1bGZmZXR3eWRjdWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDI2NzksImV4cCI6MjA3OTQ3ODY3OX0.1-o9pB3Fx9MZKNEGLEFX-lnhzgJBG1nKNk4lXlft9JQ
```

## 2. Run SQL Migration in Supabase

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run" to execute the migration

This will create all the necessary tables:
- `user_profiles` - User profile information
- `work_experience` - Work experience entries
- `education` - Education entries
- `skills` - User skills
- `languages` - User languages
- `availability` - User availability
- `expected_salary` - Expected salary information
- `interview_sessions` - Interview session data (for future use)

## 3. Verify Row Level Security (RLS)

The migration script automatically enables RLS and creates policies. Make sure:
- All tables have RLS enabled
- Policies allow users to only access their own data
- The `auth.users` table is properly referenced

## 4. Test the Integration

1. Start the development server: `npm run dev`
2. Try registering a new account
3. Complete the onboarding process
4. Verify data is saved in Supabase dashboard

## 5. Configure LinkedIn OAuth

**IMPORTANT**: LinkedIn OAuth must be enabled in Supabase before the "Continue with LinkedIn" button will work.

### Step 1: Enable LinkedIn in Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/iaguerjulffetwydcuch
2. Navigate to **Authentication** → **Providers** (or go directly to: https://supabase.com/dashboard/project/iaguerjulffetwydcuch/auth/providers)
3. Scroll down and find **LinkedIn** in the list of providers
4. Click the toggle switch to **Enable** LinkedIn (it should turn green/blue)
5. Enter the following credentials:
   - **Client ID (for OAuth 2.0)**: `863k1398i2dbxe`
   - **Client Secret (for OAuth 2.0)**: `WPL_AP1.kAvBhhGnkTkJOZ4q.n6Sb9Q==`
6. **DO NOT** change the Redirect URL field - Supabase will automatically use: `https://iaguerjulffetwydcuch.supabase.co/auth/v1/callback`
7. Click **Save** at the bottom of the page

### Step 2: Configure LinkedIn App Redirect URLs

1. Go to LinkedIn Developers: https://www.linkedin.com/developers/apps
2. Select your LinkedIn app (or create one if you haven't)
3. Go to the **Auth** tab
4. Under **Redirect URLs**, add the following URLs:
   - `https://iaguerjulffetwydcuch.supabase.co/auth/v1/callback` (for production)
   - `http://localhost:3000/auth/callback` (for local development - optional but recommended)
5. Click **Update** to save

### Step 3: Verify Configuration

After enabling LinkedIn in Supabase:
- The LinkedIn provider should show as **Enabled** (green/blue toggle)
- You should see a checkmark or success message
- Try clicking "Continue with LinkedIn" button again - it should now redirect to LinkedIn

### Troubleshooting

If you still get the error "Unsupported provider: provider is not enabled" even after enabling LinkedIn:

1. **Verify LinkedIn is actually enabled:**
   - Go to: https://supabase.com/dashboard/project/iaguerjulffetwydcuch/auth/providers
   - Find LinkedIn in the list
   - The toggle should be **ON** (green/blue, not gray)
   - If it's OFF, click it to enable and **Save**

2. **Check the credentials:**
   - Client ID should be exactly: `863k1398i2dbxe` (no spaces, no quotes)
   - Client Secret should be exactly: `WPL_AP1.kAvBhhGnkTkJOZ4q.n6Sb9Q==` (no spaces, no quotes)
   - Make sure there are no extra characters or line breaks

3. **Verify redirect URLs match exactly:**
   - In Supabase: The redirect URL should be: `https://iaguerjulffetwydcuch.supabase.co/auth/v1/callback`
   - In LinkedIn App Settings (https://www.linkedin.com/developers/apps):
     - Go to your app → **Auth** tab
     - Under **Redirect URLs**, you MUST have: `https://iaguerjulffetwydcuch.supabase.co/auth/v1/callback`
     - The URL must match **exactly** (including https, no trailing slash)
     - Click **Update** to save

4. **Clear cache and refresh:**
   - Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
   - Or clear browser cache
   - Restart your Next.js dev server: Stop it (Ctrl+C) and run `npm run dev` again

5. **Check Supabase project status:**
   - Make sure your Supabase project is **active** (not paused)
   - Go to project settings to verify

6. **Verify LinkedIn app status:**
   - Your LinkedIn app must be in **Live** or **Development** mode
   - If it's pending approval, you may need to wait
   - Check that the app has the correct permissions

7. **Check browser console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Click "Continue with LinkedIn" button
   - Look for any error messages that might give more details

8. **Test with a different browser:**
   - Sometimes browser extensions or settings can interfere
   - Try in an incognito/private window

## Notes

- The app now uses Supabase Auth for authentication
- User passwords are securely hashed by Supabase
- All user data is stored in Supabase PostgreSQL database
- Row Level Security ensures users can only access their own data
- LinkedIn OAuth is configured and ready to use once the credentials are added to Supabase dashboard


