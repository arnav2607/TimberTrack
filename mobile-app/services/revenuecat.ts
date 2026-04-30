import { Platform } from 'react-native';
import Purchases, { PurchasesOffering, CustomerInfo, PurchasesPackage } from 'react-native-purchases';

const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';

let initialized = false;

export async function initRevenueCat(userId?: string) {
  if (initialized) return;
  if (Platform.OS === 'web') {
    // RevenueCat react-native SDK doesn't support web; skip silently
    return;
  }

  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
  if (!apiKey) {
    console.warn('[RevenueCat] No API key configured — skipping init.');
    return;
  }

  try {
    Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
    await Purchases.configure({ apiKey, appUserID: userId });
    initialized = true;
  } catch (e) {
    console.error('[RevenueCat] init failed:', e);
  }
}

export async function loginRevenueCat(userId: string) {
  if (Platform.OS === 'web' || !initialized) return;
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.error('[RevenueCat] login failed:', e);
  }
}

export async function logoutRevenueCat() {
  if (Platform.OS === 'web' || !initialized) return;
  try {
    await Purchases.logOut();
  } catch (e) {
    console.error('[RevenueCat] logout failed:', e);
  }
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (Platform.OS === 'web' || !initialized) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.error('[RevenueCat] getOfferings failed:', e);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  if (Platform.OS === 'web' || !initialized) {
    throw new Error('Purchases unavailable on this platform');
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (e: any) {
    if (e.userCancelled) return null;
    throw e;
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (Platform.OS === 'web' || !initialized) return null;
  try {
    return await Purchases.restorePurchases();
  } catch (e) {
    console.error('[RevenueCat] restore failed:', e);
    return null;
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (Platform.OS === 'web' || !initialized) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (e) {
    console.error('[RevenueCat] getCustomerInfo failed:', e);
    return null;
  }
}

export function hasActiveEntitlement(info: CustomerInfo | null, entitlementId: string = 'pro'): boolean {
  if (!info) return false;
  return info.entitlements.active[entitlementId] !== undefined;
}
