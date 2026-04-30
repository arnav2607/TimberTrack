/**
 * Calculation utilities for timber measurements
 */

// Calculate log measurements
export function calculateLog(le1: number, l: number, g1: number, g2: number) {
  const cbm1 = (le1 * g1 * g1) / 16000000;
  const cbm2 = (l * g2 * g2) / 16000000;
  const cft1 = cbm1 * 35.315;
  const cft2 = cbm2 * 35.315;

  return {
    cbm1: Number(cbm1.toFixed(6)),
    cbm2: Number(cbm2.toFixed(6)),
    cft1: Number(cft1.toFixed(6)),
    cft2: Number(cft2.toFixed(6)),
  };
}

// Calculate average girth
export function calculateAvgGirth(cbm: number, pcs: number): number {
  if (pcs === 0) return 0;
  return Number(((cbm * 35.315) / pcs).toFixed(4));
}

// Format number with decimals
export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return value.toFixed(decimals);
}

// Format integer
export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return Math.round(value).toString();
}

// Calculate totals from log measurements
export interface LogMeasurement {
  le1: number;
  l: number;
  g1: number;
  g2: number;
  cbm1: number;
  cbm2: number;
  cft1: number;
  cft2: number;
}

export function calculateTotals(logs: LogMeasurement[]) {
  if (!logs || logs.length === 0) {
    return {
      pieces: 0,
      totalCbm1: 0,
      totalCbm2: 0,
      totalCft1: 0,
      totalCft2: 0,
      avgCbm1: 0,
      avgCbm2: 0,
      avgG1: 0,
      avgG2: 0,
      avgLe1: 0,
      avgL: 0,
    };
  }

  const pieces = logs.length;
  const totalCbm1 = logs.reduce((sum, log) => sum + log.cbm1, 0);
  const totalCbm2 = logs.reduce((sum, log) => sum + log.cbm2, 0);
  const totalCft1 = logs.reduce((sum, log) => sum + log.cft1, 0);
  const totalCft2 = logs.reduce((sum, log) => sum + log.cft2, 0);
  const avgCbm1 = totalCbm1 / pieces;
  const avgCbm2 = totalCbm2 / pieces;
  const avgG1 = logs.reduce((sum, log) => sum + log.g1, 0) / pieces;
  const avgG2 = logs.reduce((sum, log) => sum + log.g2, 0) / pieces;
  const avgLe1 = logs.reduce((sum, log) => sum + log.le1, 0) / pieces;
  const avgL = logs.reduce((sum, log) => sum + log.l, 0) / pieces;

  return {
    pieces,
    totalCbm1: Number(totalCbm1.toFixed(6)),
    totalCbm2: Number(totalCbm2.toFixed(6)),
    totalCft1: Number(totalCft1.toFixed(6)),
    totalCft2: Number(totalCft2.toFixed(6)),
    avgCbm1: Number(avgCbm1.toFixed(6)),
    avgCbm2: Number(avgCbm2.toFixed(6)),
    avgG1: Number(avgG1.toFixed(2)),
    avgG2: Number(avgG2.toFixed(2)),
    avgLe1: Number(avgLe1.toFixed(2)),
    avgL: Number(avgL.toFixed(2)),
  };
}

// Calculate short CBM (supplier declared - measured)
export function calculateShortCbm(cbmNet: number, cbm2Measured: number): number {
  return Number((cbmNet - cbm2Measured).toFixed(4));
}

// Validate measurement input
export function validateMeasurement(le1: string, l: string, g1: string, g2: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const le1Num = parseFloat(le1);
  const lNum = parseFloat(l);
  const g1Num = parseFloat(g1);
  const g2Num = parseFloat(g2);

  if (isNaN(le1Num) || le1Num <= 0) {
    errors.push('LE1 must be a positive number');
  }

  if (isNaN(lNum) || lNum <= 0) {
    errors.push('L must be a positive number');
  }

  if (isNaN(g1Num) || g1Num < 35) {
    errors.push('G1 must be at least 35 cm');
  }

  if (isNaN(g2Num) || g2Num < 35) {
    errors.push('G2 must be at least 35 cm');
  }

  if (g1Num > 0 && g2Num > 0 && Math.abs(g1Num - g2Num) > 20) {
    errors.push('G1 and G2 difference is too large (>20 cm)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Format date for display
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

// Format date for input (YYYY-MM-DD)
export function formatDateForInput(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse number safely
export function parseNumber(value: string | number | null | undefined, fallback: number = 0): number {
  if (typeof value === 'number') return value;
  if (!value) return fallback;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? fallback : parsed;
}
