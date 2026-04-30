import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

export function useAuth() {
  const auth = useAuthStore();

  useEffect(() => {
    if (!auth.initialized) {
      auth.initialize();
    }
  }, [auth.initialized]);

  return {
    user: auth.user,
    profile: auth.profile,
    session: auth.session,
    loading: auth.loading,
    isAuthenticated: !!auth.session,
    signIn: auth.signIn,
    signUp: auth.signUp,
    signOut: auth.signOut,
  };
}

export function useSubscription() {
  const profile = useAuthStore((state) => state.profile);

  const isTrialActive = () => {
    if (!profile) return false;
    if (profile.subscription_status !== 'trial') return false;
    return new Date(profile.trial_ends_at) > new Date();
  };

  const isSubscriptionActive = () => {
    if (!profile) return false;
    if (profile.subscription_status === 'active') return true;
    return isTrialActive();
  };

  const daysRemainingInTrial = () => {
    if (!profile || profile.subscription_status !== 'trial') return 0;
    const trialEnd = new Date(profile.trial_ends_at);
    const now = new Date();
    const diff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const canAccessFeature = (feature: 'export' | 'unlimited_bls' | 'deal_sheet') => {
    if (!profile) return false;
    
    // Trial and active subscriptions have full access
    if (profile.subscription_status === 'active' || isTrialActive()) {
      return true;
    }

    // Free/expired users have no access to premium features
    return false;
  };

  return {
    subscriptionStatus: profile?.subscription_status || 'free',
    subscriptionPlan: profile?.subscription_plan || 'free',
    isActive: isSubscriptionActive(),
    isTrial: isTrialActive(),
    daysRemaining: daysRemainingInTrial(),
    canAccessFeature,
  };
}
