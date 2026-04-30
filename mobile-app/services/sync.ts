import { supabase } from './supabase';
import { database } from '@/db';
import { Q } from '@nozbe/watermelondb';

/**
 * Bidirectional sync between WatermelonDB (local) and Supabase (cloud).
 * Strategy:
 *   1. Push pending local changes to Supabase
 *   2. Pull remote changes (created/updated since last sync) into local DB
 *   3. Mark local_status='synced' on success
 */

interface SyncResult {
  pushed: number;
  pulled: number;
  errors: string[];
}

async function pushPending(userId: string): Promise<{ pushed: number; errors: string[] }> {
  const errors: string[] = [];
  let pushed = 0;

  // 1) Push suppliers
  const pendingSuppliers = await database
    .get('suppliers')
    .query(Q.where('local_status', 'pending'))
    .fetch();
  for (const s of pendingSuppliers) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({ user_id: userId, name: (s as any).name })
        .select()
        .single();
      if (error) throw error;
      await database.write(async () => {
        await s.update((rec: any) => {
          rec.serverId = data.id;
          rec.localStatus = 'synced';
        });
      });
      pushed++;
    } catch (e: any) {
      errors.push(`supplier ${(s as any).name}: ${e.message}`);
    }
  }

  // 2) Push countries
  const pendingCountries = await database
    .get('countries')
    .query(Q.where('local_status', 'pending'))
    .fetch();
  for (const c of pendingCountries) {
    try {
      const { data, error } = await supabase
        .from('countries')
        .insert({ user_id: userId, name: (c as any).name })
        .select()
        .single();
      if (error) throw error;
      await database.write(async () => {
        await c.update((rec: any) => {
          rec.serverId = data.id;
          rec.localStatus = 'synced';
        });
      });
      pushed++;
    } catch (e: any) {
      errors.push(`country ${(c as any).name}: ${e.message}`);
    }
  }

  // 3) Push purchases (with containers)
  const pendingPurchases = await database
    .get('purchases')
    .query(Q.where('local_status', 'pending'))
    .fetch();
  for (const p of pendingPurchases as any[]) {
    try {
      const { data: pData, error: pErr } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          bl_number: p.blNumber,
          bl_date: p.blDate,
          supplier_name: p.supplierName,
          country: p.country,
          remarks: p.remarks || '',
        })
        .select()
        .single();
      if (pErr) throw pErr;

      await database.write(async () => {
        await p.update((rec: any) => {
          rec.serverId = pData.id;
          rec.localStatus = 'synced';
        });
      });
      pushed++;

      // Push child containers
      const containers = await p.containers.fetch();
      for (const c of containers) {
        try {
          const { data: cData, error: cErr } = await supabase
            .from('containers')
            .insert({
              purchase_id: pData.id,
              user_id: userId,
              sr_no: c.srNo,
              container_number: c.containerNumber,
              cbm_gross: c.cbmGross || null,
              cbm_net: c.cbmNet || null,
              pcs_supplier: c.pcsSupplier || null,
              avg_girth_gross: c.avgGirthGross || null,
              avg_girth_net: c.avgGirthNet || null,
              l_avg: c.lAvg || null,
              quality_supplier: c.qualitySupplier || null,
              bend_percent: c.bendPercent || null,
              quality_by_us: c.qualityByUs || null,
              measurement_date: c.measurementDate || null,
              is_loading_complete: c.isLoadingComplete || false,
            })
            .select()
            .single();
          if (cErr) throw cErr;

          await database.write(async () => {
            await c.update((rec: any) => {
              rec.serverId = cData.id;
              rec.localStatus = 'synced';
            });
          });
          pushed++;
        } catch (e: any) {
          errors.push(`container ${c.containerNumber}: ${e.message}`);
        }
      }
    } catch (e: any) {
      errors.push(`purchase ${p.blNumber}: ${e.message}`);
    }
  }

  // 4) Push pending containers (updates to existing containers — completion form, etc.)
  const pendingContainers = await database
    .get('containers')
    .query(Q.where('local_status', 'pending'), Q.where('server_id', Q.notEq(null)))
    .fetch();
  for (const c of pendingContainers as any[]) {
    try {
      const { error } = await supabase
        .from('containers')
        .update({
          bend_percent: c.bendPercent || null,
          quality_by_us: c.qualityByUs || null,
          measurement_date: c.measurementDate || null,
          is_loading_complete: c.isLoadingComplete || false,
          loading_complete_at: c.completedAt ? new Date(c.completedAt).toISOString() : null,
        })
        .eq('id', c.serverId);
      if (error) throw error;
      await database.write(async () => {
        await c.update((rec: any) => { rec.localStatus = 'synced'; });
      });
      pushed++;
    } catch (e: any) {
      errors.push(`container update ${c.containerNumber}: ${e.message}`);
    }
  }

  // 5) Push log measurements
  const pendingLogs = await database
    .get('log_measurements')
    .query(Q.where('local_status', 'pending'))
    .fetch();
  for (const log of pendingLogs as any[]) {
    try {
      // Resolve container's serverId
      const container = await database.get('containers').find(log.containerId);
      const containerServerId = (container as any).serverId;
      if (!containerServerId) continue; // wait for parent to sync first

      const { data, error } = await supabase
        .from('log_measurements')
        .insert({
          container_id: containerServerId,
          user_id: userId,
          log_number: log.logNumber,
          le1: log.le1,
          l: log.l,
          g1: log.g1,
          g2: log.g2,
          cbm1: log.cbm1,
          cbm2: log.cbm2,
          cft1: log.cft1,
          cft2: log.cft2,
        })
        .select()
        .single();
      if (error) throw error;
      await database.write(async () => {
        await log.update((rec: any) => {
          rec.serverId = data.id;
          rec.localStatus = 'synced';
        });
      });
      pushed++;
    } catch (e: any) {
      errors.push(`log ${log.logNumber}: ${e.message}`);
    }
  }

  return { pushed, errors };
}

async function pullRemote(userId: string): Promise<{ pulled: number; errors: string[] }> {
  const errors: string[] = [];
  let pulled = 0;

  try {
    // Pull suppliers
    const { data: remoteSuppliers, error: sErr } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', userId);
    if (sErr) throw sErr;

    const localSuppliers = await database.get('suppliers').query().fetch();
    const localSupplierServerIds = new Set(
      localSuppliers.map((s: any) => s.serverId).filter(Boolean)
    );

    await database.write(async () => {
      for (const rs of remoteSuppliers || []) {
        if (!localSupplierServerIds.has(rs.id)) {
          await database.get('suppliers').create((s: any) => {
            s.serverId = rs.id;
            s.name = rs.name;
            s.localStatus = 'synced';
          });
          pulled++;
        }
      }
    });

    // Pull countries
    const { data: remoteCountries, error: cErr } = await supabase
      .from('countries')
      .select('*')
      .eq('user_id', userId);
    if (cErr) throw cErr;

    const localCountries = await database.get('countries').query().fetch();
    const localCountryServerIds = new Set(
      localCountries.map((c: any) => c.serverId).filter(Boolean)
    );

    await database.write(async () => {
      for (const rc of remoteCountries || []) {
        if (!localCountryServerIds.has(rc.id)) {
          await database.get('countries').create((c: any) => {
            c.serverId = rc.id;
            c.name = rc.name;
            c.localStatus = 'synced';
          });
          pulled++;
        }
      }
    });

    // Pull purchases + containers
    const { data: remotePurchases, error: pErr } = await supabase
      .from('purchases')
      .select('*, containers(*)')
      .eq('user_id', userId);
    if (pErr) throw pErr;

    const localPurchases = await database.get('purchases').query().fetch();
    const localPurchaseServerIds = new Set(
      localPurchases.map((p: any) => p.serverId).filter(Boolean)
    );

    await database.write(async () => {
      for (const rp of remotePurchases || []) {
        if (!localPurchaseServerIds.has(rp.id)) {
          const newPurchase = await database.get('purchases').create((p: any) => {
            p.serverId = rp.id;
            p.blNumber = rp.bl_number;
            p.blDate = rp.bl_date;
            p.supplierName = rp.supplier_name;
            p.country = rp.country;
            p.remarks = rp.remarks || '';
            p.localStatus = 'synced';
          });
          pulled++;

          for (const rc of rp.containers || []) {
            await database.get('containers').create((c: any) => {
              c.serverId = rc.id;
              c.purchaseId = newPurchase.id;
              c.srNo = rc.sr_no;
              c.containerNumber = rc.container_number;
              c.cbmGross = rc.cbm_gross || 0;
              c.cbmNet = rc.cbm_net || 0;
              c.pcsSupplier = rc.pcs_supplier || 0;
              c.avgGirthGross = rc.avg_girth_gross || 0;
              c.avgGirthNet = rc.avg_girth_net || 0;
              c.lAvg = rc.l_avg || 0;
              c.qualitySupplier = rc.quality_supplier || '';
              c.bendPercent = rc.bend_percent || 0;
              c.qualityByUs = rc.quality_by_us || '';
              c.measurementDate = rc.measurement_date || '';
              c.isLoadingComplete = rc.is_loading_complete || false;
              c.completedAt = rc.loading_complete_at ? new Date(rc.loading_complete_at).getTime() : 0;
              c.localStatus = 'synced';
            });
            pulled++;
          }
        }
      }
    });
  } catch (e: any) {
    errors.push(`pull failed: ${e.message}`);
  }

  return { pulled, errors };
}

export async function runSync(userId: string): Promise<SyncResult> {
  const pushResult = await pushPending(userId);
  const pullResult = await pullRemote(userId);

  return {
    pushed: pushResult.pushed,
    pulled: pullResult.pulled,
    errors: [...pushResult.errors, ...pullResult.errors],
  };
}
