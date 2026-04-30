# TimberLog Pro — Setup & Run Guide

This document explains how to run, build and deploy TimberLog Pro after the agent's
full code-only build. The codebase is in `/app/mobile-app`.

## 1. Prerequisites

- Node.js 18+
- Yarn 1.x
- An Android device/emulator OR iOS device + Mac with Xcode (for native builds)
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- A Supabase account (free tier is fine)
- A RevenueCat account (free tier) — optional, only for paid subscriptions
- A PostHog account — optional, only for analytics

## 2. WatermelonDB & Expo

WatermelonDB requires native modules. **It does NOT work in plain Expo Go.**
You have two options:

### Option A — Use Expo Dev Client (recommended)

```bash
cd /app/mobile-app
yarn install
yarn add expo-dev-client
npx expo prebuild         # generates ios/ and android/ folders
yarn android              # or yarn ios
```

### Option B — Use EAS Build for cloud builds

```bash
eas login
eas build --platform android --profile development
# Install the resulting APK on your device
eas build --platform android --profile production  # for Play Store
```

## 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your real Supabase URL, anon key, RevenueCat keys, PostHog key.
```

> Note: All `EXPO_PUBLIC_*` vars are bundled into the app at build time.
> Do NOT put secrets here — only public/anon keys.

## 4. Set Up Supabase

1. Go to https://supabase.com and create a new project.
2. In the SQL editor, paste & run `supabase/migrations/001_initial_schema.sql`.
3. In Authentication → Providers, **disable email confirmation** (the app uses
   `<username>@timberlog.local` synthetic emails internally).
4. Copy the `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`.
5. Copy the `anon` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
6. Copy the `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-side only).

## 5. Deploy the RevenueCat Webhook (optional — for live subscriptions)

```bash
# Install Supabase CLI
brew install supabase/tap/supabase   # macOS
# or follow https://supabase.com/docs/guides/cli

supabase login
supabase link --project-ref <your-project-ref>

# Set secrets (only the function can read these)
supabase secrets set REVENUECAT_WEBHOOK_TOKEN=$(openssl rand -hex 32)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Deploy
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

In **RevenueCat dashboard → Project settings → Integrations → Webhooks**:
- URL: `https://<project-ref>.functions.supabase.co/revenuecat-webhook`
- Authorization Header: `Bearer <REVENUECAT_WEBHOOK_TOKEN>`

## 6. RevenueCat Product Setup

1. Create products in Google Play Console / App Store Connect (e.g. `pro_monthly`,
   `pro_annual`).
2. In RevenueCat → Products, link those store products.
3. In RevenueCat → Entitlements, create `pro` entitlement and attach the products.
4. In RevenueCat → Offerings, create `default` offering with both packages.
5. Copy the Android SDK key → `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
6. Copy the iOS SDK key → `EXPO_PUBLIC_REVENUECAT_IOS_KEY`.

## 7. Build for Production (Play Store)

```bash
# 1. Configure EAS
eas login
eas build:configure

# 2. Build AAB
eas build --platform android --profile production

# 3. Submit to Play Store
eas submit --platform android --latest
```

See `PLAYSTORE_SETUP.md` for full Play Console setup.

## 8. Smoke Test

After installing on a device:

1. **Sign Up** → create account → trial (14 days) auto-activates
2. **Add Purchase** → BL number, supplier, country, container(s)
3. **Measure** → tap container → enter LE1, L, G1, G2 → save → verify auto-advance
4. **Complete** → tap top-right complete icon → fill bend %, quality → mark complete
5. **Dashboard** → verify KPIs update, filters work
6. **Export** → tap Excel icon → file shared via system share sheet
7. **Sync** → tap sync icon → check last sync time updates
8. **Settings → Upgrade** → opens paywall (will show "subscriptions not configured" if
   RevenueCat not yet wired up)

## 9. Architecture

```
mobile-app/
├── app/                       # Expo Router file-based routes
│   ├── (auth)/                #   — login, signup
│   ├── (tabs)/                #   — purchases, measure, dashboard, settings
│   │   ├── purchases/         #     list, add, [id] (detail)
│   │   ├── measure/           #     index, containers, feed, complete
│   │   ├── dashboard/         #     KPI dashboard
│   │   └── settings/          #     profile, sub status, sync, sign-out
│   ├── paywall.tsx            # RevenueCat purchase screen
│   └── _layout.tsx            # Root: PaperProvider + redirect logic
│
├── db/                        # WatermelonDB (offline-first SQLite)
│   ├── schema.ts              # Tables & columns
│   └── models/                # Decorated TS classes
│
├── stores/                    # Zustand state
│   ├── authStore.ts           # session, profile
│   ├── purchasesStore.ts      # purchases CRUD (local DB)
│   └── measurementsStore.ts   # log measurements per container
│
├── hooks/                     # Custom hooks
│   ├── useAuth.ts             # auth + subscription
│   └── useSync.ts             # cloud sync (auto + manual)
│
├── services/                  # Side-effect services
│   ├── supabase.ts            # supabase client
│   ├── sync.ts                # bidirectional sync engine
│   ├── excel.ts               # XLSX deal-sheet export + share
│   ├── revenuecat.ts          # subscription SDK wrapper
│   └── analytics.ts           # PostHog wrapper
│
├── theme/                     # colours, spacing, typography
├── utils/calculations.ts      # CBM/CFT/avg girth/log calcs
└── supabase/
    ├── migrations/            # SQL schema
    └── functions/             # Edge functions (revenuecat webhook)
```

## 10. What's Live vs Stubbed

| Feature | Status |
|---|---|
| Auth (signup/login/logout) | ✅ Live (Supabase) |
| Purchases CRUD (local) | ✅ Live (WatermelonDB) |
| Measurements entry + auto-advance | ✅ Live |
| Container completion form | ✅ Live |
| Dashboard KPIs + filters | ✅ Live |
| Excel deal-sheet export | ✅ Live (XLSX + expo-sharing) |
| Cloud sync (push + pull) | ✅ Live (Supabase) |
| RevenueCat paywall UI | ✅ Live UI; needs RC keys + products to function |
| Subscription webhook | ✅ Edge function ready; deploy to activate |
| PostHog analytics | ✅ Wired; needs key |

## 11. Known Caveats

- **Supabase signup** uses synthetic email `<username>@timberlog.local`. You **must
  disable email confirmation** in Supabase auth settings.
- **WatermelonDB** does not work in plain Expo Go. Use Expo Dev Client.
- **Excel export** uses base64 + expo-sharing; on Web it falls back to a download.
- The **Free tier hard caps** (max 3 BLs / 10 containers) are NOT enforced
  client-side yet — the paywall hook reads `subscription_status`, but you should add
  enforcement in `purchasesStore.createPurchase` if needed.

## 12. Where to Edit

- Add a new KPI → `app/(tabs)/dashboard/index.tsx` `kpis` useMemo
- Tweak Excel columns → `services/excel.ts` `buildRows`
- Change paywall copy → `app/paywall.tsx` `FEATURES` array
- Add a new entitlement gate → `hooks/useAuth.ts` `canAccessFeature`
