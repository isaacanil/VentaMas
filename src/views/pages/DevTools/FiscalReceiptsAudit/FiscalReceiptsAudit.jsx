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
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { fbGetBusinessesList } from '../../../../firebase/dev/businesses/fbGetBusinessesList';
import { db } from '../../../../firebase/firebaseconfig';
import { userAccess } from '../../../../hooks/abilities/useAbilities';
import { MenuApp } from '../../../templates/MenuApp/MenuApp';

import { toFriendlyFirestoreError } from './utils/errors';
import { exportBusinessWorkbook } from './utils/exportWorkbook';
import { analyzeInvoices } from './utils/invoiceAnalysis';
import { PRESETS, getRangeFromPreset } from './utils/presets';

export const FiscalReceiptsAudit = () => {
  const navigate = useNavigate();
  const { abilities, loading } = userAccess();
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressDone, setProgressDone] = useState(0);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [exportingBusiness, setExportingBusiness] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('last_90_days');
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const businessesWithDuplicates = results.filter(
    (item) => item.duplicates && item.duplicates.length > 0,
  );

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
        const businessName =
          business?.business?.name ||
          business?.business?.fantasyName ||
          business?.name ||
          business?.id;

        try {
          setCurrentBusiness(businessName);
          const taxSettingsRef = doc(
            db,
            'businesses',
            business.id,
            'settings',
            'taxReceipt',
          );
          const taxSettingsSnap = await getDoc(taxSettingsRef);
          const taxEnabled =
            taxSettingsSnap.exists() &&
            !!taxSettingsSnap.data()?.taxReceiptEnabled;

          if (!taxEnabled) {
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
              duplicatesNormalized: [],
              zeroCollapsedDuplicates: [],
              uniqueNcfCount: 0,
              observedLengths: [],
              currentLength: null,
            });
            continue;
          }

          const invoicesRef = collection(
            db,
            'businesses',
            business.id,
            'invoices',
          );
          let invoicesQuery;
          if (startDate && endDate) {
            invoicesQuery = query(
              invoicesRef,
              where('data.date', '>=', startDate),
              where('data.date', '<=', endDate),
              orderBy('data.date', 'asc'),
            );
          } else {
            invoicesQuery = query(invoicesRef, orderBy('data.date', 'asc'));
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
              duplicatesNormalized: [],
              zeroCollapsedDuplicates: [],
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
          console.error(
            `Error analizando negocio ${business?.id}`,
            businessError,
          );
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
        message.info(
          'No se encontraron negocios con comprobante habilitado en el rango seleccionado.',
        );
      }

      if (issues.length) {
        message.warning(
          `Algunos negocios no se pudieron analizar (${issues.length}). Revisa los avisos.`,
        );
      }
    } catch (error) {
      console.error('Error general al analizar comprobantes', error);
      message.error('Ocurrió un error al generar el análisis.');
      setErrors([
        {
          businessId: 'general',
          businessName: 'General',
          message: toFriendlyFirestoreError(error),
        },
      ]);
      setResults([]);
    } finally {
      setProcessing(false);
      setCurrentBusiness(null);
    }
  }, [selectedPreset]);

  const handleExportBusiness = async (businessResult) => {
    if (!businessResult?.duplicates?.length) {
      message.info(
        'Este negocio no tiene comprobantes duplicados para exportar.',
      );
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
    <>
      <MenuApp sectionName="Análisis comprobantes f..." />
      <div style={{ padding: 24 }}>
        <Typography.Title level={3} style={{ marginBottom: 8 }}>
          Analisis de comprobantes fiscales
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Ejecuta una revision de comprobantes en todos los negocios con la
          configuracion activa para detectar cambios de longitud y duplicados.
        </Typography.Paragraph>

        <Space size="small" wrap style={{ marginBottom: 16 }}>
          <Select
            value={selectedPreset}
            onChange={setSelectedPreset}
            options={PRESETS}
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
                <Typography.Text strong>
                  Analizando comprobantes...
                </Typography.Text>
                {currentBusiness ? (
                  <Typography.Text style={{ marginLeft: 8 }} type="secondary">
                    {currentBusiness}
                  </Typography.Text>
                ) : null}
              </div>
              <Progress
                percent={
                  progressTotal
                    ? Math.round((progressDone / progressTotal) * 100)
                    : 0
                }
                status="active"
              />
            </Space>
          </div>
        )}

        {!processing && !results.length && (
          <Empty description="Ejecuta el analisis para ver resultados." />
        )}

        {!processing &&
          results.length > 0 &&
          !businessesWithDuplicates.length && (
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
                  Exportando reporte de{' '}
                  <strong>{exportingBusiness.name}</strong>...
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
              const isExportingThis =
                exporting && exportingBusiness?.id === result.businessId;
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
                        <Typography.Text strong>
                          {result.businessName}
                        </Typography.Text>
                        <Tag>{result.businessId}</Tag>
                      </Space>
                    }
                    description={
                      <Space size={8} wrap>
                        <Tag color="red">{`${result.duplicates.length} NCF duplicados`}</Tag>
                        {result.duplicatesNormalized &&
                        result.duplicatesNormalized.length ? (
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
    </>
  );
};

export default FiscalReceiptsAudit;
