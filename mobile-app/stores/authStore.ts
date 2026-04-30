import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  company_name: string;
  subscription_status: string;
  subscription_plan: string;
  trial_ends_at: string;
  subscription_expires_at: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  
  // Actions
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (fullName: string, companyName: string, username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        set({ session, user: session.user });
        await get().loadProfile();
      }
      
      set({ initialized: true });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ initialized: true });
    }
  },

  signIn: async (username: string, password: string) => {
    set({ loading: true });
    try {
      // First, get the user's email from username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        throw new Error('Invalid username or password');
      }

      // Sign in with Supabase auth
      // Note: We need to use the user's ID as email temporarily
      // In production, you should have a proper email field
      const email = `${username}@timberlog.local`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({ session: data.session, user: data.user });
      await get().loadProfile();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (fullName: string, companyName: string, username: string, password: string) => {
    set({ loading: true });
    try {
      // Create auth user
      const email = `${username}@timberlog.local`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          username,
          company_name: companyName,
        });

      if (profileError) throw profileError;

      // Seed common countries for new user
      const commonCountries = [
        'Ecuador', 'Brazil', 'Indonesia', 'Malaysia', 'Myanmar',
        'Cameroon', 'Gabon', 'Congo', 'Ghana', 'Ivory Coast',
        'Solomon Islands', 'Papua New Guinea', 'Laos', 'Vietnam'
      ];

      await supabase.from('countries').insert(
        commonCountries.map(name => ({
          user_id: authData.user!.id,
          name,
        }))
      );

      set({ session: authData.session, user: authData.user });
      await get().loadProfile();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign up');
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  loadProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      set({ profile: data });
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  },
}));

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.getState().setSession(session);
  useAuthStore.getState().setUser(session?.user || null);
  
  if (session?.user) {
    useAuthStore.getState().loadProfile();
  } else {
    useAuthStore.getState().setProfile(null);
  }
});
