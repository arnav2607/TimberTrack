import { create } from 'zustand';
import { database } from '@/db';
import { supabase } from '@/services/supabase';
import { calculateAvgGirth } from '@/utils/calculations';
import { Q } from '@nozbe/watermelondb';

interface Container {
  id?: string;
  srNo: number;
  containerNumber: string;
  cbmGross?: number;
  cbmNet?: number;
  pcsSupplier?: number;
  lAvg?: number;
  qualitySupplier?: string;
}

interface PurchaseFormData {
  blNumber: string;
  blDate: string;
  supplierName: string;
  country: string;
  remarks?: string;
  containers: Container[];
}

interface PurchasesState {
  purchases: any[];
  suppliers: any[];
  countries: any[];
  loading: boolean;
  syncing: boolean;

  // Actions
  loadPurchases: () => Promise<void>;
  loadSuppliers: () => Promise<void>;
  loadCountries: () => Promise<void>;
  createPurchase: (data: PurchaseFormData) => Promise<void>;
  updatePurchase: (id: string, data: Partial<PurchaseFormData>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  addSupplier: (name: string) => Promise<void>;
  addCountry: (name: string) => Promise<void>;
  seedCountries: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

export const usePurchasesStore = create<PurchasesState>((set, get) => ({
  purchases: [],
  suppliers: [],
  countries: [],
  loading: false,
  syncing: false,

  loadPurchases: async () => {
    set({ loading: true });
    try {
      const purchasesCollection = database.get('purchases');
      const purchases = await purchasesCollection.query().fetch();
      
      // Load containers for each purchase
      const purchasesWithContainers = await Promise.all(
        purchases.map(async (p: any) => {
          const containers = await p.containers.fetch();
          return {
            id: p.id,
            serverId: p.serverId,
            blNumber: p.blNumber,
            blDate: p.blDate,
            supplierName: p.supplierName,
            country: p.country,
            remarks: p.remarks,
            localStatus: p.localStatus,
            createdAt: p.createdAt,
            containers: containers.map((c: any) => ({
              id: c.id,
              serverId: c.serverId,
              srNo: c.srNo,
              containerNumber: c.containerNumber,
              cbmGross: c.cbmGross,
              cbmNet: c.cbmNet,
              pcsSupplier: c.pcsSupplier,
              avgGirthGross: c.avgGirthGross,
              avgGirthNet: c.avgGirthNet,
              lAvg: c.lAvg,
              qualitySupplier: c.qualitySupplier,
              bendPercent: c.bendPercent,
              qualityByUs: c.qualityByUs,
              measurementDate: c.measurementDate,
              isLoadingComplete: c.isLoadingComplete,
              completedAt: c.completedAt,
              localStatus: c.localStatus,
            })),
          };
        })
      );
      
      set({ purchases: purchasesWithContainers });
    } catch (error) {
      console.error('Failed to load purchases:', error);
    } finally {
      set({ loading: false });
    }
  },

  loadSuppliers: async () => {
    try {
      const suppliersCollection = database.get('suppliers');
      const suppliers = await suppliersCollection.query().fetch();
      set({ suppliers: suppliers.map((s: any) => ({ id: s.id, name: s.name })) });
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  },

  loadCountries: async () => {
    try {
      const countriesCollection = database.get('countries');
      const countries = await countriesCollection.query().fetch();
      
      if (countries.length === 0) {
        await get().seedCountries();
      } else {
        set({ countries: countries.map((c: any) => ({ id: c.id, name: c.name })) });
      }
    } catch (error) {
      console.error('Failed to load countries:', error);
    }
  },

  createPurchase: async (data) => {
    try {
      await database.write(async () => {
        const purchasesCollection = database.get('purchases');
        const containersCollection = database.get('containers');

        const purchase = await purchasesCollection.create((p: any) => {
          p.blNumber = data.blNumber;
          p.blDate = data.blDate;
          p.supplierName = data.supplierName;
          p.country = data.country;
          p.remarks = data.remarks || '';
          p.localStatus = 'pending';
        });

        // Create containers
        for (let i = 0; i < data.containers.length; i++) {
          const c = data.containers[i];
          const avgGirthGross = c.cbmGross && c.pcsSupplier 
            ? calculateAvgGirth(c.cbmGross, c.pcsSupplier) 
            : 0;
          const avgGirthNet = c.cbmNet && c.pcsSupplier 
            ? calculateAvgGirth(c.cbmNet, c.pcsSupplier) 
            : 0;

          await containersCollection.create((container: any) => {
            container.purchaseId = purchase.id;
            container.srNo = i + 1;
            container.containerNumber = c.containerNumber;
            container.cbmGross = c.cbmGross || 0;
            container.cbmNet = c.cbmNet || 0;
            container.pcsSupplier = c.pcsSupplier || 0;
            container.avgGirthGross = avgGirthGross;
            container.avgGirthNet = avgGirthNet;
            container.lAvg = c.lAvg || 0;
            container.qualitySupplier = c.qualitySupplier || '';
            container.isLoadingComplete = false;
            container.localStatus = 'pending';
          });
        }
      });

      await get().loadPurchases();
      // Sync handled by useSync hook (auto + manual)
    } catch (error) {
      console.error('Failed to create purchase:', error);
      throw error;
    }
  },

  updatePurchase: async (id, data) => {
    // Implementation for updates
    console.log('Update purchase:', id, data);
  },

  deletePurchase: async (id) => {
    try {
      await database.write(async () => {
        const purchase = await database.get('purchases').find(id);
        await purchase.markAsDeleted();
      });
      await get().loadPurchases();
    } catch (error) {
      console.error('Failed to delete purchase:', error);
      throw error;
    }
  },

  addSupplier: async (name) => {
    try {
      await database.write(async () => {
        const suppliersCollection = database.get('suppliers');
        await suppliersCollection.create((s: any) => {
          s.name = name;
          s.localStatus = 'pending';
        });
      });
      await get().loadSuppliers();
      await get().syncWithServer();
    } catch (error) {
      console.error('Failed to add supplier:', error);
      throw error;
    }
  },

  addCountry: async (name) => {
    try {
      await database.write(async () => {
        const countriesCollection = database.get('countries');
        await countriesCollection.create((c: any) => {
          c.name = name;
          c.localStatus = 'pending';
        });
      });
      await get().loadCountries();
    } catch (error) {
      console.error('Failed to add country:', error);
      throw error;
    }
  },

  seedCountries: async () => {
    const commonCountries = [
      'Ecuador', 'Brazil', 'Indonesia', 'Malaysia', 'Myanmar',
      'Cameroon', 'Gabon', 'Congo', 'Ghana', 'Ivory Coast',
      'Solomon Islands', 'Papua New Guinea', 'Laos', 'Vietnam',
    ];

    try {
      await database.write(async () => {
        const countriesCollection = database.get('countries');
        for (const name of commonCountries) {
          await countriesCollection.create((c: any) => {
            c.name = name;
            c.localStatus = 'synced';
          });
        }
      });
      await get().loadCountries();
    } catch (error) {
      console.error('Failed to seed countries:', error);
    }
  },

  syncWithServer: async () => {
    // Deprecated in favour of useSync() hook + services/sync.ts.
    // Kept for store interface stability — no-op.
    return;
  },
}));
