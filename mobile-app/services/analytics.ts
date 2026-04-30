import PostHog from 'posthog-react-native';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

let posthog: PostHog | null = null;

export async function initAnalytics() {
  if (!POSTHOG_KEY) {
    console.warn('[Analytics] No PostHog key configured.');
    return;
  }
  try {
    posthog = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      flushAt: 20,
      flushInterval: 10000,
    });
  } catch (e) {
    console.error('[Analytics] init failed:', e);
  }
}

export function track(event: string, props?: Record<string, any>) {
  if (!posthog) return;
  try {
    posthog.capture(event, props);
  } catch (e) {
    /* swallow */
  }
}

export function identify(userId: string, traits?: Record<string, any>) {
  if (!posthog) return;
  try {
    posthog.identify(userId, traits);
  } catch (e) {
    /* swallow */
  }
}

export function reset() {
  if (!posthog) return;
  try {
    posthog.reset();
  } catch (e) {
    /* swallow */
  }
}
