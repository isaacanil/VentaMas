import { Spin, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { VmAlert, VmButton, VmDropdown } from '@/components/heroui';
import {
  ApiOutlined,
  CheckOutlined,
  FileTextOutlined,
  SettingOutlined,
  StopOutlined,
  WarningOutlined,
} from '@/constants/icons/antd';
import { useDialog } from '@/Context/Dialog/useDialog';
import { selectBusinessData } from '@/features/auth/businessSlice';
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
import { filterPredefinedReceipts } from '@/utils/taxReceipt';

import AddReceiptDrawer from './components/AddReceiptModal/AddReceiptModal';
import { ElectronicTaxReceiptBusinessLinkSection } from './components/ElectronicTaxReceiptBusinessLinkSection/ElectronicTaxReceiptBusinessLinkSection';
import type { FiscalReceiptsAlertConfigState } from './components/FiscalReceiptsAlertSettings/FiscalReceiptsAlertSettings';
import FiscalReceiptsAlertWidget from './components/FiscalReceiptsAlertWidget/FiscalReceiptsAlertWidget';
import { ReceiptTableSection } from './components/ReceiptTableSection/ReceiptTableSection';
import TaxReceiptAuthorizationModal from './components/TaxReceiptAuthorizationModal/TaxReceiptAuthorizationModal';

const DEFAULT_QUANTITY_WARNING = 100;
const DEFAULT_QUANTITY_CRITICAL = 50;
const DEFAULT_EXPIRATION_WARNING = 30;
const DEFAULT_EXPIRATION_CRITICAL = 7;

type FiscalAttentionTone = 'neutral' | 'warning' | 'danger';

interface FiscalAttentionSummary {
  primaryIssue: string | null;
  tone: FiscalAttentionTone;
}

const parseReceiptQuantity = (value?: number | string): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const getReceiptLabel = (receipt: TaxReceiptDocument): string => {
  const name = receipt.data?.name?.trim();
  if (name) return name;

  const type = receipt.data?.type?.trim();
  const serie = receipt.data?.serie?.trim();
  return [type, serie].filter(Boolean).join('') || 'Serie sin nombre';
};

const hasCompleteFiscalRange = (receipt: TaxReceiptDocument): boolean => {
  const { quantity, sequence, serie, type } = receipt.data ?? {};
  return Boolean(
    type &&
    serie &&
    sequence !== undefined &&
    sequence !== null &&
    sequence !== '' &&
    quantity !== undefined &&
    quantity !== null &&
    quantity !== '',
  );
};

const buildFiscalAttentionSummary = (
  receipts: TaxReceiptDocument[],
  taxReceiptEnabled: boolean,
): FiscalAttentionSummary => {
  const activeReceipts = receipts.filter((item) => !item.data?.disabled);
  const depletedReceipts = activeReceipts.filter(
    (item) => parseReceiptQuantity(item.data?.quantity) === 0,
  );
  const incompleteReceipts = activeReceipts.filter(
    (item) =>
      parseReceiptQuantity(item.data?.quantity) !== 0 &&
      !hasCompleteFiscalRange(item),
  );

  if (!taxReceiptEnabled) {
    return {
      primaryIssue: null,
      tone: 'neutral',
    };
  }

  if (!activeReceipts.length) {
    return {
      primaryIssue: 'No hay series activas para emitir comprobantes.',
      tone: 'warning',
    };
  }

  if (depletedReceipts.length > 0) {
    return {
      primaryIssue: `${getReceiptLabel(depletedReceipts[0])} no tiene disponibilidad.`,
      tone: 'danger',
    };
  }

  if (incompleteReceipts.length > 0) {
    return {
      primaryIssue: `${getReceiptLabel(incompleteReceipts[0])} necesita completar su rango fiscal.`,
      tone: 'warning',
    };
  }

  return {
    primaryIssue: null,
    tone: 'neutral',
  };
};

export const TaxReceiptSetting = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const business = useSelector(selectBusinessData);
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const { taxReceipt, isLoading: loadingReceipts } = useFbGetTaxReceipt();
  const { setDialogConfirm, onClose } = useDialog();

  const baseReceipts = useMemo(() => {
    const serialized = serializeFirestoreDocuments(taxReceipt as any);
    return Array.isArray(serialized)
      ? (serialized as unknown as TaxReceiptDocument[])
      : [];
  }, [taxReceipt]);
  const [taxReceiptLocal, setTaxReceiptLocal] = useState<TaxReceiptDocument[]>(
    [],
  );
  const [hasLocalEdits, setHasLocalEdits] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [electronicLinkModalOpen, setElectronicLinkModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<FiscalAlertsConfig | null>(
    null,
  );
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
      } catch {
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

  const summaryMetrics = useMemo(
    () => buildFiscalAttentionSummary(itemsLocal, Boolean(taxReceiptEnabled)),
    [itemsLocal, taxReceiptEnabled],
  );

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
          warning:
            nextConfig.globalThresholds.warning ?? DEFAULT_QUANTITY_WARNING,
          critical:
            nextConfig.globalThresholds.critical ?? DEFAULT_QUANTITY_CRITICAL,
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
    <Spin spinning={isLoading} description={tip}>
      <Page>
        <HeroHeader>
          <HeaderCopy>
            <PageKicker>Fiscal</PageKicker>
            <PageTitle>Facturación fiscal</PageTitle>
            <PageDescription>
              Administra emisión NCF, rangos autorizados y preparación e-CF.
            </PageDescription>
          </HeaderCopy>
          <HeaderActions>
            <VmDropdown>
              <HeaderActionMenuButton variant="primary">
                <ButtonContent>
                  <SettingOutlined />
                  Acciones fiscales
                </ButtonContent>
              </HeaderActionMenuButton>
              <HeaderActionPopover placement="bottom end">
                <VmDropdown.Menu
                  aria-label="Acciones de facturación fiscal"
                  onAction={(key) => {
                    switch (String(key)) {
                      case 'templates':
                        handleOpenAddPredefinedReceipt();
                        break;
                      case 'alerts':
                        setAlertModalVisible(true);
                        break;
                      case 'sequence':
                        setAuthModalVisible(true);
                        break;
                      case 'toggleReceipts':
                        handleTaxReceiptEnabled();
                        break;
                      case 'electronicConfig':
                        setElectronicLinkModalOpen(true);
                        break;
                    }
                  }}
                >
                  <VmDropdown.Item id="templates" textValue="Agregar plantilla">
                    <ActionMenuItemLabel>
                      <ActionMenuItemIcon>
                        <FileTextOutlined />
                      </ActionMenuItemIcon>
                      <span>Agregar plantilla</span>
                    </ActionMenuItemLabel>
                  </VmDropdown.Item>
                  <VmDropdown.Item id="alerts" textValue="Configurar alertas">
                    <ActionMenuItemLabel>
                      <ActionMenuItemIcon>
                        <SettingOutlined />
                      </ActionMenuItemIcon>
                      <span>Configurar alertas</span>
                    </ActionMenuItemLabel>
                  </VmDropdown.Item>
                  <VmDropdown.Item
                    id="sequence"
                    textValue="Registrar secuencia DGII"
                  >
                    <ActionMenuItemLabel>
                      <ActionMenuItemIcon>
                        <FileTextOutlined />
                      </ActionMenuItemIcon>
                      <span>Registrar secuencia DGII</span>
                    </ActionMenuItemLabel>
                  </VmDropdown.Item>
                  <VmDropdown.Item
                    id="electronicConfig"
                    textValue="Configurar comprobante fiscal electrónico"
                  >
                    <ActionMenuItemLabel>
                      <ActionMenuItemIcon>
                        <ApiOutlined />
                      </ActionMenuItemIcon>
                      <span>Configurar comprobante fiscal electrónico</span>
                    </ActionMenuItemLabel>
                  </VmDropdown.Item>
                  <VmDropdown.Item
                    id="toggleReceipts"
                    textValue={
                      taxReceiptEnabled
                        ? 'Deshabilitar comprobantes fiscales'
                        : 'Habilitar comprobantes fiscales'
                    }
                    variant={taxReceiptEnabled ? 'danger' : 'default'}
                  >
                    <ActionMenuItemLabel>
                      <ActionMenuItemIcon>
                        {taxReceiptEnabled ? (
                          <StopOutlined />
                        ) : (
                          <CheckOutlined />
                        )}
                      </ActionMenuItemIcon>
                      <span>
                        {taxReceiptEnabled
                          ? 'Deshabilitar comprobantes fiscales'
                          : 'Habilitar comprobantes fiscales'}
                      </span>
                    </ActionMenuItemLabel>
                  </VmDropdown.Item>
                </VmDropdown.Menu>
              </HeaderActionPopover>
            </VmDropdown>
          </HeaderActions>
        </HeroHeader>

        <FiscalReceiptsAlertWidget
          alertConfig={alertConfig}
          loading={loadingAlertConfig}
          saving={savingAlertConfig}
          onSave={handleSaveAlertConfig}
          open={alertModalVisible}
          onOpenChange={setAlertModalVisible}
          hideTrigger
        />

        {summaryMetrics.primaryIssue && summaryMetrics.tone !== 'neutral' ? (
          <AttentionBanner
            data-tone={summaryMetrics.tone}
            status={summaryMetrics.tone}
          >
            <AttentionIcon>
              <WarningOutlined />
            </AttentionIcon>
            <AttentionCopy>
              <AttentionTitle>{summaryMetrics.primaryIssue}</AttentionTitle>
              <AttentionText>
                Revisa la disponibilidad o registra una secuencia DGII antes de
                continuar con la emisión fiscal.
              </AttentionText>
            </AttentionCopy>
            <VmButton
              variant="outline"
              onPress={() => setAuthModalVisible(true)}
            >
              Registrar secuencia
            </VmButton>
          </AttentionBanner>
        ) : null}

        <SectionCard>
          <ReceiptTableSection
            enabled={taxReceiptEnabled}
            itemsLocal={itemsLocal}
            setItemsLocal={setItemsLocal}
            isUnchanged={isUnchanged}
            actions={
              <VmButton
                variant="primary"
                onPress={handleOpenAddPredefinedReceipt}
              >
                <ButtonContent>
                  <FileTextOutlined />
                  Agregar desde plantilla
                </ButtonContent>
              </VmButton>
            }
          />
        </SectionCard>

        <Section>
          <SectionHeader>
            <SectionTitle>Comprobante fiscal electrónico</SectionTitle>
            <SectionDescription>
              Prepara el enlace e-CF con el proveedor sin mezclarlo con el
              catálogo de series.
            </SectionDescription>
          </SectionHeader>
          <ElectronicTaxReceiptBusinessLinkSection
            businessId={user?.businessID || user?.businessId || null}
            business={business as any}
            taxReceiptEnabled={Boolean(taxReceiptEnabled)}
            modalOpen={electronicLinkModalOpen}
            onModalOpenChange={setElectronicLinkModalOpen}
          />
        </Section>

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
  gap: var(--ds-space-5);
  padding: var(--ds-space-5);
  padding-bottom: calc(var(--ds-space-8) + env(safe-area-inset-bottom, 0px));
`;

const HeroHeader = styled.header`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: var(--ds-space-4);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`;

const HeaderCopy = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const PageKicker = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-color-text-tertiary);
`;

const PageTitle = styled.h2`
  margin: 0;
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-semibold);
  line-height: 1.2;
  color: var(--ds-color-text-primary);
`;

const PageDescription = styled.p`
  margin: 0;
  max-width: 680px;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--ds-space-2);

  @media (max-width: 760px) {
    justify-content: stretch;

    > button {
      flex: 1 1 180px;
    }
  }
`;

const HeaderActionMenuButton = styled(VmButton)`
  white-space: nowrap;
`;

const HeaderActionPopover = styled(VmDropdown.Popover)`
  min-width: 256px;
`;

const ActionMenuItemLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
`;

const ActionMenuItemIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
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

const AttentionBanner = styled(VmAlert)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border-color: var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-bg-surface);
  box-shadow: var(--ds-shadow-sm);

  @media (max-width: 760px) {
    grid-template-columns: auto minmax(0, 1fr);

    > button {
      grid-column: 1 / -1;
      width: 100%;
    }
  }
`;

const AttentionIcon = styled(VmAlert.Indicator)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
`;

const AttentionCopy = styled(VmAlert.Content)`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

const AttentionTitle = styled(VmAlert.Title)`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
`;

const AttentionText = styled(VmAlert.Description)`
  font-size: var(--ds-font-size-sm);
`;

const ButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
`;
