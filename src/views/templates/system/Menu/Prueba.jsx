import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  List,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../../../firebase/firebaseconfig';
import { fbGetBusinessesList } from '../../../../firebase/dev/businesses/fbGetBusinessesList';
import { userAccess } from '../../../../hooks/abilities/useAbilities';

const { RangePicker } = DatePicker;

const sanitizeNcf = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim().toUpperCase();
  }
  return '';
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

const formatDate = (date) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm') : 'Sin fecha');

const analyzeInvoices = (invoices) => {
  let invoicesWithNcf = 0;
  let missingNcf = 0;
  let skippedWithoutDate = 0;
  const lengthStatsMap = new Map();
  const duplicatesMap = new Map();
  const timelineEntries = [];

  invoices.forEach((invoice) => {
    const invoiceData = invoice?.data || {};
    const rawNcfValue = invoiceData?.NCF ?? invoice?.NCF ?? '';
    const ncf = sanitizeNcf(rawNcfValue);
    const invoiceNumberValue = invoiceData?.numberID ?? invoice?.numberID ?? invoice?.id ?? '';
    const invoiceNumber = typeof invoiceNumberValue === 'string' || typeof invoiceNumberValue === 'number'
      ? String(invoiceNumberValue).trim()
      : '';
    const invoiceDate = parseInvoiceDate(invoiceData?.date ?? invoice?.date ?? null);

    const entry = {
      invoiceId: invoice?.id || invoiceNumber || ncf,
      invoiceNumber,
      ncf,
      date: invoiceDate,
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

      const duplicateEntry = duplicatesMap.get(ncf) || { ncf, occurrences: [] };
      duplicateEntry.occurrences.push(entry);
      duplicatesMap.set(ncf, duplicateEntry);
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
    uniqueNcfCount: duplicatesMap.size,
    observedLengths,
    currentLength,
  };
};

export const Prueba = () => {
  const navigate = useNavigate();
  const { abilities, loading } = userAccess();
  const [processing, setProcessing] = useState(false);
  const [dateRange, setDateRange] = useState(() => {
    const end = dayjs();
    const start = end.subtract(30, 'day');
    return [start, end];
  });
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);

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
    if (!dateRange || dateRange.length !== 2 || !dateRange[0] || !dateRange[1]) {
      message.warning('Selecciona un rango de fechas.');
      return;
    }

    const start = dateRange[0].startOf('day');
    const end = dateRange[1].endOf('day');

    if (end.isBefore(start)) {
      message.warning('El rango de fechas no es valido.');
      return;
    }

    setProcessing(true);
    setResults([]);
    setErrors([]);

    try {
      const startDate = start.toDate();
      const endDate = end.toDate();
      const businesses = await fbGetBusinessesList();

      if (!businesses.length) {
        message.info('No se encontraron negocios para analizar.');
        setProcessing(false);
        return;
      }

      const aggregated = [];
      const issues = [];

      for (const business of businesses) {
        const businessName = business?.business?.name
          || business?.business?.fantasyName
          || business?.name
          || business?.id;

        try {
          const taxSettingsRef = doc(db, 'businesses', business.id, 'settings', 'taxReceipt');
          const taxSettingsSnap = await getDoc(taxSettingsRef);
          const taxEnabled = taxSettingsSnap.exists() && !!taxSettingsSnap.data()?.taxReceiptEnabled;

          if (!taxEnabled) {
            continue;
          }

          const invoicesRef = collection(db, 'businesses', business.id, 'invoices');
          const invoicesQuery = query(
            invoicesRef,
            where('data.date', '>=', startDate),
            where('data.date', '<=', endDate),
            orderBy('data.date', 'asc'),
          );

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
            message: businessError?.message || 'Fallo desconocido',
          });
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
        message.warning('Algunos negocios no se pudieron analizar. Revisa los avisos.');
      }
    } catch (error) {
      console.error('Error general al analizar comprobantes', error);
      message.error('Ocurrio un error al generar el analisis.');
      setErrors([{ businessId: 'general', businessName: 'General', message: error?.message || 'Fallo desconocido' }]);
      setResults([]);
    } finally {
      setProcessing(false);
    }
  }, [dateRange]);

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
        <RangePicker
          value={dateRange}
          onChange={(value) => setDateRange(value || [])}
          allowClear={false}
          disabled={processing}
          format="YYYY-MM-DD"
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
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <Spin tip="Analizando comprobantes..." />
        </div>
      )}

      {!processing && results.length === 0 && (
        <Empty description="Ejecuta el analisis para ver resultados." />
      )}

      {!processing && results.map((result) => (
        <Card key={result.businessId} style={{ marginBottom: 24 }}>
          <Space size={8} wrap style={{ marginBottom: 12 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {result.businessName}
            </Typography.Title>
            <Tag>{result.businessId}</Tag>
            {result.currentLength !== null && (
              <Tag color="blue">Longitud actual: {result.currentLength}</Tag>
            )}
            {result.observedLengths.length > 1 && (
              <Tag color="purple">Longitudes vistas: {result.observedLengths.join(', ')}</Tag>
            )}
          </Space>

          <Descriptions size="small" bordered column={1}>
            <Descriptions.Item label="Facturas analizadas">{result.totalInvoices}</Descriptions.Item>
            <Descriptions.Item label="Facturas con NCF">{result.invoicesWithNcf}</Descriptions.Item>
            <Descriptions.Item label="NCF unicos">{result.uniqueNcfCount}</Descriptions.Item>
            <Descriptions.Item label="Comprobantes faltantes">{result.missingNcf}</Descriptions.Item>
            {result.skippedWithoutDate ? (
              <Descriptions.Item label="Facturas sin fecha">{result.skippedWithoutDate}</Descriptions.Item>
            ) : null}
            <Descriptions.Item label="Comprobantes repetidos detectados">{result.duplicates.length}</Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 16 }}>
            <Typography.Title level={5}>Longitudes detectadas</Typography.Title>
            {result.ncfLengthStats.length ? (
              <List
                size="small"
                dataSource={result.ncfLengthStats}
                renderItem={(item) => (
                  <List.Item key={`${result.businessId}-length-${item.length}`}>
                    <Space size={8} wrap>
                      <Tag color="geekblue">Longitud {item.length}</Tag>
                      <span>{item.count} comprobantes</span>
                      <span>Primera factura: {item.firstDate ? formatDate(item.firstDate) : 'Sin fecha'}</span>
                      <span>Ultima factura: {item.lastDate ? formatDate(item.lastDate) : 'Sin fecha'}</span>
                      {item.missingDateCount ? <Tag color="orange">{item.missingDateCount} sin fecha</Tag> : null}
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Typography.Text type="secondary">Sin comprobantes con NCF en el rango seleccionado.</Typography.Text>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <Typography.Title level={5}>Cambios de longitud por fecha</Typography.Title>
            {result.lengthChangeEvents.length ? (
              <List
                size="small"
                dataSource={result.lengthChangeEvents}
                renderItem={(item, index) => (
                  <List.Item key={`${result.businessId}-change-${index}`}>
                    <div>
                      <strong>{formatDate(item.date)}:</strong> cambio de {item.fromLength} a {item.toLength} con {item.ncf}
                      {item.invoiceNumber ? ` (factura ${item.invoiceNumber})` : ''}.
                      {item.previousInvoiceNumber ? ` Registro previo: factura ${item.previousInvoiceNumber}` : ''}
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Typography.Text type="secondary">Sin cambios de longitud detectados en el rango.</Typography.Text>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <Typography.Title level={5}>Comprobantes repetidos</Typography.Title>
            {result.duplicates.length ? (
              <List
                size="small"
                dataSource={result.duplicates}
                renderItem={(duplicate) => {
                  const firstOccurrence = duplicate.occurrences[0];
                  const lastOccurrence = duplicate.occurrences[duplicate.occurrences.length - 1];
                  return (
                    <List.Item key={`${result.businessId}-dup-${duplicate.ncf}`}>
                      <div style={{ width: '100%' }}>
                        <Space size={8} wrap>
                          <Tag color="red">{duplicate.ncf}</Tag>
                          <span>{duplicate.count} facturas</span>
                          {firstOccurrence?.invoiceNumber ? (
                            <span>Primera factura {firstOccurrence.invoiceNumber}</span>
                          ) : null}
                          {firstOccurrence?.date ? (
                            <span>{formatDate(firstOccurrence.date)}</span>
                          ) : null}
                          {lastOccurrence?.invoiceNumber && lastOccurrence?.invoiceNumber !== firstOccurrence?.invoiceNumber ? (
                            <span>Ultima factura {lastOccurrence.invoiceNumber}</span>
                          ) : null}
                          {lastOccurrence?.date && lastOccurrence?.date !== firstOccurrence?.date ? (
                            <span>{formatDate(lastOccurrence.date)}</span>
                          ) : null}
                        </Space>
                        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                          {duplicate.occurrences.map((occurrence, index) => (
                            <li key={`${duplicate.ncf}-${occurrence.invoiceId || index}`}>
                              {occurrence.invoiceNumber ? `Factura ${occurrence.invoiceNumber}` : 'Factura sin numero'}
                              {' - '}
                              {formatDate(occurrence.date)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Typography.Text type="secondary">Sin comprobantes repetidos en el rango.</Typography.Text>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default Prueba;
