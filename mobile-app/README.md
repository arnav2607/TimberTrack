# 🌲 TimberLog Pro - Mobile App

**Production-ready cross-platform mobile app for timber industry measurement and deal tracking**

Tagline: *"Measure Smart. Trade Confident."*

---

## 📱 App Overview

TimberLog Pro is an offline-first mobile application built with React Native and Expo, designed for timber field workers and importers to:
- Record purchase details (BLs) with extended container information
- Measure logs in the field with one-handed operation
- Track supplier vs measured comparison (Deal Sheet)
- Export Excel reports and share via WhatsApp/Email
- Sync data to cloud when online
- Manage subscriptions via RevenueCat

---

## 🚀 Quick Start

### Prerequisites

1. **Node.js** 18+ and **Yarn**
2. **Expo CLI**: `npm install -g expo-cli`
3. **EAS CLI**: `npm install -g eas-cli`
4. **Expo Account**: Sign up at https://expo.dev
5. **Supabase Project**: Create at https://supabase.com

### Installation

```bash
cd mobile-app
yarn install
```

### Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=your-revenuecat-key
```

### Supabase Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migration file:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
4. This creates all tables, RLS policies, and indexes

### Run Development Server

```bash
yarn start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on physical device

---

## 🏗️ Project Structure

```
mobile-app/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx            # Login screen
│   │   └── signup.tsx           # Signup with 14-day trial
│   ├── (tabs)/                   # Main app tabs
│   │   ├── purchases/           # BL management
│   │   ├── measure/             # Log measurement
│   │   ├── dashboard/           # Analytics & reports
│   │   └── settings/            # Profile & subscription
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Entry redirect
│
├── components/                   # Reusable UI components
│   └── ui/                      # Custom UI components
│
├── stores/                       # Zustand state management
│   └── authStore.ts             # Authentication state
│
├── hooks/                        # Custom React hooks
│   └── useAuth.ts               # Auth & subscription hooks
│
├── services/                     # External services
│   └── supabase.ts              # Supabase client setup
│
├── theme/                        # Design system
│   ├── colors.ts                # Brand colors & tokens
│   └── paperTheme.ts            # Material Design 3 theme
│
├── utils/                        # Helper functions
│   └── calculations.ts          # Timber measurement formulas
│
├── supabase/                     # Supabase resources
│   └── migrations/              # Database SQL migrations
│
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
└── package.json                  # Dependencies
```

---

## 🔑 Key Features Implemented (Foundation)

### ✅ Phase 1 Complete: Foundation

- [x] **Expo Router** navigation with file-based routing
- [x] **Material Design 3** UI with React Native Paper
- [x] **Authentication** (Login, Signup with Supabase)
- [x] **Supabase Integration** with Row Level Security
- [x] **State Management** with Zustand
- [x] **Theme System** (Brand colors: Deep forest green + Warm amber)
- [x] **Database Schema** complete with migrations
- [x] **Type-safe** TypeScript throughout
- [x] **Calculation Utilities** for timber measurements
- [x] **Subscription Hooks** ready for RevenueCat
- [x] **Tab Navigation** (Purchases, Measure, Dashboard, Settings)

### 🚧 To Be Built (Next Phases)

**Phase 2: Core Features**
- [ ] Purchases CRUD with supplier/country management
- [ ] Container management with extended fields
- [ ] WatermelonDB offline database
- [ ] Supabase sync logic

**Phase 3: Measurement Flow**
- [ ] BL/Container selection
- [ ] Log entry feed with auto-advance
- [ ] Live stats calculation
- [ ] Completion form with bend%, quality

**Phase 4: Dashboard & Exports**
- [ ] KPI cards with enhanced metrics
- [ ] Pending containers/BLs panels
- [ ] Excel export with SheetJS
- [ ] Deal Sheet format
- [ ] Share via WhatsApp/Email

**Phase 5: Monetization**
- [ ] RevenueCat SDK integration
- [ ] Subscription plans (Pro: ₹999/month, ₹8999/year)
- [ ] Paywall logic
- [ ] Google Play In-App Purchases

---

## 📦 Building for Production

### Android APK (Testing)

```bash
eas build --platform android --profile preview
```

### Android AAB (Play Store)

```bash
eas build --platform android --profile production
```

### Submit to Google Play

```bash
eas submit --platform android
```

---

## 🎨 Design System

### Brand Colors

- **Primary**: `#1B4A25` (Deep Forest Green)
- **Accent**: `#C2620A` (Warm Amber)
- **Success**: `#10B981`
- **Warning**: `#F59E0B`
- **Error**: `#EF4444`

### Typography

- IBM Plex Sans (system default with Material Design 3)
- Large touch targets: 56px minimum height
- High contrast for outdoor visibility

### UX Principles

1. **One-handed operation** - Critical actions in bottom 60% of screen
2. **Number pad auto-shows** for all measurement inputs
3. **Auto-advance** after G2 entry to next log
4. **Offline-first** - No blocking "connect to internet" screens
5. **Immediate feedback** - Toast + haptic on every action
6. **Color-coded status** - Visual, not just text

---

## 🔐 Security & Privacy

- **Row Level Security (RLS)** enabled on all Supabase tables
- Each user can only see their own data
- **Passwords hashed** by Supabase Auth (bcrypt)
- **JWT tokens** for session management
- **Secure Storage** via Expo SecureStore
- **HTTPS** for all API calls

---

## 🧪 Testing (To Be Added)

### Running Tests

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e
```

---

## 📚 External Services Setup

### 1. Supabase

1. Create project at https://supabase.com
2. Go to **Project Settings → API**
3. Copy **Project URL** and **anon public** key
4. Run SQL migration in SQL Editor
5. Enable **Email Auth** in Authentication settings

### 2. RevenueCat (Subscriptions)

1. Sign up at https://www.revenuecat.com
2. Create new project
3. Add Android app with package name: `com.timberlogpro.app`
4. Create products in **Products** section:
   - `timberlogpro_monthly` - ₹999/month
   - `timberlogpro_yearly` - ₹8999/year
5. Create offering named "default" and add products
6. Copy **Android SDK Key**
7. Set up Google Play Service Credentials

### 3. Google Play Console

1. Pay $25 one-time developer fee
2. Create new app
3. Fill out Store Listing:
   - App name: **TimberLog Pro**
   - Short description: *Timber log measurement & deal tracking for field teams*
   - Category: **Business**
4. Upload assets (screenshots, feature graphic, icon)
5. Set up pricing: **Free with in-app purchases**
6. Create internal testing track
7. Upload AAB via EAS Submit

### 4. PostHog Analytics (Optional)

1. Sign up at https://posthog.com
2. Create project
3. Copy **API Key**
4. Add to `.env`

---

## 🚢 Deployment Checklist

### Pre-Launch

- [ ] Update `app.json` version numbers
- [ ] Update `eas.json` build profiles
- [ ] Test on real Android devices (various screen sizes)
- [ ] Test offline mode thoroughly
- [ ] Test sync after prolonged offline use
- [ ] Verify Excel exports on device
- [ ] Test WhatsApp/Email sharing
- [ ] Verify subscription purchase flow (sandbox)
- [ ] Test trial expiry behavior
- [ ] Load test with 1000+ log entries

### Assets Needed

- [ ] App Icon 1024x1024 (adaptive icon for Android)
- [ ] Splash Screen 1242x2688
- [ ] Feature Graphic 1024x500
- [ ] Phone Screenshots (1080x1920) - minimum 2, maximum 8
- [ ] Privacy Policy URL
- [ ] Terms of Service URL

### Play Store Listing

- [ ] Complete store listing
- [ ] Set content rating
- [ ] Configure pricing & distribution
- [ ] Add promotional video (optional)
- [ ] Set up app categories
- [ ] Enable pre-registration (optional)

---

## 📊 Database Schema Summary

### Tables

1. **users** - User profiles, subscription status
2. **purchases** - BL records
3. **containers** - Container details with extended fields
4. **log_measurements** - Individual log measurements
5. **suppliers** - Dynamic supplier list per user
6. **countries** - Dynamic country list per user
7. **subscription_events** - Billing audit log
8. **app_config** - Remote feature flags

All tables have **Row Level Security** enabled.

---

## 🧮 Measurement Formulas

```typescript
// CBM (Cubic Meters)
CBM1 = (LE1 × G1 × G1) / 16,000,000
CBM2 = (L × G2 × G2) / 16,000,000

// CFT (Cubic Feet)
CFT = CBM × 35.315

// Average Girth
Avg Girth = (CBM × 35.315) / PCS

// Short CBM (Loss/Gain)
Short CBM = CBM Net (Supplier) - CBM2 (Measured)
```

---

## 🤝 Contributing

This is a production app for TimberLog Pro. For feature requests or bugs, contact support.

---

## 📄 License

Proprietary - All rights reserved

---

## 📞 Support

- **Email**: support@timberlogpro.com
- **WhatsApp**: +91-XXXXXXXXXX
- **Website**: https://timberlogpro.com

---

## 🎯 Roadmap

### v1.0.0 (Launch - MVP)
- Authentication & profiles
- Purchases with extended container fields
- Log measurement with offline support
- Dashboard with KPIs
- Excel & Deal Sheet export
- Subscription via RevenueCat

### v1.1.0 (Q2 2025)
- iOS version
- Barcode scanning for container numbers
- Photo attachments for quality verification
- Team collaboration (multi-user per company)
- Advanced filters and search

### v1.2.0 (Q3 2025)
- WhatsApp notifications for sync
- Voice input for measurements
- AR measurement assistance (camera-based)
- Supplier performance analytics
- Custom report builder

### v2.0.0 (Q4 2025)
- Web dashboard (manager portal)
- Automated deal recommendations
- Market price integration
- Multi-language support
- Enterprise features (SSO, API access)

---

**Built with ❤️ for the timber industry**
