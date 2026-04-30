import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          username: string;
          company_name: string;
          subscription_status: string;
          subscription_plan: string;
          trial_ends_at: string;
          subscription_expires_at: string | null;
          revenuecat_customer_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          bl_number: string;
          bl_date: string;
          supplier_name: string;
          country: string;
          remarks: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['purchases']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['purchases']['Insert']>;
      };
      containers: {
        Row: {
          id: string;
          purchase_id: string;
          user_id: string;
          sr_no: number;
          container_number: string;
          cbm_gross: number | null;
          cbm_net: number | null;
          pcs_supplier: number | null;
          avg_girth_gross: number | null;
          avg_girth_net: number | null;
          l_avg: number | null;
          quality_supplier: string | null;
          bend_percent: number | null;
          quality_by_us: string | null;
          measurement_date: string | null;
          completed_at: string | null;
          is_loading_complete: boolean;
          loading_complete_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['containers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['containers']['Insert']>;
      };
      log_measurements: {
        Row: {
          id: string;
          container_id: string;
          user_id: string;
          log_number: number;
          le1: number;
          l: number;
          g1: number;
          g2: number;
          cbm1: number;
          cbm2: number;
          cft1: number;
          cft2: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['log_measurements']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['log_measurements']['Insert']>;
      };
      suppliers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['suppliers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>;
      };
      countries: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['countries']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['countries']['Insert']>;
      };
    };
  };
};
