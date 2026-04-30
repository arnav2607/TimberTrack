import { create } from 'zustand';
import { database } from '@/db';
import { Q } from '@nozbe/watermelondb';
import { calculateLog } from '@/utils/calculations';

export interface LogRow {
  id?: string;
  logNumber: number;
  le1: number;
  l: number;
  g1: number;
  g2: number;
  cbm1: number;
  cbm2: number;
  cft1: number;
  cft2: number;
}

interface MeasurementsState {
  logsByContainer: Record<string, LogRow[]>;
  loading: boolean;
  loadLogs: (containerId: string) => Promise<void>;
  saveLog: (containerId: string, le1: number, l: number, g1: number, g2: number) => Promise<LogRow>;
  deleteLog: (containerId: string, logId: string) => Promise<void>;
  completeContainer: (
    containerId: string,
    payload: { bendPercent?: number; qualityByUs?: string; measurementDate?: string }
  ) => Promise<void>;
  reopenContainer: (containerId: string) => Promise<void>;
}

export const useMeasurementsStore = create<MeasurementsState>((set, get) => ({
  logsByContainer: {},
  loading: false,

  loadLogs: async (containerId) => {
    set({ loading: true });
    try {
      const logs = await database
        .get('log_measurements')
        .query(Q.where('container_id', containerId))
        .fetch();
      const rows: LogRow[] = logs.map((l: any) => ({
        id: l.id,
        logNumber: l.logNumber,
        le1: l.le1,
        l: l.l,
        g1: l.g1,
        g2: l.g2,
        cbm1: l.cbm1,
        cbm2: l.cbm2,
        cft1: l.cft1,
        cft2: l.cft2,
      }));
      rows.sort((a, b) => a.logNumber - b.logNumber);
      set({
        logsByContainer: { ...get().logsByContainer, [containerId]: rows },
      });
    } finally {
      set({ loading: false });
    }
  },

  saveLog: async (containerId, le1, l, g1, g2) => {
    const calc = calculateLog(le1, l, g1, g2);
    const existing = get().logsByContainer[containerId] || [];
    const logNumber = existing.length + 1;

    let createdId = '';
    await database.write(async () => {
      const created = await database.get('log_measurements').create((rec: any) => {
        rec.containerId = containerId;
        rec.logNumber = logNumber;
        rec.le1 = le1;
        rec.l = l;
        rec.g1 = g1;
        rec.g2 = g2;
        rec.cbm1 = calc.cbm1;
        rec.cbm2 = calc.cbm2;
        rec.cft1 = calc.cft1;
        rec.cft2 = calc.cft2;
        rec.localStatus = 'pending';
      });
      createdId = created.id;
    });

    const newRow: LogRow = {
      id: createdId,
      logNumber,
      le1, l, g1, g2,
      cbm1: calc.cbm1,
      cbm2: calc.cbm2,
      cft1: calc.cft1,
      cft2: calc.cft2,
    };
    set({
      logsByContainer: {
        ...get().logsByContainer,
        [containerId]: [...existing, newRow],
      },
    });
    return newRow;
  },

  deleteLog: async (containerId, logId) => {
    await database.write(async () => {
      const log = await database.get('log_measurements').find(logId);
      await log.markAsDeleted();
    });
    const existing = get().logsByContainer[containerId] || [];
    set({
      logsByContainer: {
        ...get().logsByContainer,
        [containerId]: existing.filter((l) => l.id !== logId),
      },
    });
  },

  completeContainer: async (containerId, payload) => {
    await database.write(async () => {
      const container = await database.get('containers').find(containerId);
      await container.update((rec: any) => {
        rec.bendPercent = payload.bendPercent || 0;
        rec.qualityByUs = payload.qualityByUs || '';
        rec.measurementDate = payload.measurementDate || new Date().toISOString().slice(0, 10);
        rec.isLoadingComplete = true;
        rec.completedAt = Date.now();
        rec.localStatus = 'pending';
      });
    });
  },

  reopenContainer: async (containerId) => {
    await database.write(async () => {
      const container = await database.get('containers').find(containerId);
      await container.update((rec: any) => {
        rec.isLoadingComplete = false;
        rec.completedAt = 0;
        rec.localStatus = 'pending';
      });
    });
  },
}));
