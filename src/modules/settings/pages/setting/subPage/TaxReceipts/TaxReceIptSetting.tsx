import { Button, Spin, Typography, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { useDialog } from '@/Context/Dialog/useDialog';
import { selectUser } from '@/features/auth/userSlice';
import {
  getTaxReceiptData,
  selectTaxReceiptEnabled,
} from '@/features/taxReceipt/taxReceiptSlice';
import { fbGetFiscalAlertsConfig } from '@/firebase/Settings/fiscalAlertsConfig/fbGetFiscalAlertsConfig';
import type { FiscalAlertsConfig } from '@/firebase/Settings/fiscalAlertsConfig/types';
import { fbUpdateFiscalAlertsConfig } from '@/firebase/Settings/fiscalAlertsConfig/fbUpdateFiscalAlertsConfig';
import { fbEnabledTaxReceipt } from '@/firebase/Settings/taxReceipt/fbEnabledTaxReceipt';
import { useFbGetTaxReceipt } from '@/firebase/taxReceipt/fbGetTaxReceipt';
import { useCompareArrays } from '@/hooks/useCompareArrays';
import { useLoadingStatus } from '@/hooks/useLoadingStatus';
import { serializeFirestoreDocuments } from '@/utils/serialization/serializeFirestoreData';
import type { TaxReceiptDocument } from '@/types/taxReceipt';
import {
  filterPredefinedReceipts,
  generateNewTaxReceipt,
} from '@/utils/taxReceipt';

import AddReceiptDrawer from './components/AddReceiptModal/AddReceiptModal';
import type { FiscalReceiptsAlertConfigState } from './components/FiscalReceiptsAlertSettings/FiscalReceiptsAlertSettings';
import FiscalReceiptsAlertWidget from './components/FiscalReceiptsAlertWidget/FiscalReceiptsAlertWidget';
import { ReceiptSettingsSection } from './components/ReceiptSettingsSection/ReceiptSettingsSection';
import { ReceiptTableSection } from './components/ReceiptTableSection/ReceiptTableSection';
import TaxReceiptAuthorizationModal from './components/TaxReceiptAuthorizationModal/TaxReceiptAuthorizationModal';
const { Title, Paragraph } = Typography;

const DEFAULT_QUANTITY_WARNING = 100;
const DEFAULT_QUANTITY_CRITICAL = 50;
const DEFAULT_EXPIRATION_WARNING = 30;
const DEFAULT_EXPIRATION_CRITICAL = 7;

export const TaxReceiptSetting = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const { taxReceipt, isLoading: loadingReceipts } = useFbGetTaxReceipt();
  const { setDialogConfirm, onClose } = useDialog();

  const baseReceipts = useMemo(() => {
    const serialized = serializeFirestoreDocuments(taxReceipt);
    return Array.isArray(serialized)
      ? (serialized as TaxReceiptDocument[])
      : [];
  }, [taxReceipt]);
  const [taxReceiptLocal, setTaxReceiptLocal] = useState<TaxReceiptDocument[]>(
    [],
  );
  const [hasLocalEdits, setHasLocalEdits] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<FiscalAlertsConfig | null>(null);
  const [loadingAlertConfig, setLoadingAlertConfig] = useState(true);
  const [savingAlertConfig, setSavingAlertConfig] = useState(false);

  const arraysAreEqual = useCompareArrays(taxReceiptLocal, baseReceipts);

  useEffect(() => {
    dispatch(getTaxReceiptData(baseReceipts));
  }, [baseReceipts, dispatch]);

  useEffect(() => {
    let ignore = false;

    const loadAlertConfig = async () => {
      setLoadingAlertConfig(true);

      try {
        const nextConfig = await fbGetFiscalAlertsConfig(user);
        if (!ignore) {
          setAlertConfig(nextConfig);
        }
      } catch (error) {
        if (!ignore) {
          message.error('No se pudo cargar la configuración de alertas.');
        }
      }

      if (!ignore) {
        setLoadingAlertConfig(false);
      }
    };

    void loadAlertConfig();

    return () => {
      ignore = true;
    };
  }, [user]);

  const isDirty = hasLocalEdits && !arraysAreEqual;
  const itemsLocal = isDirty ? taxReceiptLocal : baseReceipts;

  const setItemsLocal = useCallback(
    (
      next:
        | TaxReceiptDocument[]
        | ((prev: TaxReceiptDocument[]) => TaxReceiptDocument[]),
    ) => {
      const wasDirty = hasLocalEdits;
      setHasLocalEdits(true);

      if (typeof next !== 'function') {
        setTaxReceiptLocal(next);
        return;
      }

      setTaxReceiptLocal((prev) => {
        const source = wasDirty ? prev : baseReceipts;
        return next(source);
      });
    },
    [baseReceipts, hasLocalEdits],
  );

  const isUnchanged = useCompareArrays(itemsLocal, baseReceipts);

  const handleTaxReceiptEnabled = () => {
    if (taxReceiptEnabled) {
      setDialogConfirm({
        title: '¿Deshabilitar comprobantes?',
        isOpen: true,
        type: 'warning',
        message:
          'Si deshabilitas los comprobantes, no se mostrarán en el punto de venta.',
        onConfirm: () => {
          fbEnabledTaxReceipt(user);
          onClose();
        },
      });
    } else {
      fbEnabledTaxReceipt(user);
    }
  };

  const handleAddNewTaxReceipt = () => {
    const newItem = generateNewTaxReceipt(itemsLocal);
    setItemsLocal([...itemsLocal, newItem]);
    message.success(
      'Nuevo comprobante agregado. No olvides guardar los cambios.',
    );
  };

  const handleOpenAddPredefinedReceipt = () => setIsAddModalVisible(true);
  const handleCloseAddPredefinedReceipt = () => setIsAddModalVisible(false);

  const handleAddPredefinedReceipts = (newReceipts) => {
    const { unique, duplicateNames, duplicateSeries } =
      filterPredefinedReceipts(newReceipts, itemsLocal);

    let warningMsg = '';
    if (duplicateNames.length) {
      warningMsg += `Se omitieron ${duplicateNames.length} comprobante(s) con nombre(s) duplicado(s): ${duplicateNames.join(', ')}. `;
    }
    if (duplicateSeries.length) {
      warningMsg += `Se omitieron ${duplicateSeries.length} comprobante(s) con serie(s) duplicada(s): ${duplicateSeries.join(', ')}.`;
    }
    if (warningMsg) {
      message.warning(warningMsg);
    }

    if (unique.length) {
      setItemsLocal([...itemsLocal, ...unique]);
      message.success(
        `${unique.length} comprobante(s) añadidos correctamente. No olvides guardar los cambios.`,
      );
    } else if (!warningMsg) {
      message.error(
        'No se agregaron comprobantes. Todos ya existen en el sistema.',
      );
    }
  };

  const summaryMetrics = useMemo(() => {
    const activeCount = itemsLocal.filter((item) => !item.data?.disabled).length;
    const archivedCount = itemsLocal.filter((item) => item.data?.disabled).length;
    return {
      status: taxReceiptEnabled ? 'Activo' : 'Inactivo',
      mode: 'NCF',
      activeCount,
      archivedCount,
    };
  }, [itemsLocal, taxReceiptEnabled]);

  const handleSaveAlertConfig = useCallback(
    async (nextConfig: FiscalReceiptsAlertConfigState) => {
      if (!user?.businessID) {
        message.error('No se encontró un negocio válido para guardar alertas.');
        return;
      }

      const configToPersist: FiscalAlertsConfig = {
        alertsEnabled: nextConfig.alertsEnabled,
        monitoring: {
          quantityEnabled: nextConfig.monitoring.quantityEnabled,
          expirationEnabled: nextConfig.monitoring.expirationEnabled,
        },
        globalThresholds: {
          warning: nextConfig.globalThresholds.warning ?? DEFAULT_QUANTITY_WARNING,
          critical: nextConfig.globalThresholds.critical ?? DEFAULT_QUANTITY_CRITICAL,
        },
        customThresholds: Object.entries(nextConfig.customThresholds).reduce<
          FiscalAlertsConfig['customThresholds']
        >((acc, [key, threshold]) => {
          const warning =
            threshold.warning ??
            nextConfig.globalThresholds.warning ??
            DEFAULT_QUANTITY_WARNING;
          const critical =
            threshold.critical ??
            nextConfig.globalThresholds.critical ??
            DEFAULT_QUANTITY_CRITICAL;

          acc[key] = {
            warning,
            critical: Math.min(critical, Math.max(warning - 1, 1)),
          };
          return acc;
        }, {}),
        expirationThresholds: {
          warning:
            nextConfig.expirationThresholds.warning ??
            DEFAULT_EXPIRATION_WARNING,
          critical:
            nextConfig.expirationThresholds.critical ??
            DEFAULT_EXPIRATION_CRITICAL,
        },
        customExpirationThresholds: Object.entries(
          nextConfig.customExpirationThresholds,
        ).reduce<FiscalAlertsConfig['customExpirationThresholds']>(
          (acc, [key, threshold]) => {
            const warning =
              threshold.warning ??
              nextConfig.expirationThresholds.warning ??
              DEFAULT_EXPIRATION_WARNING;
            const critical =
              threshold.critical ??
              nextConfig.expirationThresholds.critical ??
              DEFAULT_EXPIRATION_CRITICAL;

            acc[key] = {
              warning,
              critical: Math.min(critical, Math.max(warning - 1, 1)),
            };
            return acc;
          },
          {},
        ),
        channels: {
          notificationCenter: nextConfig.channels.notificationCenter,
          popupOnCritical: nextConfig.channels.popupOnCritical,
          email: nextConfig.channels.email,
        },
        execution: {
          checkFrequencyMinutes: Math.max(
            5,
            nextConfig.execution.checkFrequencyMinutes,
          ),
          suppressRepeatedNotifications:
            nextConfig.execution.suppressRepeatedNotifications,
        },
        lastUpdated: alertConfig?.lastUpdated ?? null,
        version: alertConfig?.version ?? '2.0',
      };

      setSavingAlertConfig(true);

      try {
        await fbUpdateFiscalAlertsConfig(user, configToPersist);
        setAlertConfig({
          ...configToPersist,
          lastUpdated: new Date(),
          version: '2.0',
        });
        message.success('Configuración de alertas guardada.');
        setSavingAlertConfig(false);
      } catch (error) {
        console.error('Error al guardar configuración de alertas:', error);
        message.error('No se pudo guardar la configuración de alertas.');
        setSavingAlertConfig(false);
        throw error;
      }
    },
    [alertConfig?.lastUpdated, alertConfig?.version, user],
  );

  // Definimos entradas para el control de carga con valores explícitos
  const loadEntries = [
    {
      loading: loadingReceipts === true,
      tip: 'Cargando comprobantes fiscales...',
    },
    {
      loading: loadingAlertConfig === true,
      tip: 'Cargando configuración de alertas...',
    },
  ];

  // Utilizamos useLoadingStatus para centralizar la lógica de carga
  const { isLoading, tip } = useLoadingStatus(loadEntries);
  return (
    <Spin spinning={isLoading} tip={tip}>
      <Page>
        <Head>
          <Title
            level={3}
            style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}
          >
            Facturación fiscal
          </Title>
          <Paragraph
            style={{
              fontSize: '16px',
              margin: 0,
              lineHeight: '1.5',
              color: 'var(--ds-color-text-secondary)',
            }}
          >
            Administra la emisión de NCF, sus series y los rangos autorizados por DGII.
          </Paragraph>
        </Head>

        <SectionCard>
          <SectionTitle>Estado fiscal</SectionTitle>
          <SummaryGrid>
            <SummaryItem>
              <SummaryLabel>Estado general</SummaryLabel>
              <SummaryValue>{summaryMetrics.status}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Modo</SummaryLabel>
              <SummaryValue>{summaryMetrics.mode}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Series activas</SummaryLabel>
              <SummaryValue>{summaryMetrics.activeCount}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Series archivadas</SummaryLabel>
              <SummaryValue>{summaryMetrics.archivedCount}</SummaryValue>
            </SummaryItem>
          </SummaryGrid>
        </SectionCard>

        <Section>
          <SectionHeader>
            <SectionTitle>Activación y alcance</SectionTitle>
            <SectionDescription>
              Controla si el negocio puede emitir comprobantes fiscales.
            </SectionDescription>
          </SectionHeader>
          <ReceiptSettingsSection
            enabled={taxReceiptEnabled}
            onToggle={handleTaxReceiptEnabled}
          />
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Series y tipos de comprobante</SectionTitle>
            <SectionDescription>
              Gestiona las series activas y el catálogo fiscal operativo.
            </SectionDescription>
          </SectionHeader>
          <ReceiptTableSection
            enabled={taxReceiptEnabled}
            itemsLocal={itemsLocal}
            setItemsLocal={setItemsLocal}
            isUnchanged={isUnchanged}
            onAddBlank={handleAddNewTaxReceipt}
          />
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Alertas y secuencias DGII</SectionTitle>
            <SectionDescription>
              Configura alertas por agotamiento y vencimiento, y registra rangos autorizados por serie.
            </SectionDescription>
          </SectionHeader>
          <TwoColumn>
            <FiscalReceiptsAlertWidget
              taxReceipts={itemsLocal}
              alertConfig={alertConfig}
              loading={loadingAlertConfig}
              saving={savingAlertConfig}
              onSave={handleSaveAlertConfig}
            />
            <ActionButton
              type="default"
              onClick={() => setAuthModalVisible(true)}
              size="large"
            >
              Registrar secuencia DGII
            </ActionButton>
          </TwoColumn>
        </Section>

        <SectionCard>
          <SectionTitle>Enlaces relacionados</SectionTitle>
          <SectionDescription>
            Accesos secundarios para plantillas y recursos fiscales.
          </SectionDescription>
          <LinkRow>
            <Button type="link" onClick={handleOpenAddPredefinedReceipt}>
              Plantillas de comprobantes
            </Button>
          </LinkRow>
        </SectionCard>

        <AddReceiptDrawer
          visible={isAddModalVisible}
          onCancel={handleCloseAddPredefinedReceipt}
          onAddReceipt={handleAddPredefinedReceipts}
          existingReceipts={itemsLocal}
        />

        <TaxReceiptAuthorizationModal
          visible={authModalVisible}
          onCancel={() => setAuthModalVisible(false)}
          taxReceipts={itemsLocal}
          onAuthorizationAdded={(updatedReceipt) => {
            const newArray = itemsLocal.map((item) =>
              item.data.id === updatedReceipt.id
                ? { ...item, data: updatedReceipt }
                : item,
            );
            setItemsLocal(newArray);
          }}
        />
      </Page>
    </Spin>
  );
};

const Page = styled.div`
  display: grid;
  gap: var(--ds-space-6);
  padding: var(--ds-space-5);
`;
const Head = styled.div`
  display: grid;
  width: 100%;
`;

const Section = styled.section`
  display: grid;
  gap: var(--ds-space-3);
`;

const SectionCard = styled.section`
  display: grid;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border-radius: var(--ds-radius-lg);
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
`;

const SectionHeader = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const SectionDescription = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const SummaryGrid = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
`;

const SummaryItem = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const SummaryLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ds-color-text-tertiary);
`;

const SummaryValue = styled.span`
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const TwoColumn = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  align-items: start;
`;

const LinkRow = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: center;
`;

const ActionButton = styled(Button)`
  width: 100%;
  height: 48px;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  border-radius: var(--ds-radius-lg);
`;
