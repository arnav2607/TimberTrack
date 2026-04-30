import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { formatDate, formatNumber, calculateTotals } from '@/utils/calculations';
import { database } from '@/db';
import { Q } from '@nozbe/watermelondb';

interface DealSheetRow {
  'BL No': string;
  'BL Date': string;
  'Supplier': string;
  'Country': string;
  'Sr.': number;
  'Container No': string;
  'CBM Gross': string;
  'CBM Net': string;
  'PCS (Supplier)': string;
  'Avg Girth Gross': string;
  'Avg Girth Net': string;
  'L Avg': string;
  'Quality (Supplier)': string;
  'Measured PCS': string;
  'Measured CBM1': string;
  'Measured CBM2': string;
  'Avg G1': string;
  'Avg G2': string;
  'Bend %': string;
  'Quality (Us)': string;
  'Status': string;
  'Loaded On': string;
}

async function buildRows(purchases: any[]): Promise<DealSheetRow[]> {
  const rows: DealSheetRow[] = [];
  const logsCollection = database.get('log_measurements');

  for (const p of purchases) {
    const containers = p.containers || [];
    if (containers.length === 0) {
      rows.push({
        'BL No': p.blNumber,
        'BL Date': formatDate(p.blDate),
        'Supplier': p.supplierName,
        'Country': p.country,
        'Sr.': 0,
        'Container No': '',
        'CBM Gross': '', 'CBM Net': '', 'PCS (Supplier)': '',
        'Avg Girth Gross': '', 'Avg Girth Net': '', 'L Avg': '',
        'Quality (Supplier)': '', 'Measured PCS': '', 'Measured CBM1': '',
        'Measured CBM2': '', 'Avg G1': '', 'Avg G2': '', 'Bend %': '',
        'Quality (Us)': '', 'Status': 'No Containers', 'Loaded On': '',
      });
      continue;
    }

    for (const c of containers) {
      // Fetch logs for this container
      const logs = await logsCollection.query(Q.where('container_id', c.id)).fetch();
      const totals = calculateTotals(
        logs.map((l: any) => ({
          le1: l.le1, l: l.l, g1: l.g1, g2: l.g2,
          cbm1: l.cbm1, cbm2: l.cbm2, cft1: l.cft1, cft2: l.cft2,
        }))
      );

      rows.push({
        'BL No': p.blNumber,
        'BL Date': formatDate(p.blDate),
        'Supplier': p.supplierName,
        'Country': p.country,
        'Sr.': c.srNo || 0,
        'Container No': c.containerNumber || '',
        'CBM Gross': formatNumber(c.cbmGross, 4),
        'CBM Net': formatNumber(c.cbmNet, 4),
        'PCS (Supplier)': c.pcsSupplier?.toString() || '',
        'Avg Girth Gross': formatNumber(c.avgGirthGross, 4),
        'Avg Girth Net': formatNumber(c.avgGirthNet, 4),
        'L Avg': formatNumber(c.lAvg, 2),
        'Quality (Supplier)': c.qualitySupplier || '',
        'Measured PCS': totals.pieces.toString(),
        'Measured CBM1': formatNumber(totals.totalCbm1, 4),
        'Measured CBM2': formatNumber(totals.totalCbm2, 4),
        'Avg G1': formatNumber(totals.avgG1, 2),
        'Avg G2': formatNumber(totals.avgG2, 2),
        'Bend %': formatNumber(c.bendPercent, 2),
        'Quality (Us)': c.qualityByUs || '',
        'Status': c.isLoadingComplete ? 'Completed' : 'Pending',
        'Loaded On': c.completedAt ? formatDate(new Date(c.completedAt).toISOString()) : '',
      });
    }
  }

  return rows;
}

export async function exportDealSheet(purchases: any[], companyName: string) {
  if (!purchases || purchases.length === 0) {
    throw new Error('No purchases to export');
  }

  const rows = await buildRows(purchases);

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Header rows for company info
  const meta = [
    [`${companyName} — Deal Sheet`],
    [`Generated: ${new Date().toLocaleString()}`],
    [`Total BLs: ${purchases.length}`],
    [],
  ];
  const ws = XLSX.utils.aoa_to_sheet(meta);
  XLSX.utils.sheet_add_json(ws, rows, { origin: 'A5', skipHeader: false });

  // Column widths
  ws['!cols'] = Array(22).fill({ wch: 15 });

  XLSX.utils.book_append_sheet(workbook, ws, 'Deal Sheet');

  // Summary sheet
  const totalCbmGross = purchases.reduce((s: number, p: any) =>
    s + (p.containers || []).reduce((cs: number, c: any) => cs + (c.cbmGross || 0), 0), 0);
  const totalCbmNet = purchases.reduce((s: number, p: any) =>
    s + (p.containers || []).reduce((cs: number, c: any) => cs + (c.cbmNet || 0), 0), 0);
  const totalContainers = purchases.reduce((s: number, p: any) => s + (p.containers || []).length, 0);
  const completedContainers = purchases.reduce((s: number, p: any) =>
    s + (p.containers || []).filter((c: any) => c.isLoadingComplete).length, 0);

  const summary = [
    ['Summary'],
    [],
    ['Total BLs', purchases.length],
    ['Total Containers', totalContainers],
    ['Completed Containers', completedContainers],
    ['Pending Containers', totalContainers - completedContainers],
    ['Total CBM Gross', formatNumber(totalCbmGross, 4)],
    ['Total CBM Net', formatNumber(totalCbmNet, 4)],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summary);
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');

  // Generate file
  const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `DealSheet_${ts}.xlsx`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Share
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Share Deal Sheet',
      UTI: 'com.microsoft.excel.xlsx',
    });
  } else if (Platform.OS === 'web') {
    // Web fallback
    const blob = new Blob([Buffer.from(wbout, 'base64')], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return fileUri;
}
