import { saveAs } from 'file-saver';
import { DateTime } from 'luxon';

import { canonicalizeNcf, looseCanonicalizeNcf } from './ncfUtils';

type DateInput = Date | number | string | null | undefined;

interface DuplicateOccurrence {
  invoiceId?: string;
  invoiceNumber?: string;
  ncf?: string;
  date?: Date | string | number | null;
  status?: string;
  canonical?: string;
  looseCanonical?: string;
  length?: number;
}

interface DuplicateGroup {
  canonical?: string;
  occurrences: DuplicateOccurrence[];
  distinctNcfs?: number;
  count?: number;
}

interface NcfLengthStat {
  length: number;
  count: number;
  firstDate?: Date | string | number | null;
  lastDate?: Date | string | number | null;
  missingDateCount?: number;
}

interface BusinessAuditResult {
  businessId: string;
  businessName?: string;
  totalInvoices: number;
  invoicesWithNcf: number;
  uniqueNcfCount: number;
  missingNcf: number;
  skippedWithoutDate?: number;
  duplicates?: DuplicateGroup[];
  duplicatesNormalized?: DuplicateGroup[];
  zeroCollapsedDuplicates?: DuplicateGroup[];
  currentLength?: number | null;
  observedLengths?: number[];
  ncfLengthStats?: NcfLengthStat[];
  non11Count?: number;
}

interface DuplicateDetailRow {
  key: string;
  invoiceId: string | null;
  invoiceNumber: string;
  ncf: string;
  date: Date | null;
  status: string;
  canonical: string;
  looseCanonical: string;
  length: number | null;
  detection: Set<string>;
  originalSources: Set<string>;
  duplicateSources: Set<string>;
  hasExactDuplicate: boolean;
  hasCanonicalVariation: boolean;
  hasLooseVariation: boolean;
  canonicalGroupSize?: number;
  looseGroupSize?: number;
}

interface DuplicateDetailOutputRow {
  key: string;
  invoice: string | null;
  ncf: string | null;
  date: string | null;
  duplicateType: string;
  length: number | null;
  lengthFlag: string;
  canonical: string | null;
  looseCanonical: string | null;
  looseVariation: string;
  detection: string;
  invoiceId: string | null;
  dateSortValue?: number | null;
  originalRank?: number;
}

const formatDate = (value: DateInput, format: string): string | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return DateTime.fromJSDate(value).toFormat(format);
  }
  if (typeof value === 'number') {
    return DateTime.fromMillis(value).toFormat(format);
  }
  if (typeof value === 'string') {
    const iso = DateTime.fromISO(value);
    if (iso.isValid) return iso.toFormat(format);
    const parsed = DateTime.fromJSDate(new Date(value));
    return parsed.isValid ? parsed.toFormat(format) : null;
  }
  return null;
};

export const sanitizeFileName = (name?: string): string => {
  const base = (name || 'negocio').toString().trim();
  return base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_\s.]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 80);
};

export const exportBusinessWorkbook = async (
  result: BusinessAuditResult,
  start: Date | null,
  end: Date | null,
): Promise<void> => {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'VentaMax';
  wb.created = new Date();

  const buildDuplicateDetailRows = () => {
    const detailMap = new Map<string, DuplicateDetailRow>();

    const getRowKey = (occ: DuplicateOccurrence): string => {
      if (occ.invoiceId) {
        return `id:${occ.invoiceId}`;
      }
      const ncfPart = occ.ncf ? `ncf:${occ.ncf}` : 'ncf:__';
      const invoicePart = occ.invoiceNumber
        ? `inv:${occ.invoiceNumber}`
        : 'inv:__';
      const datePart =
        occ.date instanceof Date && !Number.isNaN(occ.date.getTime())
          ? `date:${occ.date.getTime()}`
          : 'date:__';
      return `${ncfPart}|${invoicePart}|${datePart}`;
    };

    const ensureRow = (occ: DuplicateOccurrence): DuplicateDetailRow => {
      const key = getRowKey(occ);
      let row = detailMap.get(key);
      if (!row) {
        const lengthValue =
          typeof occ.length === 'number'
            ? occ.length
            : occ.ncf
              ? occ.ncf.length
              : null;
        row = {
          key,
          invoiceId: occ.invoiceId || null,
          invoiceNumber: occ.invoiceNumber || '',
          ncf: occ.ncf || '',
          date:
            occ.date instanceof Date && !Number.isNaN(occ.date.getTime())
              ? occ.date
              : null,
          status: occ.status || 'Sin estado',
          canonical: occ.canonical || canonicalizeNcf(occ.ncf ?? ''),
          looseCanonical:
            occ.looseCanonical || looseCanonicalizeNcf(occ.ncf ?? ''),
          length: lengthValue,
          detection: new Set(),
          originalSources: new Set(),
          duplicateSources: new Set(),
          hasExactDuplicate: false,
          hasCanonicalVariation: false,
          hasLooseVariation: false,
        };
        detailMap.set(key, row);
      }
      return row;
    };

    const markOccurrence = (
      row: DuplicateDetailRow,
      {
        detection,
        isOriginal,
        hasExactDuplicate,
        hasCanonicalVariation,
        hasLooseVariation,
        groupSize,
      }: {
        detection?: string;
        isOriginal: boolean;
        hasExactDuplicate: boolean;
        hasCanonicalVariation: boolean;
        hasLooseVariation: boolean;
        groupSize?: number;
      },
    ): void => {
      if (detection) {
        row.detection.add(detection);
      }
      if (isOriginal) {
        row.originalSources.add(detection || 'unknown');
      } else {
        row.duplicateSources.add(detection || 'unknown');
      }
      if (hasExactDuplicate) {
        row.hasExactDuplicate = true;
      }
      if (hasCanonicalVariation) {
        row.hasCanonicalVariation = true;
      }
      if (hasLooseVariation) {
        row.hasLooseVariation = true;
      }
      if (groupSize && detection && detection.startsWith('canonical')) {
        row.canonicalGroupSize = groupSize;
      }
      if (groupSize && detection === 'loose_variation') {
        row.looseGroupSize = groupSize;
      }
    };

    (result.duplicatesNormalized || []).forEach((group) => {
      const occurrences = group.occurrences || [];
      if (!occurrences.length) {
        return;
      }
      const detectionLabel =
        group.distinctNcfs > 1 ? 'canonical_variation' : 'canonical_exact';
      const ncfCounts = occurrences.reduce((acc, occ) => {
        const ncfKey = occ.ncf || '';
        acc.set(ncfKey, (acc.get(ncfKey) || 0) + 1);
        return acc;
      }, new Map<string, number>());

      occurrences.forEach((occ, index) => {
        const row = ensureRow(occ);
        markOccurrence(row, {
          detection: detectionLabel,
          isOriginal: index === 0,
          hasExactDuplicate: (ncfCounts.get(occ.ncf || '') || 0) > 1,
          hasCanonicalVariation: group.distinctNcfs > 1,
          hasLooseVariation: false,
          groupSize: group.count,
        });
      });
    });

    (result.zeroCollapsedDuplicates || []).forEach((group) => {
      const occurrences = group.occurrences || [];
      if (!occurrences.length) {
        return;
      }

      occurrences.forEach((occ, index) => {
        const row = ensureRow(occ);
        markOccurrence(row, {
          detection: 'loose_variation',
          isOriginal: index === 0,
          hasExactDuplicate: false,
          hasCanonicalVariation: false,
          hasLooseVariation: group.distinctNcfs > 1,
          groupSize: group.count,
        });
      });
    });

    const rows = Array.from(detailMap.values())
      .filter((row) => row.detection.size > 0)
      .map((row): DuplicateDetailOutputRow => {
        const lengthValue =
          typeof row.length === 'number'
            ? row.length
            : row.ncf
              ? row.ncf.length
              : null;
        const lengthFlag =
          lengthValue === 11 ? '11' : lengthValue === 13 ? '13' : 'Otro';
        const hasOriginalSource = row.originalSources.size > 0;
        const hasDuplicateSource = row.duplicateSources.size > 0;
        let classification;
        if (hasOriginalSource && !hasDuplicateSource) {
          classification = 'Original';
        } else if (!hasOriginalSource && hasDuplicateSource) {
          classification = 'Duplicado';
        } else if (hasOriginalSource && hasDuplicateSource) {
          classification = 'Original y duplicado';
        } else {
          classification = 'Sin clasificación';
        }

        const detectionLabel = Array.from(row.detection)
          .map((label) => {
            switch (label) {
              case 'canonical_exact':
                return 'Exacto';
              case 'canonical_variation':
                return 'Normalizado';
              case 'loose_variation':
                return 'Ceros colapsados';
              default:
                return label;
            }
          })
          .join(', ');

        const dateString = row.date
          ? formatDate(row.date, 'yyyy-LL-dd HH:mm')
          : null;
        return {
          key: row.key,
          invoice: row.invoiceNumber || null,
          ncf: row.ncf || null,
          date: dateString,
          dateSortValue: row.date ? row.date.getTime() : null,
          duplicateType: classification,
          length: lengthValue ?? null,
          lengthFlag,
          canonical: row.canonical || null,
          looseCanonical: row.looseCanonical || null,
          looseVariation: row.hasLooseVariation ? 'Sí' : 'No',
          detection: detectionLabel,
          invoiceId: row.invoiceId || null,
          originalRank: hasOriginalSource ? (hasDuplicateSource ? 1 : 0) : 2,
        };
      });

    const groupedByLooseCanonical = new Map<string, DuplicateDetailOutputRow[]>();
    rows.forEach((row) => {
      const groupKey =
        row.looseCanonical || row.canonical || row.ncf || row.key;
      const grouped = groupedByLooseCanonical.get(groupKey) || [];
      grouped.push(row);
      groupedByLooseCanonical.set(groupKey, grouped);
    });

    const sortedGroups = Array.from(groupedByLooseCanonical.entries()).sort(
      ([keyA], [keyB]) => keyA.localeCompare(keyB),
    );

    const orderedRows: DuplicateDetailOutputRow[] = [];
    sortedGroups.forEach(([, groupRows]) => {
      groupRows.sort((a, b) => {
        if (a.originalRank !== b.originalRank) {
          return a.originalRank - b.originalRank;
        }
        if (a.dateSortValue !== null && b.dateSortValue !== null) {
          return a.dateSortValue - b.dateSortValue;
        }
        if (a.dateSortValue !== null) return -1;
        if (b.dateSortValue !== null) return 1;
        if (a.ncf && b.ncf) {
          const cmp = a.ncf.localeCompare(b.ncf);
          if (cmp !== 0) {
            return cmp;
          }
        }
        return (a.invoice || '').localeCompare(b.invoice || '');
      });
      groupRows.forEach((row) => {
        const finalRow = { ...row };
        delete finalRow.dateSortValue;
        delete finalRow.originalRank;
        orderedRows.push(finalRow);
      });
    });

    return orderedRows;
  };

  const duplicateDetailRows = buildDuplicateDetailRows();

  const resumen = wb.addWorksheet('Resumen');
  resumen.columns = [
    { header: 'Campo', key: 'field', width: 28 },
    { header: 'Valor', key: 'value', width: 60 },
  ];

  const estado = result.duplicates?.length ? 'CON DUPLICADOS' : 'OK';

  const resumenRows = [
    { field: 'Negocio', value: result.businessName },
    { field: 'ID', value: result.businessId },
    {
      field: 'Rango',
      value:
        start && end
          ? `${formatDate(start, 'yyyy-LL-dd')} a ${formatDate(end, 'yyyy-LL-dd')}`
          : 'Todas las fechas',
    },
    { field: 'Facturas analizadas', value: String(result.totalInvoices) },
    { field: 'Facturas con NCF', value: String(result.invoicesWithNcf) },
    { field: 'NCF únicos', value: String(result.uniqueNcfCount) },
    { field: 'Comprobantes faltantes', value: String(result.missingNcf) },
    { field: 'Sin fecha', value: String(result.skippedWithoutDate || 0) },
    {
      field: 'Duplicados detectados',
      value: String(result.duplicates?.length || 0),
    },
    { field: 'Longitud actual', value: result.currentLength ?? 'N/D' },
    {
      field: 'Longitudes vistas',
      value: (result.observedLengths || []).join(', ') || '—',
    },
    {
      field: 'Repetidos por clave normalizada',
      value: String(result.duplicatesNormalized?.length || 0),
    },
    {
      field: 'Variaciones por ceros',
      value: String(result.zeroCollapsedDuplicates?.length || 0),
    },
    {
      field: 'Filas detalle duplicados',
      value: String(duplicateDetailRows.length),
    },
    { field: 'NCF longitud ≠ 11', value: String(result.non11Count || 0) },
    { field: 'Estado', value: estado },
  ];
  resumen.addRows(resumenRows);
  resumen.getColumn('field').font = { bold: true };

  const longitudes = wb.addWorksheet('Longitudes');
  longitudes.columns = [
    { header: 'Longitud', key: 'length', width: 12 },
    { header: 'Conteo', key: 'count', width: 12 },
    { header: 'Primera fecha', key: 'first', width: 22 },
    { header: 'Última fecha', key: 'last', width: 22 },
    { header: 'Sin fecha', key: 'missing', width: 12 },
  ];
  (result.ncfLengthStats || []).forEach((s) => {
    longitudes.addRow({
      length: s.length,
      count: s.count,
      first: s.firstDate ? formatDate(s.firstDate, 'yyyy-LL-dd HH:mm') : '—',
      last: s.lastDate ? formatDate(s.lastDate, 'yyyy-LL-dd HH:mm') : '—',
      missing: s.missingDateCount || 0,
    });
  });

  const duplicados = wb.addWorksheet('Duplicados');
  duplicados.columns = [
    { header: 'Factura', key: 'invoice', width: 18 },
    { header: 'Comprobante fiscal', key: 'ncf', width: 26 },
    { header: 'Fecha factura', key: 'date', width: 22 },
    { header: 'Original/Duplicado', key: 'duplicateType', width: 20 },
    { header: 'Longitud', key: 'length', width: 12 },
    { header: '11 o 13', key: 'lengthFlag', width: 12 },
    { header: 'Clave normalizada', key: 'canonical', width: 26 },
    { header: 'Comparador ceros', key: 'looseCanonical', width: 26 },
    { header: 'Variación ceros', key: 'looseVariation', width: 16 },
    { header: 'Tipo coincidencia', key: 'detection', width: 24 },
    { header: 'ID interno', key: 'invoiceId', width: 22 },
  ];
  duplicateDetailRows.forEach((row) => {
    duplicados.addRow(row);
  });

  const norm = wb.addWorksheet('Duplicados (norm)');
  norm.columns = [
    { header: 'Clave normalizada', key: 'canonical', width: 26 },
    { header: 'Comparador ceros', key: 'looseCanonical', width: 26 },
    { header: 'Factura', key: 'invoice', width: 18 },
    { header: 'Comprobante fiscal', key: 'ncf', width: 26 },
    { header: 'Fecha', key: 'date', width: 22 },
    { header: 'Estado', key: 'status', width: 16 },
    { header: 'Longitud', key: 'length', width: 12 },
    { header: 'Ocurrencia #', key: 'idx', width: 14 },
    { header: 'ID interno', key: 'invoiceId', width: 20 },
  ];
  (result.duplicatesNormalized || []).forEach((group) => {
    group.occurrences.forEach((occ, idx) => {
      const lengthValue = occ.length || (occ.ncf ? occ.ncf.length : null);
      norm.addRow({
        canonical: group.canonical,
        looseCanonical:
          occ.looseCanonical || looseCanonicalizeNcf(occ.ncf ?? ''),
        invoice: occ.invoiceNumber || null,
        ncf: occ.ncf ?? null,
        date: occ.date ? formatDate(occ.date, 'yyyy-LL-dd HH:mm') : null,
        status: occ.status || 'Sin estado',
        length: typeof lengthValue === 'number' ? lengthValue : null,
        idx: idx + 1,
        invoiceId: occ.invoiceId || null,
      });
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const fileName = `${sanitizeFileName(result.businessName)}_${DateTime.local().toFormat('yyyyMMdd-HHmm')}.xlsx`;
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName,
  );
};
