# 📱 Google Play Store Setup Guide - TimberLog Pro

Complete checklist for publishing TimberLog Pro to Google Play Store

---

## 🎯 Overview

This guide walks you through the complete process of publishing the TimberLog Pro mobile app to the Google Play Store, from initial setup to going live.

---

## STEP 1: Google Play Console Account

### Create Developer Account

1. Go to https://play.google.com/console
2. Sign in with Google account
3. Pay **$25 one-time registration fee**
4. Complete account verification (takes 1-2 days)
5. Accept Developer Distribution Agreement

---

## STEP 2: Create New App

### In Google Play Console

1. Click **"Create app"**
2. Fill in details:
   - **App name**: TimberLog Pro
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
3. Declare if app is for children: **No**
4. Accept declarations and click **Create app**

---

## STEP 3: Store Listing

### App Details

**Short description** (80 characters max):
```
Timber log measurement & deal tracking for field teams
```

**Full description** (4000 characters max):
```
TimberLog Pro - Measure Smart. Trade Confident.

The ultimate mobile app for timber importers and field workers to track purchases, measure logs accurately, and generate professional deal sheets on the go.

KEY FEATURES:

📦 Purchase Management
• Record BL (Bill of Lading) details with ease
• Track multiple containers per BL
• Dynamic supplier and country management
• Add CBM Gross, Net, PCS, and quality data

📏 Field Measurements
• One-handed operation optimized for field use
• Auto-advancing input for rapid data entry
• Live stats: CBM1, CBM2, CFT1, CFT2, Averages
• Offline-first - works without internet
• Auto-calculate girth and volume

📊 Deal Sheet & Reports
• Generate professional Deal Sheets in Excel
• Compare supplier declared vs measured values
• Short CBM calculation (loss/gain analysis)
• Color-coded for quick insights
• Share via WhatsApp, Email, or Google Drive

☁️ Cloud Sync
• Automatic sync when online
• Access data across devices
• Secure cloud backup
• Row-level security

💼 Enterprise Ready
• Multi-company support
• Subscription plans with 14-day free trial
• Export unlimited BLs and containers
• Priority support

WHO IS IT FOR?

• Timber importers tracking containerized shipments
• Field workers measuring logs at ports
• Timber traders comparing deals
• Quality control teams verifying deliveries

SUBSCRIPTION:

• 14-day free trial (no credit card required)
• Pro Plan: ₹999/month or ₹8,999/year
• Cancel anytime

WHY CHOOSE TIMBERLOG PRO?

✓ Built specifically for the timber industry
✓ Accurate measurement formulas (CBM, CFT, Girth)
✓ Works offline in remote locations
✓ Professional Excel reports
✓ Easy to use, even for non-technical users
✓ Trusted by timber professionals

Download now and start your free trial!

Support: support@timberlogpro.com
```

### App Icon

**Specifications**:
- Size: 512 x 512 pixels
- Format: PNG (32-bit)
- Max file size: 1 MB
- Must be square
- No transparency
- Design: Forest green log cross-section with bar chart inside

**Generate icon**:
```bash
# Use design tool (Figma, Adobe Illustrator, or Canva)
# Export as PNG 512x512
# Place in: assets/playstore/icon-512.png
```

### Feature Graphic

**Specifications**:
- Size: 1024 x 500 pixels
- Format: PNG or JPEG
- Max file size: 1 MB
- Design: Dark green background, centered logo, app name, tagline

**Content**:
- Background: Deep forest green (#1B4A25)
- Logo: TimberLog Pro icon (centered-left)
- Text: "TimberLog Pro" in bold white
- Tagline: "Measure Smart. Trade Confident." in amber
- Visual: Subtle log texture or measurement tape

### Screenshots

**Specifications**:
- Minimum: 2 screenshots
- Maximum: 8 screenshots
- Dimensions: 1080 x 1920 pixels (portrait) or 1920 x 1080 (landscape)
- Format: PNG or JPEG

**Recommended screenshots** (in order):

1. **Login Screen** - "Welcome to TimberLog Pro"
2. **Dashboard** - "Track all your BLs and containers"
3. **Purchases List** - "Manage purchases with ease"
4. **Add Purchase** - "Record container details"
5. **Measurement Screen** - "Measure logs in the field"
6. **Deal Sheet** - "Professional Excel reports"
7. **Live Stats** - "Real-time calculations"
8. **Offline Mode** - "Works without internet"

**How to capture**:
```bash
# Run app in simulator with dimensions 1080x1920
# Or use physical device screenshots
# Add annotations and captions using design tool
```

---

## STEP 4: App Content

### App Access

- **All functionality is available without restrictions**: No
- **Restricted access**: Yes
  - Instructions: "Sign up for a free account. 14-day trial available."

### Ads

- **Does your app contain ads?**: No

### Content Rating

1. Click **Start questionnaire**
2. Enter email address
3. Category: **Utility, Productivity, Communication, or Business**
4. Answer questions:
   - Violence: No
   - Sexual content: No
   - Language: No
   - Controlled substances: No
   - Gambling: No
   - User interaction: Yes (users can share data)
5. Submit for rating

Expected rating: **Everyone**

### Target Audience

- **Target age group**: 18 and over
- **App appeals to children**: No

### News App

- **Is this a news app?**: No

### COVID-19 Contact Tracing

- **Is this a COVID-19 contact tracing or status app?**: No

### Data Safety

Fill out data safety form:

**Data Collection**:
- Collected: Yes
  - Personal info: Name, Email address
  - Financial info: Purchase history
  - App activity: App interactions
  - Device or other IDs: User ID

**Data Usage**:
- Account management
- App functionality
- Analytics

**Data Sharing**:
- No third-party sharing

**Security**:
- Data encrypted in transit: Yes
- Users can request data deletion: Yes
- Committed to Google Play Families Policy: No

### Privacy Policy

**Required**. Host your privacy policy and provide URL.

Example URL: `https://timberlogpro.com/privacy-policy`

**Template** (minimal):
```
Privacy Policy for TimberLog Pro

We collect:
- Account information (name, company, username)
- Measurement data (BLs, containers, logs)
- Usage analytics

We use this data to:
- Provide app functionality
- Sync across devices
- Improve the app

We do not:
- Sell your data
- Share with third parties
- Use for advertising

Contact: support@timberlogpro.com
```

---

## STEP 5: App Setup

### App Category

- **Category**: Business
- **Tags**: timber, measurement, field work, inventory, export

### Contact Details

- **Email**: support@timberlogpro.com
- **Phone**: +91-XXXXXXXXXX (optional)
- **Website**: https://timberlogpro.com

### Store Settings

- **Seller Name**: Your Company Name
- **External Marketing**: Optional

---

## STEP 6: Build & Upload

### Generate Signed AAB

```bash
# Make sure you're in the mobile-app directory
cd /app/mobile-app

# Login to EAS
eas login

# Configure project (first time only)
eas build:configure

# Build production AAB
eas build --platform android --profile production

# Wait for build to complete (10-20 minutes)
# Download AAB or upload directly via EAS Submit
```

### Upload to Play Console

**Option A: Manual Upload**
1. Download AAB from EAS build
2. Go to Play Console → Production
3. Click **Create new release**
4. Upload AAB file
5. Add release notes

**Option B: EAS Submit** (Recommended)
```bash
eas submit --platform android
```

### Release Notes Template

```
Version 1.0.0 - Initial Release

New Features:
• Purchase management with extended container fields
• Field log measurement with offline support
• Live stats and calculations
• Professional Deal Sheet export
• Cloud sync via Supabase
• 14-day free trial
• Subscription plans (Pro: ₹999/month)

What's Included:
• Track BLs and containers
• Measure logs accurately
• Calculate CBM, CFT, Girth
• Export Excel reports
• Share via WhatsApp/Email
• Works offline

Start your free trial today!
```

---

## STEP 7: Pricing & Distribution

### Countries

- **Select countries**: All countries (or specific list)
- **India**: Definitely include (primary market)

### Pricing

- **App price**: Free
- **In-app purchases**: Yes
  - Pro Monthly: ₹999
  - Pro Yearly: ₹8,999

### Device Categories

- ✅ Phone
- ✅ Tablet
- ⬜ Wear OS
- ⬜ TV
- ⬜ Auto

---

## STEP 8: In-App Products (RevenueCat)

### Create In-App Products

1. Go to **Monetize → Products → Subscriptions**
2. Create **Product ID**: `timberlogpro_monthly`
   - Name: TimberLog Pro Monthly
   - Description: Unlimited BLs, containers, and exports
   - Price: ₹999/month
   - Billing period: 1 month
   - Free trial: 14 days
3. Create **Product ID**: `timberlogpro_yearly`
   - Name: TimberLog Pro Yearly (Save 25%)
   - Description: Unlimited BLs, containers, and exports
   - Price: ₹8,999/year
   - Billing period: 1 year
   - Free trial: 14 days
4. Activate products

### Link to RevenueCat

1. In RevenueCat dashboard, add Android app
2. Configure with package name: `com.timberlogpro.app`
3. Add product IDs from Play Console
4. Configure offerings

---

## STEP 9: Testing

### Internal Testing

1. Go to **Testing → Internal testing**
2. Create new release
3. Upload AAB
4. Add testers (email addresses)
5. Share link with testers
6. Test for:
   - Installation
   - Login/Signup
   - Core features
   - Purchases (sandbox mode)
   - Export functionality
   - Offline mode
   - Sync after offline

### Closed Testing (Optional)

1. Create **Closed testing** track
2. Invite wider group (up to 100 testers)
3. Collect feedback
4. Fix bugs
5. Upload new builds as needed

---

## STEP 10: Pre-Launch Report

Google will automatically run tests on your app:

- **Compatibility**: Devices tested
- **Accessibility**: Screen reader compatibility
- **Performance**: Startup time, battery usage
- **Security**: Vulnerability scan

Review and fix any critical issues before launch.

---

## STEP 11: Submit for Review

### Checklist Before Submit

- [ ] All store listing fields complete
- [ ] App icon uploaded
- [ ] Feature graphic uploaded
- [ ] At least 2 screenshots uploaded
- [ ] Privacy policy URL provided
- [ ] Content rating complete
- [ ] AAB uploaded
- [ ] Release notes added
- [ ] Pricing configured
- [ ] Distribution countries selected
- [ ] In-app products created (if applicable)
- [ ] Tested on internal track

### Submit

1. Go to **Publishing overview**
2. Review all sections (green checkmarks)
3. Click **Send for review**
4. Approval typically takes **1-3 days**

---

## STEP 12: After Approval

### Go Live

Once approved:
1. App status → **Published**
2. Available on Play Store within hours
3. Users can search and download

### Post-Launch

- Monitor **Ratings & Reviews**
- Track **Statistics** (downloads, installs, crashes)
- Respond to user feedback
- Release updates regularly
- Monitor **Android Vitals** (crash-free rate, ANRs)

---

## 🔄 Updating the App

### Release Updates

```bash
# Increment version in app.json
# versionCode: 2 (increment by 1)
# versionName: "1.0.1"

# Build new AAB
eas build --platform android --profile production

# Submit to existing track
eas submit --platform android
```

### Update Types

- **Patch** (1.0.1): Bug fixes
- **Minor** (1.1.0): New features
- **Major** (2.0.0): Breaking changes

---

## 📊 Play Store Assets Checklist

Create these assets before uploading:

### Required
- [x] App Icon 512x512 PNG
- [x] Feature Graphic 1024x500
- [x] At least 2 Phone Screenshots 1080x1920
- [x] Short Description (80 chars)
- [x] Full Description (4000 chars)
- [x] Privacy Policy URL
- [x] Content Rating
- [x] AAB file

### Recommended
- [ ] 8 Phone Screenshots
- [ ] Promotional Video (YouTube)
- [ ] Tablet Screenshots 1536x2048
- [ ] Promotional Graphics
- [ ] Press Kit

---

## 💡 Tips for Success

1. **Use high-quality screenshots** with captions
2. **Highlight key features** in description
3. **Respond to reviews** within 24 hours
4. **Regular updates** signal active development
5. **Optimize keywords** for search (timber, log, measurement)
6. **Track metrics** to understand user behavior
7. **A/B test** store listing
8. **Localize** for key markets (Hindi, etc.)

---

## 🚨 Common Rejection Reasons

Avoid these:

- ❌ Incomplete store listing
- ❌ Privacy policy missing or invalid
- ❌ Low-quality screenshots
- ❌ Misleading description
- ❌ Crashes on startup
- ❌ Violates Play policies
- ❌ In-app purchases not working
- ❌ Permissions not justified

---

## 📞 Support

If you need help:

- **Google Play Console Help**: https://support.google.com/googleplay/android-developer
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **RevenueCat Docs**: https://docs.revenuecat.com/

---

**Ready to launch TimberLog Pro! 🚀**
