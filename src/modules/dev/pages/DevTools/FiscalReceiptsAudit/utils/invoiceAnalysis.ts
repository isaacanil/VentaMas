// @ts-nocheck
import {
  canonicalizeNcf,
  looseCanonicalizeNcf,
  parseInvoiceDate,
  sanitizeNcf,
} from './ncfUtils';

export const analyzeInvoices = (invoices) => {
  let invoicesWithNcf = 0;
  let missingNcf = 0;
  let skippedWithoutDate = 0;
  const lengthStatsMap = new Map();
  const duplicatesMap = new Map();
  const normalizedMap = new Map();
  const looseMap = new Map();
  const timelineEntries = [];
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

    const entry = {
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
      const stats = lengthStatsMap.get(lengthKey) || {
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

      const duplicateEntry = duplicatesMap.get(ncf) || { ncf, occurrences: [] };
      duplicateEntry.occurrences.push(entry);
      duplicatesMap.set(ncf, duplicateEntry);

      const normEntry = normalizedMap.get(canonical) || {
        canonical,
        occurrences: [],
      };
      normEntry.occurrences.push({ ...entry, canonical, looseCanonical });
      normalizedMap.set(canonical, normEntry);

      if (looseCanonical) {
        const looseEntry = looseMap.get(looseCanonical) || {
          looseCanonical,
          occurrences: [],
        };
        looseEntry.occurrences.push({ ...entry, canonical, looseCanonical });
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

  timelineEntries.sort((a, b) => a.date - b.date);

  const lengthChangeEvents = [];
  let previousEntry = null;

  timelineEntries.forEach((entry) => {
    if (previousEntry && entry.ncf.length !== previousEntry.ncf.length) {
      lengthChangeEvents.push({
        fromLength: previousEntry.ncf.length,
        toLength: entry.ncf.length,
        date: entry.date,
        invoiceNumber: entry.invoiceNumber,
        ncf: entry.ncf,
        previousInvoiceNumber: previousEntry.invoiceNumber,
        previousDate: previousEntry.date,
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
          return a.date - b.date;
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
        if (a.date && b.date) return a.date - b.date;
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
        if (a.date && b.date) return a.date - b.date;
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
