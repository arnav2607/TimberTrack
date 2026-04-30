import { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/authStore';
import { runSync } from '@/services/sync';

const LAST_SYNC_KEY = '@timberlog/last_sync';
const AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 min

export function useSync() {
  const user = useAuthStore((s) => s.user);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load last sync time
  useEffect(() => {
    AsyncStorage.getItem(LAST_SYNC_KEY).then((v) => {
      if (v) setLastSyncAt(parseInt(v, 10));
    });
  }, []);

  const sync = async () => {
    if (!user || syncing) return;
    setSyncing(true);
    setError(null);
    try {
      const result = await runSync(user.id);
      const now = Date.now();
      setLastSyncAt(now);
      await AsyncStorage.setItem(LAST_SYNC_KEY, now.toString());
      if (result.errors.length > 0) {
        setError(result.errors.join(', '));
      }
      return result;
    } catch (e: any) {
      setError(e.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  // Auto-sync when app foregrounds
  useEffect(() => {
    const handleStateChange = (state: AppStateStatus) => {
      if (state === 'active' && user) {
        sync();
      }
    };
    const sub = AppState.addEventListener('change', handleStateChange);
    return () => sub.remove();
  }, [user]);

  // Periodic background sync
  useEffect(() => {
    if (!user) return;
    intervalRef.current = setInterval(() => {
      sync();
    }, AUTO_SYNC_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);

  return { sync, syncing, lastSyncAt, error };
}
