// Supabase Edge Function: revenuecat-webhook
// Handles RevenueCat subscription events and updates user subscription status
//
// Deploy with: supabase functions deploy revenuecat-webhook --no-verify-jwt
// Set env vars:
//   supabase secrets set REVENUECAT_WEBHOOK_TOKEN=<your-shared-secret>
//
// Configure RevenueCat dashboard:
//   - Webhook URL: https://<project-ref>.functions.supabase.co/revenuecat-webhook
//   - Authorization Header: Bearer <your-shared-secret>

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_TOKEN = Deno.env.get('REVENUECAT_WEBHOOK_TOKEN') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

interface RcEvent {
  type: string;
  app_user_id: string;
  product_id?: string;
  period_type?: string;
  expiration_at_ms?: number;
  price?: number;
  currency?: string;
  id?: string;
  store?: string;
  environment?: string;
}

function mapEventToStatus(eventType: string): { status: string; plan?: string } | null {
  switch (eventType) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE':
    case 'UNCANCELLATION':
      return { status: 'active' };
    case 'CANCELLATION':
      return { status: 'cancelled' };
    case 'EXPIRATION':
      return { status: 'expired' };
    case 'BILLING_ISSUE':
      return { status: 'billing_issue' };
    default:
      return null;
  }
}

function planFromProductId(productId?: string): string {
  if (!productId) return 'pro';
  const lower = productId.toLowerCase();
  if (lower.includes('annual') || lower.includes('year')) return 'pro_yearly';
  if (lower.includes('month')) return 'pro_monthly';
  return 'pro';
}

serve(async (req) => {
  // Verify webhook auth
  const auth = req.headers.get('authorization') || '';
  if (WEBHOOK_TOKEN && auth !== `Bearer ${WEBHOOK_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: { event: RcEvent };
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const event = payload.event;
  if (!event || !event.app_user_id) {
    return new Response('Missing event data', { status: 400 });
  }

  const userId = event.app_user_id;
  const mapping = mapEventToStatus(event.type);

  // Log the event regardless
  await supabase.from('subscription_events').insert({
    user_id: userId,
    event_type: event.type,
    plan: planFromProductId(event.product_id),
    amount: event.price ? event.price : null,
    currency: event.currency || 'INR',
    revenuecat_event_id: event.id || null,
  });

  if (mapping) {
    const updates: Record<string, unknown> = {
      subscription_status: mapping.status,
      revenuecat_customer_id: userId,
    };

    if (mapping.status === 'active') {
      updates.subscription_plan = planFromProductId(event.product_id);
      if (event.expiration_at_ms) {
        updates.subscription_expires_at = new Date(event.expiration_at_ms).toISOString();
      }
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Failed to update user:', error);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, type: event.type }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
