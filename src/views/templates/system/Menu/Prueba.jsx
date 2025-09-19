import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Empty,
  List,
  Progress,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../../../firebase/firebaseconfig';
import { fbGetBusinessesList } from '../../../../firebase/dev/businesses/fbGetBusinessesList';
import { userAccess } from '../../../../hooks/abilities/useAbilities';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const sanitizeNcf = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim().toUpperCase();
  }
  return '';
};

// Crea una clave canónica a partir de un NCF: prefijo letras + parte numérica sin ceros a la izquierda
// Ej: B020000000020 -> B02 + 20000000020 -> "B0220000000020"? No. Mejor: extraer prefijo alfabético al inicio y el resto dígitos.
// Si no hay match claro, usa ncf saneado tal cual.
const canonicalizeNcf = (raw) => {
  const ncf = sanitizeNcf(raw);
  if (!ncf) return '';
  const match = ncf.match(/^([A-Z]+)?(\d+)$/);
  if (match) {
    const prefix = match[1] || '';
    const digits = match[2] || '';
    // eliminar ceros a la izquierda en la parte numérica
    const normalizedNumber = digits.replace(/^0+/, '') || '0';
    return `${prefix}${normalizedNumber}`;
  }
  // fallback: quitar separadores comunes y volver a intentar
  const compact = ncf.replace(/[^A-Z0-9]/g, '');
  const match2 = compact.match(/^([A-Z]+)?(\d+)$/);
  if (match2) {
    const prefix = match2[1] || '';
    const digits = match2[2] || '';
    const normalizedNumber = digits.replace(/^0+/, '') || '0';
    return `${prefix}${normalizedNumber}`;
  }
  return ncf;
};

const parseInvoiceDate = (rawDate) => {
  if (!rawDate) {
    return null;
  }
  if (typeof rawDate.toDate === 'function') {
    try {
      const parsed = rawDate.toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    } catch (err) {
      console.error('parseInvoiceDate: error usando toDate()', err);
      return null;
    }
  }
  if (typeof rawDate === 'object' && rawDate.seconds !== undefined) {
    const milliseconds = rawDate.seconds * 1000 + Math.floor((rawDate.nanoseconds || 0) / 1e6);
    const parsed = new Date(milliseconds);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (rawDate instanceof Date) {
    return Number.isNaN(rawDate.getTime()) ? null : rawDate;
  }
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};


const analyzeInvoices = (invoices) => {
  let invoicesWithNcf = 0;
  let missingNcf = 0;
  let skippedWithoutDate = 0;
  const lengthStatsMap = new Map();
  const duplicatesMap = new Map(); // exactos por NCF
  const normalizedMap = new Map(); // por clave canónica
  const timelineEntries = [];
  let non11Count = 0;

  invoices.forEach((invoice) => {
    const invoiceData = invoice?.data || {};
    const rawNcfValue = invoiceData?.NCF ?? invoice?.NCF ?? '';
    const ncf = sanitizeNcf(rawNcfValue);
    const canonical = canonicalizeNcf(rawNcfValue);
    const invoiceNumberValue = invoiceData?.numberID ?? invoice?.numberID ?? invoice?.id ?? '';
    const invoiceNumber = typeof invoiceNumberValue === 'string' || typeof invoiceNumberValue === 'number'
      ? String(invoiceNumberValue).trim()
      : '';
    const invoiceDate = parseInvoiceDate(invoiceData?.date ?? invoice?.date ?? null);

    const status = invoiceData?.status ?? invoice?.status ?? '';
    const entry = {
      invoiceId: invoice?.id || invoiceNumber || ncf,
      invoiceNumber,
      ncf,
      canonical,
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

      const normEntry = normalizedMap.get(canonical) || { canonical, occurrences: [] };
      normEntry.occurrences.push({ ...entry, canonical });
      normalizedMap.set(canonical, normEntry);
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

  const ncfLengthStats = Array.from(lengthStatsMap.values()).sort((a, b) => a.length - b.length);

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
      distinctNcfs: Array.from(new Set(item.occurrences.map((o) => o.ncf))).length,
      occurrences: item.occurrences.sort((a, b) => {
        if (a.date && b.date) return a.date - b.date;
        if (a.date) return -1;
        if (b.date) return 1;
        return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
      }),
    }))
    // Orden: más ocurrencias primero, luego más NCF distintos, luego por canonical
    .sort((a, b) => b.count - a.count || b.distinctNcfs - a.distinctNcfs || a.canonical.localeCompare(b.canonical));

  const observedLengths = Array.from(lengthStatsMap.keys()).sort((a, b) => a - b);
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
    uniqueNcfCount: duplicatesMap.size,
    observedLengths,
    currentLength,
    non11Count,
  };
};

export const Prueba = () => {
  const navigate = useNavigate();
  const { abilities, loading } = userAccess();
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressDone, setProgressDone] = useState(0);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [exportingBusiness, setExportingBusiness] = useState(null);
  const presets = [
    { label: 'Hoy', value: 'today' },
    { label: 'Ayer', value: 'yesterday' },
    { label: 'Este mes', value: 'this_month' },
    { label: 'Mes pasado', value: 'last_month' },
    { label: 'Últimos 3 meses', value: 'last_3_months' },
    { label: 'Últimos 90 días', value: 'last_90_days' },
    { label: 'Trimestre 1 (Ene-Mar)', value: 'q1' },
    { label: 'Trimestre 2 (Abr-Jun)', value: 'q2' },
    { label: 'Trimestre 3 (Jul-Sep)', value: 'q3' },
    { label: 'Trimestre 4 (Oct-Dic)', value: 'q4' },
    { label: 'Este año', value: 'this_year' },
    { label: 'Año pasado', value: 'last_year' },
    { label: 'Todas (sin filtro de fechas)', value: 'all' },
  ];

  const [selectedPreset, setSelectedPreset] = useState('last_90_days');

  const getRangeFromPreset = (preset) => {
    const now = dayjs();
    switch (preset) {
      case 'today':
        return { start: now.startOf('day'), end: now.endOf('day') };
      case 'yesterday': {
        const y = now.subtract(1, 'day');
        return { start: y.startOf('day'), end: y.endOf('day') };
      }
      case 'this_month':
        return { start: now.startOf('month'), end: now.endOf('month') };
      case 'last_month': {
        const lm = now.subtract(1, 'month');
        return { start: lm.startOf('month'), end: lm.endOf('month') };
      }
      case 'last_3_months':
        return { start: now.subtract(3, 'month').startOf('day'), end: now.endOf('day') };
      case 'last_90_days':
        return { start: now.subtract(90, 'day').startOf('day'), end: now.endOf('day') };
      case 'q1': {
        const year = now.year();
        return { start: dayjs(`${year}-01-01`).startOf('day'), end: dayjs(`${year}-03-31`).endOf('day') };
      }
      case 'q2': {
        const year = now.year();
        return { start: dayjs(`${year}-04-01`).startOf('day'), end: dayjs(`${year}-06-30`).endOf('day') };
      }
      case 'q3': {
        const year = now.year();
        return { start: dayjs(`${year}-07-01`).startOf('day'), end: dayjs(`${year}-09-30`).endOf('day') };
      }
      case 'q4': {
        const year = now.year();
        return { start: dayjs(`${year}-10-01`).startOf('day'), end: dayjs(`${year}-12-31`).endOf('day') };
      }
      case 'this_year': {
        const year = now.year();
        return { start: dayjs(`${year}-01-01`).startOf('day'), end: dayjs(`${year}-12-31`).endOf('day') };
      }
      case 'last_year': {
        const year = now.year() - 1;
        return { start: dayjs(`${year}-01-01`).startOf('day'), end: dayjs(`${year}-12-31`).endOf('day') };
      }
      case 'all':
        return { start: null, end: null };
      default:
        return { start: now.subtract(90, 'day').startOf('day'), end: now.endOf('day') };
    }
  };

  const toFriendlyFirestoreError = (err) => {
    const code = err?.code;
    switch (code) {
      case 'permission-denied':
        return 'Permisos insuficientes para leer datos de este negocio.';
      case 'unauthenticated':
        return 'Sesión no autenticada. Por favor, vuelve a iniciar sesión.';
      case 'unavailable':
        return 'Servicio no disponible o sin conexión. Intenta de nuevo más tarde.';
      case 'deadline-exceeded':
        return 'La consulta tardó demasiado en responder.';
      case 'not-found':
        return 'Recurso no encontrado.';
      case 'aborted':
        return 'Operación cancelada o en conflicto. Intenta de nuevo.';
      default:
        return err?.message || 'Fallo desconocido';
    }
  };
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const businessesWithDuplicates = results.filter((item) => item.duplicates && item.duplicates.length > 0);

  useEffect(() => {
    if (!loading) {
      const canAccess = abilities?.can('developerAccess', 'all');
      if (!canAccess) {
        message.warning('No tienes permisos para acceder a esta pagina');
        navigate('/home', { replace: true, state: { unauthorized: true } });
      }
    }
  }, [abilities, loading, navigate]);

  const handleAnalyze = useCallback(async () => {
    const { start, end } = getRangeFromPreset(selectedPreset);
    if (start && end && end.isBefore(start)) {
      message.warning('El rango de fechas no es válido.');
      return;
    }

    setProcessing(true);
    setResults([]);
    setErrors([]);
    setProgressTotal(0);
    setProgressDone(0);
    setCurrentBusiness(null);

    try {
  const startDate = start ? start.toDate() : null;
  const endDate = end ? end.toDate() : null;
      const businesses = await fbGetBusinessesList();

      if (!businesses.length) {
        message.info('No se encontraron negocios para analizar.');
        setProcessing(false);
        return;
      }

      setProgressTotal(businesses.length);

      const aggregated = [];
      const issues = [];

      for (const business of businesses) {
        const businessName = business?.business?.name
          || business?.business?.fantasyName
          || business?.name
          || business?.id;

        try {
          setCurrentBusiness(businessName);
          const taxSettingsRef = doc(db, 'businesses', business.id, 'settings', 'taxReceipt');
          const taxSettingsSnap = await getDoc(taxSettingsRef);
          const taxEnabled = taxSettingsSnap.exists() && !!taxSettingsSnap.data()?.taxReceiptEnabled;

          if (!taxEnabled) {
            // Igual contamos como procesado para el progreso
            aggregated.push({
              businessId: business.id,
              businessName,
              totalInvoices: 0,
              invoicesWithNcf: 0,
              missingNcf: 0,
              skippedWithoutDate: 0,
              ncfLengthStats: [],
              lengthChangeEvents: [],
              duplicates: [],
              uniqueNcfCount: 0,
              observedLengths: [],
              currentLength: null,
            });
            continue;
          }

          const invoicesRef = collection(db, 'businesses', business.id, 'invoices');
          let invoicesQuery;
          if (startDate && endDate) {
            invoicesQuery = query(
              invoicesRef,
              where('data.date', '>=', startDate),
              where('data.date', '<=', endDate),
              orderBy('data.date', 'asc'),
            );
          } else {
            invoicesQuery = query(
              invoicesRef,
              orderBy('data.date', 'asc'),
            );
          }

          const invoicesSnapshot = await getDocs(invoicesQuery);

          if (invoicesSnapshot.empty) {
            aggregated.push({
              businessId: business.id,
              businessName,
              totalInvoices: 0,
              invoicesWithNcf: 0,
              missingNcf: 0,
              skippedWithoutDate: 0,
              ncfLengthStats: [],
              lengthChangeEvents: [],
              duplicates: [],
              uniqueNcfCount: 0,
              observedLengths: [],
              currentLength: null,
            });
            continue;
          }

          const invoices = invoicesSnapshot.docs
            .map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }))
            .filter((invoice) => invoice?.data?.status !== 'cancelled');

          const analysis = analyzeInvoices(invoices);
          aggregated.push({
            businessId: business.id,
            businessName,
            ...analysis,
          });
        } catch (businessError) {
          console.error(`Error analizando negocio ${business?.id}`, businessError);
          issues.push({
            businessId: business.id,
            businessName,
            message: toFriendlyFirestoreError(businessError),
          });
        } finally {
          setProgressDone((d) => d + 1);
        }
      }

      aggregated.sort((a, b) => {
        if (b.duplicates.length !== a.duplicates.length) {
          return b.duplicates.length - a.duplicates.length;
        }
        if (b.invoicesWithNcf !== a.invoicesWithNcf) {
          return b.invoicesWithNcf - a.invoicesWithNcf;
        }
        return (a.businessName || '').localeCompare(b.businessName || '');
      });

      setResults(aggregated);
      setErrors(issues);

      if (!aggregated.length && !issues.length) {
        message.info('No se encontraron negocios con comprobante habilitado en el rango seleccionado.');
      }

      if (issues.length) {
        message.warning(`Algunos negocios no se pudieron analizar (${issues.length}). Revisa los avisos.`);
      }
    } catch (error) {
      console.error('Error general al analizar comprobantes', error);
      message.error('Ocurrió un error al generar el análisis.');
      setErrors([{ businessId: 'general', businessName: 'General', message: toFriendlyFirestoreError(error) }]);
      setResults([]);
    } finally {
      setProcessing(false);
      setCurrentBusiness(null);
    }
  }, [selectedPreset]);

  const sanitizeFileName = (name) => {
    const base = (name || 'negocio').toString().trim();
    return base
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-zA-Z0-9-_\s.]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 80);
  };

  const exportBusinessWorkbook = async (result, start, end) => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'VentaMax';
    wb.created = new Date();

    // Resumen sheet
    const resumen = wb.addWorksheet('Resumen');
    resumen.columns = [
      { header: 'Campo', key: 'field', width: 28 },
      { header: 'Valor', key: 'value', width: 60 },
    ];

    const estado = result.duplicates?.length ? 'CON DUPLICADOS' : 'OK';

    const resumenRows = [
      { field: 'Negocio', value: result.businessName },
      { field: 'ID', value: result.businessId },
      { field: 'Rango', value: start && end ? `${dayjs(start).format('YYYY-MM-DD')} a ${dayjs(end).format('YYYY-MM-DD')}` : 'Todas las fechas' },
      { field: 'Facturas analizadas', value: String(result.totalInvoices) },
      { field: 'Facturas con NCF', value: String(result.invoicesWithNcf) },
      { field: 'NCF únicos', value: String(result.uniqueNcfCount) },
      { field: 'Comprobantes faltantes', value: String(result.missingNcf) },
      { field: 'Sin fecha', value: String(result.skippedWithoutDate || 0) },
      { field: 'Duplicados detectados', value: String(result.duplicates?.length || 0) },
      { field: 'Longitud actual', value: result.currentLength ?? 'N/D' },
      { field: 'Longitudes vistas', value: (result.observedLengths || []).join(', ') || '—' },
      { field: 'Repetidos por clave normalizada', value: String(result.duplicatesNormalized?.length || 0) },
      { field: 'NCF longitud ≠ 11', value: String(result.non11Count || 0) },
      { field: 'Estado', value: estado },
    ];
    resumen.addRows(resumenRows);
    resumen.getColumn('field').font = { bold: true };

    // Longitudes sheet
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
        first: s.firstDate ? dayjs(s.firstDate).format('YYYY-MM-DD HH:mm') : '—',
        last: s.lastDate ? dayjs(s.lastDate).format('YYYY-MM-DD HH:mm') : '—',
        missing: s.missingDateCount || 0,
      });
    });

    // Duplicados detail sheet
    const duplicados = wb.addWorksheet('Duplicados');
    duplicados.columns = [
      { header: 'Factura', key: 'invoice', width: 18 },
      { header: 'Comprobante fiscal', key: 'ncf', width: 26 },
      { header: 'Clave normalizada', key: 'canonical', width: 26 },
      { header: 'Fecha', key: 'date', width: 22 },
      { header: 'Estado', key: 'status', width: 16 },
      { header: 'Longitud', key: 'length', width: 12 },
      { header: 'Ocurrencia #', key: 'idx', width: 14 },
      { header: 'ID interno', key: 'invoiceId', width: 20 },
    ];
    (result.duplicates || []).forEach((dup) => {
      dup.occurrences.forEach((occ, idx) => {
        const lengthValue = occ.length || (occ.ncf ? occ.ncf.length : null);
        duplicados.addRow({
          invoice: occ.invoiceNumber || null,
          ncf: dup.ncf,
          canonical: occ.canonical || canonicalizeNcf(dup.ncf),
          date: occ.date ? dayjs(occ.date).format('YYYY-MM-DD HH:mm') : null,
          status: occ.status || 'Sin estado',
          length: typeof lengthValue === 'number' ? lengthValue : null,
          idx: idx + 1,
          invoiceId: occ.invoiceId || null,
        });
      });
    });

    // Normalizados
    const norm = wb.addWorksheet('Duplicados (norm)');
    norm.columns = [
      { header: 'Clave normalizada', key: 'canonical', width: 26 },
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
          invoice: occ.invoiceNumber || null,
          ncf: occ.ncf,
          date: occ.date ? dayjs(occ.date).format('YYYY-MM-DD HH:mm') : null,
          status: occ.status || 'Sin estado',
          length: typeof lengthValue === 'number' ? lengthValue : null,
          idx: idx + 1,
          invoiceId: occ.invoiceId || null,
        });
      });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const fileName = `${sanitizeFileName(result.businessName)}_${dayjs().format('YYYYMMDD-HHmm')}.xlsx`;
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
  };

  const handleExportBusiness = async (businessResult) => {
    if (!businessResult?.duplicates?.length) {
      message.info('Este negocio no tiene comprobantes duplicados para exportar.');
      return;
    }

    const { start, end } = getRangeFromPreset(selectedPreset);
    const startDate = start ? start.toDate() : null;
    const endDate = end ? end.toDate() : null;

    setExporting(true);
    setExportingBusiness({
      id: businessResult.businessId,
      name: businessResult.businessName,
    });

    try {
      await exportBusinessWorkbook(businessResult, startDate, endDate);
      message.success(`Reporte exportado para ${businessResult.businessName}.`);
    } catch (err) {
      console.error('Error exportando Excel', err);
      message.error('Ocurrió un error durante la exportación.');
    } finally {
      setExporting(false);
      setExportingBusiness(null);
    }
  };

  if (loading) {
    return null;
  }

  if (!abilities?.can('developerAccess', 'all')) {
    return null;
  }

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3} style={{ marginBottom: 8 }}>
        Analisis de comprobantes fiscales
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Ejecuta una revision de comprobantes en todos los negocios con la configuracion activa para detectar cambios de longitud y duplicados.
      </Typography.Paragraph>

      <Space size="small" wrap style={{ marginBottom: 16 }}>
        <Select
          value={selectedPreset}
          onChange={setSelectedPreset}
          options={presets}
          style={{ minWidth: 280 }}
          disabled={processing}
        />
        <Button type="primary" onClick={handleAnalyze} loading={processing}>
          Analizar
        </Button>
      </Space>

      {errors.map((error) => (
        <Alert
          key={`${error.businessId}-${error.businessName}`}
          type="warning"
          showIcon
          message={`No se pudo analizar ${error.businessName}`}
          description={error.message}
          style={{ marginBottom: 12 }}
        />
      ))}

      {processing && (
        <div style={{ marginTop: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Typography.Text strong>Analizando comprobantes...</Typography.Text>
              {currentBusiness ? (
                <Typography.Text style={{ marginLeft: 8 }} type="secondary">
                  {currentBusiness}
                </Typography.Text>
              ) : null}
            </div>
            <Progress
              percent={progressTotal ? Math.round((progressDone / progressTotal) * 100) : 0}
              status="active"
            />
          </Space>
        </div>
      )}

      {!processing && !results.length && (
        <Empty description="Ejecuta el analisis para ver resultados." />
      )}

      {!processing && results.length > 0 && !businessesWithDuplicates.length && (
        <Empty description="No se detectaron negocios con comprobantes duplicados en el rango seleccionado." />
      )}


      {exporting && (
        <Alert
          type="info"
          showIcon
          style={{ margin: '16px 0' }}
          message={
            exportingBusiness ? (
              <span>
                Exportando reporte de <strong>{exportingBusiness.name}</strong>...
              </span>
            ) : (
              'Generando reporte...'
            )
          }
        />
      )}

      {!processing && businessesWithDuplicates.length > 0 && (
        <List
          itemLayout="horizontal"
          dataSource={businessesWithDuplicates}
          renderItem={(result) => {
            const isExportingThis = exporting && exportingBusiness?.id === result.businessId;
            return (
              <List.Item
                key={result.businessId}
                actions={[
                  <Button
                    key="export"
                    type="primary"
                    onClick={() => handleExportBusiness(result)}
                    loading={isExportingThis}
                    disabled={exporting && !isExportingThis}
                  >
                    Exportar reporte
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space size={8} wrap>
                      <Typography.Text strong>{result.businessName}</Typography.Text>
                      <Tag>{result.businessId}</Tag>
                    </Space>
                  }
                  description={
                    <Space size={8} wrap>
                      <Tag color="red">{`${result.duplicates.length} NCF duplicados`}</Tag>
                      {result.duplicatesNormalized && result.duplicatesNormalized.length ? (
                        <Tag color="volcano">{`${result.duplicatesNormalized.length} claves normalizadas`}</Tag>
                      ) : null}
                      <Typography.Text type="secondary">
                        {`${result.invoicesWithNcf} comprobantes con NCF analizados`}
                      </Typography.Text>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}

    </div>
  );
};

export default Prueba;
