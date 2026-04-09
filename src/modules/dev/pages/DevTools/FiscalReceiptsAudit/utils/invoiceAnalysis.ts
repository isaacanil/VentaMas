import {
  canonicalizeNcf,
  looseCanonicalizeNcf,
  parseInvoiceDate,
  sanitizeNcf,
} from './ncfUtils';

interface RawInvoice {
  id?: string;
  NCF?: unknown;
  numberID?: unknown;
  date?: unknown;
  status?: unknown;
  data?: {
    NCF?: unknown;
    numberID?: unknown;
    date?: unknown;
    status?: unknown;
  };
}

interface InvoiceEntry {
  invoiceId: string;
  invoiceNumber: string;
  ncf: string;
  canonical: string;
  looseCanonical: string;
  date: Date | null;
  status: string;
  length: number;
}

interface LengthStat {
  length: number;
  count: number;
  firstDate: Date | null;
  lastDate: Date | null;
  missingDateCount: number;
}

interface LengthChangeEvent {
  fromLength: number;
  toLength: number;
  date: Date;
  invoiceNumber: string;
  ncf: string;
  previousInvoiceNumber: string;
  previousDate: Date;
}

interface DuplicateGroup {
  ncf: string;
  count: number;
  occurrences: InvoiceEntry[];
}

interface NormalizedGroup {
  canonical: string;
  count: number;
  distinctNcfs: number;
  occurrences: InvoiceEntry[];
}

interface LooseGroup {
  looseCanonical: string;
  count: number;
  distinctNcfs: number;
  occurrences: InvoiceEntry[];
}

export interface InvoiceAnalysisResult {
  totalInvoices: number;
  invoicesWithNcf: number;
  missingNcf: number;
  skippedWithoutDate: number;
  ncfLengthStats: LengthStat[];
  lengthChangeEvents: LengthChangeEvent[];
  duplicates: DuplicateGroup[];
  duplicatesNormalized: NormalizedGroup[];
  zeroCollapsedDuplicates: LooseGroup[];
  uniqueNcfCount: number;
  observedLengths: number[];
  currentLength: number | null;
  non11Count: number;
}

export const analyzeInvoices = (
  invoices: RawInvoice[],
): InvoiceAnalysisResult => {
  let invoicesWithNcf = 0;
  let missingNcf = 0;
  let skippedWithoutDate = 0;
  const lengthStatsMap = new Map<number, LengthStat>();
  const duplicatesMap = new Map<string, DuplicateGroup>();
  const normalizedMap = new Map<string, NormalizedGroup>();
  const looseMap = new Map<string, LooseGroup>();
  const timelineEntries: InvoiceEntry[] = [];
  let non11Count = 0;

  invoices.forEach((invoice) => {
    const invoiceData = invoice?.data || {};
    const rawNcfValue = invoiceData?.NCF ?? invoice?.NCF ?? '';
    const ncf = sanitizeNcf(rawNcfValue);
    const canonical = canonicalizeNcf(rawNcfValue);
    const looseCanonical = looseCanonicalizeNcf(rawNcfValue);
    const invoiceNumberValue =
      invoiceData?.numberID ?? invoice?.numberID ?? invoice?.id ?? '';
    const invoiceNumber =
      typeof invoiceNumberValue === 'string' ||
      typeof invoiceNumberValue === 'number'
        ? String(invoiceNumberValue).trim()
        : '';
    const invoiceDate = parseInvoiceDate(
      invoiceData?.date ?? invoice?.date ?? null,
    );
    const status = invoiceData?.status ?? invoice?.status ?? '';

    const entry: InvoiceEntry = {
      invoiceId: invoice?.id || invoiceNumber || ncf,
      invoiceNumber,
      ncf,
      canonical,
      looseCanonical,
      date: invoiceDate,
      status: status || 'Sin estado',
      length: ncf ? ncf.length : 0,
    };

    if (ncf) {
      invoicesWithNcf += 1;

      const lengthKey = ncf.length;
      const stats: LengthStat = lengthStatsMap.get(lengthKey) || {
        length: lengthKey,
        count: 0,
        firstDate: null,
        lastDate: null,
        missingDateCount: 0,
      };
      stats.count += 1;
      if (invoiceDate) {
        if (!stats.firstDate || invoiceDate < stats.firstDate) {
          stats.firstDate = invoiceDate;
        }
        if (!stats.lastDate || invoiceDate > stats.lastDate) {
          stats.lastDate = invoiceDate;
        }
      } else {
        stats.missingDateCount = (stats.missingDateCount || 0) + 1;
      }
      lengthStatsMap.set(lengthKey, stats);

      if (lengthKey !== 11) {
        non11Count += 1;
      }

      const duplicateEntry = duplicatesMap.get(ncf) || {
        ncf,
        count: 0,
        occurrences: [],
      };
      duplicateEntry.occurrences.push(entry);
      duplicateEntry.count = duplicateEntry.occurrences.length;
      duplicatesMap.set(ncf, duplicateEntry);

      const normEntry = normalizedMap.get(canonical) || {
        canonical,
        count: 0,
        distinctNcfs: 0,
        occurrences: [],
      };
      normEntry.occurrences.push({ ...entry, canonical, looseCanonical });
      normEntry.count = normEntry.occurrences.length;
      normEntry.distinctNcfs = new Set(
        normEntry.occurrences.map((item) => item.ncf),
      ).size;
      normalizedMap.set(canonical, normEntry);

      if (looseCanonical) {
        const looseEntry = looseMap.get(looseCanonical) || {
          looseCanonical,
          count: 0,
          distinctNcfs: 0,
          occurrences: [],
        };
        looseEntry.occurrences.push({ ...entry, canonical, looseCanonical });
        looseEntry.count = looseEntry.occurrences.length;
        looseEntry.distinctNcfs = new Set(
          looseEntry.occurrences.map((item) => item.ncf),
        ).size;
        looseMap.set(looseCanonical, looseEntry);
      }
    } else {
      missingNcf += 1;
    }

    if (invoiceDate) {
      timelineEntries.push(entry);
    } else {
      skippedWithoutDate += 1;
    }
  });

  timelineEntries.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return a.date.getTime() - b.date.getTime();
  });

  const lengthChangeEvents: LengthChangeEvent[] = [];
  let previousEntry: InvoiceEntry | null = null;

  timelineEntries.forEach((entry) => {
    if (previousEntry && entry.ncf.length !== previousEntry.ncf.length) {
      lengthChangeEvents.push({
        fromLength: previousEntry.ncf.length,
        toLength: entry.ncf.length,
        date: entry.date ?? new Date(0),
        invoiceNumber: entry.invoiceNumber,
        ncf: entry.ncf,
        previousInvoiceNumber: previousEntry.invoiceNumber,
        previousDate: previousEntry.date ?? new Date(0),
      });
    }
    previousEntry = entry;
  });

  const ncfLengthStats = Array.from(lengthStatsMap.values()).sort(
    (a, b) => a.length - b.length,
  );

  const duplicateList = Array.from(duplicatesMap.values())
    .filter((item) => item.occurrences.length > 1)
    .map((item) => ({
      ncf: item.ncf,
      count: item.occurrences.length,
      occurrences: item.occurrences.sort((a, b) => {
        if (a.date && b.date) {
          return a.date.getTime() - b.date.getTime();
        }
        if (a.date) return -1;
        if (b.date) return 1;
        return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
      }),
    }))
    .sort((a, b) => b.count - a.count || a.ncf.localeCompare(b.ncf));

  const duplicatesNormalized = Array.from(normalizedMap.values())
    .filter((item) => item.occurrences.length > 1)
    .map((item) => ({
      canonical: item.canonical,
      count: item.occurrences.length,
      distinctNcfs: Array.from(new Set(item.occurrences.map((o) => o.ncf)))
        .length,
      occurrences: item.occurrences.sort((a, b) => {
        if (a.date && b.date) return a.date.getTime() - b.date.getTime();
        if (a.date) return -1;
        if (b.date) return 1;
        return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
      }),
    }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        b.distinctNcfs - a.distinctNcfs ||
        a.canonical.localeCompare(b.canonical),
    );

  const zeroCollapsedDuplicates = Array.from(looseMap.values())
    .filter((item) => item.looseCanonical && item.occurrences.length > 1)
    .map((item) => ({
      looseCanonical: item.looseCanonical,
      count: item.occurrences.length,
      distinctNcfs: Array.from(new Set(item.occurrences.map((o) => o.ncf)))
        .length,
      occurrences: item.occurrences.sort((a, b) => {
        if (a.date && b.date) return a.date.getTime() - b.date.getTime();
        if (a.date) return -1;
        if (b.date) return 1;
        return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
      }),
    }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        b.distinctNcfs - a.distinctNcfs ||
        a.looseCanonical.localeCompare(b.looseCanonical),
    );

  const observedLengths = Array.from(lengthStatsMap.keys()).sort(
    (a, b) => a - b,
  );
  const currentLength = timelineEntries.length
    ? timelineEntries[timelineEntries.length - 1].ncf.length
    : null;

  return {
    totalInvoices: invoices.length,
    invoicesWithNcf,
    missingNcf,
    skippedWithoutDate,
    ncfLengthStats,
    lengthChangeEvents,
    duplicates: duplicateList,
    duplicatesNormalized,
    zeroCollapsedDuplicates,
    uniqueNcfCount: duplicatesMap.size,
    observedLengths,
    currentLength,
    non11Count,
  };
};
