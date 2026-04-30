# 🎯 TimberLog Pro - Complete Setup Checklist

Use this checklist to set up the TimberLog Pro mobile app from scratch.

---

## ✅ Step 1: Install Prerequisites

- [ ] Install Node.js 18+ from https://nodejs.org
- [ ] Install Yarn: `npm install -g yarn`
- [ ] Install Expo CLI: `npm install -g expo-cli`
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Create Expo account at https://expo.dev
- [ ] Install Android Studio (optional, for emulator)

---

## ✅ Step 2: Project Setup

- [ ] Navigate to mobile-app directory: `cd /app/mobile-app`
- [ ] Install dependencies: `yarn install`
- [ ] Copy `.env.example` to `.env`
- [ ] Verify all files are present

---

## ✅ Step 3: Supabase Setup

### Create Project
- [ ] Go to https://supabase.com
- [ ] Click "New Project"
- [ ] Choose organization
- [ ] Set database password (SAVE THIS!)
- [ ] Select region (closest to users)
- [ ] Wait for project to initialize (2-3 minutes)

### Get Credentials
- [ ] Go to Project Settings → API
- [ ] Copy **Project URL**
- [ ] Copy **anon public** key
- [ ] Paste both into `.env` file

### Run Database Migration
- [ ] Go to SQL Editor in Supabase
- [ ] Create new query
- [ ] Copy contents of `supabase/migrations/001_initial_schema.sql`
- [ ] Paste and run query
- [ ] Verify all tables created (users, purchases, containers, etc.)
- [ ] Check RLS policies are enabled

### Configure Authentication
- [ ] Go to Authentication → Providers
- [ ] Enable **Email** provider
- [ ] Disable email confirmation (or configure SMTP)
- [ ] Save settings

---

## ✅ Step 4: RevenueCat Setup (Optional - for subscriptions)

- [ ] Sign up at https://www.revenuecat.com
- [ ] Create new project: "TimberLog Pro"
- [ ] Click "Add App"
- [ ] Select **Android**
- [ ] Enter package name: `com.timberlogpro.app`
- [ ] Copy **Android SDK Key**
- [ ] Paste into `.env` → `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`

### Create Products
- [ ] Go to Products section
- [ ] Click "Add Product"
- [ ] Create product: `timberlogpro_monthly`
  - Display name: "TimberLog Pro Monthly"
  - Type: Subscription
- [ ] Create product: `timberlogpro_yearly`
  - Display name: "TimberLog Pro Yearly"
  - Type: Subscription

### Create Offering
- [ ] Go to Offerings
- [ ] Create offering: "default"
- [ ] Add both products to offering
- [ ] Set "default" as current offering

---

## ✅ Step 5: EAS Setup

### Login to EAS
```bash
eas login
```
- [ ] Enter Expo credentials

### Configure Project
```bash
cd /app/mobile-app
eas build:configure
```
- [ ] Select platform: **Android**
- [ ] Generate new keystore: **Yes**

### Update app.json
- [ ] Replace `your-eas-project-id` with actual ID from EAS
- [ ] Verify package name: `com.timberlogpro.app`
- [ ] Update versionCode and versionName if needed

---

## ✅ Step 6: Test Locally

### Start Development Server
```bash
yarn start
```

### Test on Physical Device
- [ ] Install **Expo Go** app from Play Store
- [ ] Scan QR code from terminal
- [ ] App should open in Expo Go

### Test Key Features
- [ ] Signup with new account
- [ ] Verify account created in Supabase (users table)
- [ ] Login with credentials
- [ ] Navigate between tabs
- [ ] Logout and login again
- [ ] Test offline (turn off WiFi, app should still open)

---

## ✅ Step 7: Google Play Console Setup

### Create Developer Account
- [ ] Go to https://play.google.com/console
- [ ] Pay $25 registration fee
- [ ] Complete account verification (wait 1-2 days)
- [ ] Accept agreements

### Create App
- [ ] Click "Create app"
- [ ] App name: **TimberLog Pro**
- [ ] Default language: English (US)
- [ ] App type: App
- [ ] Free or paid: Free
- [ ] Create app

### Complete Store Listing
- [ ] Fill in short description (80 chars)
- [ ] Fill in full description (4000 chars) - see PLAYSTORE_SETUP.md
- [ ] Upload app icon 512x512
- [ ] Upload feature graphic 1024x500
- [ ] Upload at least 2 screenshots 1080x1920
- [ ] Set category: Business
- [ ] Add contact email

### Complete Questionnaires
- [ ] Content rating questionnaire
- [ ] Target audience
- [ ] Privacy policy (create and host, then add URL)
- [ ] Data safety form

### Create In-App Products (for subscriptions)
- [ ] Go to Monetize → Products → Subscriptions
- [ ] Create subscription: `timberlogpro_monthly` (₹999/month)
- [ ] Create subscription: `timberlogpro_yearly` (₹8,999/year)
- [ ] Set 14-day free trial for both
- [ ] Activate products

---

## ✅ Step 8: Build Production APK/AAB

### Build APK (for testing)
```bash
eas build --platform android --profile preview
```
- [ ] Wait for build (~15 minutes)
- [ ] Download APK
- [ ] Install on test device
- [ ] Test all features

### Build AAB (for Play Store)
```bash
eas build --platform android --profile production
```
- [ ] Wait for build (~15 minutes)
- [ ] Download AAB or note build ID for EAS Submit

---

## ✅ Step 9: Internal Testing

### Upload to Internal Testing Track
```bash
eas submit --platform android
```
OR
- [ ] Go to Play Console → Testing → Internal testing
- [ ] Create new release
- [ ] Upload AAB
- [ ] Add release notes
- [ ] Save and review
- [ ] Start rollout

### Invite Testers
- [ ] Add tester email addresses
- [ ] Send invitation link
- [ ] Ask testers to install and test

### Test Checklist for Testers
- [ ] Install app
- [ ] Create account (signup)
- [ ] Login
- [ ] Navigate all tabs
- [ ] Test offline mode (airplane mode)
- [ ] Test subscription purchase (sandbox)
- [ ] Report any bugs

---

## ✅ Step 10: Submit for Review

### Pre-Launch Checklist
- [ ] All store listing fields complete
- [ ] All questionnaires complete
- [ ] AAB uploaded
- [ ] Internal testing passed
- [ ] No critical bugs
- [ ] Privacy policy live
- [ ] In-app products configured (if applicable)

### Submit
- [ ] Go to Publishing overview
- [ ] Click "Send for review"
- [ ] Wait 1-3 days for approval

---

## ✅ Step 11: Post-Launch

### Monitor
- [ ] Check Play Console daily for reviews
- [ ] Monitor crash reports
- [ ] Track download stats
- [ ] Check Android Vitals

### Respond
- [ ] Reply to user reviews within 24 hours
- [ ] Fix critical bugs immediately
- [ ] Plan feature updates

### Update
- [ ] Increment version numbers
- [ ] Build new AAB
- [ ] Upload to production
- [ ] Add release notes

---

## 📝 Environment Variables Reference

```env
# Supabase (REQUIRED)
EXPO_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# RevenueCat (OPTIONAL - for subscriptions)
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=your-android-key

# PostHog (OPTIONAL - for analytics)
EXPO_PUBLIC_POSTHOG_KEY=your-posthog-key
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 🚨 Troubleshooting

### Build Fails
- Check `eas.json` configuration
- Verify package name matches everywhere
- Check for syntax errors in code
- Run `eas build:configure` again

### Supabase Connection Fails
- Verify URL and anon key in `.env`
- Check if RLS policies are enabled
- Verify Supabase project is not paused

### App Crashes on Startup
- Check logs: `npx react-native log-android`
- Verify all dependencies installed
- Clear cache: `yarn start --clear`

### Subscription Not Working
- Verify RevenueCat SDK key
- Check if products are active in Play Console
- Test in sandbox mode first
- Check RevenueCat dashboard logs

---

## 📞 Get Help

- **Expo Docs**: https://docs.expo.dev
- **Supabase Docs**: https://supabase.com/docs
- **RevenueCat Docs**: https://docs.revenuecat.com
- **Play Console Help**: https://support.google.com/googleplay/android-developer

---

## 🎉 You're Done!

Once you complete this checklist, your TimberLog Pro app will be:
- ✅ Built and ready
- ✅ Deployed to Play Store
- ✅ Available for download
- ✅ Monetized via subscriptions
- ✅ Syncing to cloud
- ✅ Production-ready!

**Next Steps**: Build remaining features (Purchases, Measurements, Dashboard, Excel Export) using the foundation provided.

Good luck! 🚀
