import {
  CopyOutlined,
  DownOutlined,
  QrcodeOutlined,
  SyncOutlined,
} from '@/constants/icons/antd';
import { message, notification } from 'antd';
import type { Key, ReactNode } from 'react';
import { useState } from 'react';
import styled from 'styled-components';

import { VmButton, VmCard, VmChip, VmDropdown } from '@/components/heroui';
import { fbRefreshElectronicTaxReceiptStatus } from '@/firebase/electronicTaxReceipts/fbRefreshElectronicTaxReceiptStatus';
import type {
  ElectronicTaxReceiptSnapshot,
  InvoiceData,
} from '@/types/invoice';
import {
  isElectronicTaxReceiptAcceptedByProvider,
  isRfceElectronicTaxReceipt,
  resolveElectronicTaxReceiptDiagnosticText,
  resolveElectronicTaxReceiptSnapshot,
  resolveElectronicTaxReceiptStatusKey,
  resolveElectronicTaxReceiptStatusLabel,
} from '@/modules/invoice/utils/electronicTaxReceipt';
import { cleanString } from '@/utils/text';

type Props = {
  businessId?: string | null;
  className?: string;
  invoiceId?: string | null;
  invoiceData?: InvoiceData | null;
  onRefreshed?: (snapshot: ElectronicTaxReceiptSnapshot) => void;
};

type MenuAction = {
  icon?: ReactNode;
  key: string;
  label: string;
  run: () => void;
};

const resolveQrUrl = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
): string | null => {
  if (!snapshot) return null;
  if (typeof snapshot.qr === 'string') return cleanString(snapshot.qr);
  return cleanString(snapshot.qr?.url);
};

const statusColor = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
): 'accent' | 'danger' | 'success' | 'warning' => {
  const statusKey = String(
    resolveElectronicTaxReceiptStatusKey(snapshot) || '',
  ).toLowerCase();
  const statusLabel = String(
    resolveElectronicTaxReceiptStatusLabel(snapshot) || '',
  ).toLowerCase();

  if (statusKey.includes('accepted')) return 'success';
  if (
    statusKey.includes('reject') ||
    statusKey.includes('failed') ||
    statusKey.includes('error')
  ) {
    return 'danger';
  }
  if (statusKey.includes('shadow')) return 'accent';
  if (statusKey === 'issued' && !statusLabel.includes('pendiente')) {
    return 'accent';
  }
  return 'warning';
};

const copyValue = async (label: string, value: string) => {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.clipboard?.writeText !== 'function'
  ) {
    message.error('El navegador no permite copiar en este contexto.');
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    message.success(`${label} copiado`);
  } catch {
    message.error(`No se pudo copiar ${label.toLowerCase()}.`);
  }
};

const openLink = (url: string) => {
  if (typeof window === 'undefined') return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const isAcceptedStatus = (statusKey: string): boolean =>
  statusKey === 'accepted' || statusKey === 'accepted_conditional';

export const ElectronicTaxReceiptInfoCard = ({
  businessId,
  className,
  invoiceId,
  invoiceData,
  onRefreshed,
}: Props) => {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedSnapshot, setRefreshedSnapshot] = useState<{
    invoiceId?: string | null;
    snapshot: ElectronicTaxReceiptSnapshot;
  } | null>(null);

  const invoiceSnapshot = resolveElectronicTaxReceiptSnapshot(invoiceData);
  const activeRefreshedSnapshot =
    refreshedSnapshot &&
    refreshedSnapshot.invoiceId === invoiceId &&
    refreshedSnapshot.snapshot
      ? refreshedSnapshot.snapshot
      : null;
  const snapshot = activeRefreshedSnapshot || invoiceSnapshot;

  if (!snapshot) return null;

  const statusLabel =
    resolveElectronicTaxReceiptStatusLabel(snapshot) || 'Pendiente';
  const statusKey = String(
    resolveElectronicTaxReceiptStatusKey(snapshot) || '',
  ).toLowerCase();
  const qrIsUsable = statusKey.includes('accepted');
  const documentType =
    cleanString(snapshot.documentType)?.toUpperCase() || null;
  const eNcf = cleanString(snapshot.eNcf);
  const submissionId = cleanString(snapshot.submissionId);
  const trackId =
    cleanString(snapshot.dgiiTrackId) || cleanString(snapshot.trackId);
  const rfceReference =
    cleanString(snapshot.rfceTrackId) ||
    (snapshot.rfceDgiiCode
      ? `Codigo ${snapshot.rfceDgiiCode}${
          cleanString(snapshot.rfceDgiiEstado)
            ? ` - ${cleanString(snapshot.rfceDgiiEstado)}`
            : ''
        }`
      : null);
  const qrUrl = resolveQrUrl(snapshot);
  const qrUrlLower = qrUrl?.toLowerCase() || '';
  const isRfceQr = qrUrlLower.includes('consultatimbrefc');
  const isRfceFlow =
    isRfceElectronicTaxReceipt(snapshot) ||
    isRfceQr ||
    (documentType === 'E32' && !trackId && isAcceptedStatus(statusKey));
  const evidenceReferenceLabel = trackId
    ? 'TrackID'
    : isRfceFlow
      ? 'RFCE'
      : 'TrackID';
  const evidenceReferenceValue =
    trackId ||
    rfceReference ||
    (isRfceFlow
      ? isAcceptedStatus(statusKey)
        ? 'RFCE aceptado'
        : 'RFCE pendiente'
      : 'DGII pendiente');
  const securityCode = cleanString(snapshot.securityCode);
  const acceptedByProvider = isElectronicTaxReceiptAcceptedByProvider(snapshot);
  const currentStatusColor = statusColor(snapshot);
  const diagnosticText = resolveElectronicTaxReceiptDiagnosticText(snapshot);
  const shouldShowDiagnostic =
    !acceptedByProvider &&
    (Boolean(diagnosticText) ||
      currentStatusColor === 'danger' ||
      Boolean(snapshot.manualReviewRequired));
  const diagnosticTitle =
    statusKey.includes('reject') || currentStatusColor === 'danger'
      ? 'Diagnóstico GISYS · Submission no aceptada'
      : 'Diagnóstico GISYS · Requiere atención';
  const fallbackDiagnosticDescription = isRfceFlow
    ? 'GISYS marcó esta submission como no aceptada. El QR fue generado pero no es válido fiscalmente hasta que DGII acepte el RFCE.'
    : 'GISYS marcó esta submission como no aceptada. El QR fue generado pero no es válido fiscalmente hasta que DGII acepte el e-CF.';
  const diagnosticDescription =
    diagnosticText || fallbackDiagnosticDescription;

  const actions: MenuAction[] = [];
  const addCopyAction = (key: string, label: string, value?: string | null) => {
    if (!value) return;
    actions.push({
      key,
      label: `Copiar ${label}`,
      icon: <CopyOutlined />,
      run: () => void copyValue(label, value),
    });
  };
  const addOpenAction = (
    key: string,
    label: string,
    url?: string | null,
    icon?: ReactNode,
  ) => {
    if (!url) return;
    actions.push({
      key,
      label,
      icon,
      run: () => openLink(url),
    });
  };

  addCopyAction('copy-encf', 'e-NCF', eNcf);
  addCopyAction('copy-submission', 'ID de envío', submissionId);
  addCopyAction('copy-track', 'TrackId', trackId);
  addCopyAction('copy-security', 'código de seguridad', securityCode);
  if (qrIsUsable) {
    addCopyAction('copy-qr', 'URL QR', qrUrl);
    addOpenAction('open-qr', 'Abrir consulta QR', qrUrl, <QrcodeOutlined />);
  }

  const actionByKey = new Map(actions.map((action) => [action.key, action]));

  const handleMenuAction = (key: Key) => {
    actionByKey.get(String(key))?.run();
  };

  const handleRefresh = async () => {
    if (!businessId || !invoiceId) {
      notification.error({
        message: 'No se puede consultar GISYS',
        description: 'Falta el negocio o la factura activa.',
      });
      return;
    }

    setRefreshing(true);
    try {
      const result = await fbRefreshElectronicTaxReceiptStatus({
        businessId,
        invoiceId,
      });
      setRefreshedSnapshot({
        invoiceId,
        snapshot: result.electronicTaxReceipt,
      });
      onRefreshed?.(result.electronicTaxReceipt);
      notification.success({
        message: 'Estado e-CF actualizado',
        description:
          result.electronicTaxReceipt?.eNcf || result.submissionId || invoiceId,
      });
    } catch (error: any) {
      notification.error({
        message: 'No se pudo consultar GISYS',
        description: error?.message || 'Intenta nuevamente.',
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card
      className={className}
      aria-label="Información e-CF"
      $isRejected={currentStatusColor === 'danger'}
    >
      <VmCard.Header>
        <MainRow>
          <TitleBlock>
            <TitleLine>
              <ECFTitle>e-CF</ECFTitle>
              <VmChip color={currentStatusColor} variant="soft">
                <VmChip.Label>{statusLabel}</VmChip.Label>
              </VmChip>
            </TitleLine>
          </TitleBlock>

          <Actions>
            <RefreshButton
              size="sm"
              variant="secondary"
              onPress={handleRefresh}
              isPending={refreshing}
              isDisabled={!submissionId}
              $isRejected={currentStatusColor === 'danger'}
            >
              <SyncOutlined />
              Consultar GISYS
            </RefreshButton>
            <VmDropdown>
              <ActionsDropdownButton
                size="sm"
                isDisabled={actions.length === 0}
                aria-label="Acciones de e-CF"
                $isRejected={currentStatusColor === 'danger'}
              >
                Acciones <DownOutlined />
              </ActionsDropdownButton>
              <ActionMenuPopover placement="bottom end">
                <VmDropdown.Menu
                  aria-label="Acciones de e-CF"
                  onAction={handleMenuAction}
                >
                  {actions.map((action) => (
                    <VmDropdown.Item
                      key={action.key}
                      id={action.key}
                      textValue={action.label}
                    >
                      <ActionMenuItemLabel>
                        {action.icon ? (
                          <ActionMenuItemIcon>{action.icon}</ActionMenuItemIcon>
                        ) : null}
                        <span>{action.label}</span>
                      </ActionMenuItemLabel>
                    </VmDropdown.Item>
                  ))}
                </VmDropdown.Menu>
              </ActionMenuPopover>
            </VmDropdown>
          </Actions>
        </MainRow>
      </VmCard.Header>

      <VmCard.Content>
        <DiagnosticBlock>
          {shouldShowDiagnostic ? (
            <DiagnosticCopy>
              <DiagnosticTitle>{diagnosticTitle}</DiagnosticTitle>
              <DiagnosticDescription>
                {diagnosticDescription}
              </DiagnosticDescription>
            </DiagnosticCopy>
          ) : null}
          <EvidenceTags>
            <EvidenceTag>
              <EvidenceTagLabel>{evidenceReferenceLabel}</EvidenceTagLabel>
              <EvidenceTagValue>{evidenceReferenceValue}</EvidenceTagValue>
            </EvidenceTag>
            {securityCode ? (
              <EvidenceTag>
                <EvidenceTagLabel>Seguridad</EvidenceTagLabel>
                <EvidenceTagValue>{securityCode}</EvidenceTagValue>
              </EvidenceTag>
            ) : null}
          </EvidenceTags>
        </DiagnosticBlock>
      </VmCard.Content>
    </Card>
  );
};

const Card = styled(VmCard)<{ $isRejected?: boolean }>`
  gap: var(--ds-space-2);
  padding: var(--ds-space-3) var(--ds-space-4);
  background: ${({ $isRejected }) =>
    $isRejected
      ? 'color-mix(in srgb, var(--ds-color-state-danger-subtle) 42%, var(--ds-color-bg-surface))'
      : 'var(--ds-color-bg-surface)'};
  border-color: ${({ $isRejected }) =>
    $isRejected
      ? 'var(--ds-color-state-danger)'
      : 'var(--ds-color-border-default)'};
`;

const MainRow = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: flex-start;
  justify-content: space-between;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const TitleBlock = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
`;

const TitleLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
`;

const ECFTitle = styled(VmCard.Title)`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;
`;

const actionSurfaceStyles = `
  background: var(--ds-color-bg-surface);
  border-color: var(--ds-color-border-default);
  box-shadow: var(--ds-shadow-xs);
`;

const RefreshButton = styled(VmButton)<{ $isRejected?: boolean }>`
  ${({ $isRejected }) => ($isRejected ? actionSurfaceStyles : '')}
`;

const ActionsDropdownButton = styled(VmDropdown.Button)<{
  $isRejected?: boolean;
}>`
  ${({ $isRejected }) => ($isRejected ? actionSurfaceStyles : '')}
`;

const ActionMenuPopover = styled(VmDropdown.Popover)`
  min-width: 190px;
`;

const ActionMenuItemLabel = styled.span`
  display: inline-flex;
  gap: var(--ds-space-2);
  align-items: center;
  color: var(--ds-color-text-primary);
`;

const ActionMenuItemIcon = styled.span`
  display: inline-flex;
  width: 16px;
  justify-content: center;
  color: var(--ds-color-text-secondary);
`;

const DiagnosticBlock = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const DiagnosticCopy = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const EvidenceTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  min-width: 0;
`;

const EvidenceTag = styled.span`
  display: inline-flex;
  gap: var(--ds-space-1);
  align-items: center;
  max-width: 100%;
  padding: var(--ds-space-1) var(--ds-space-2);
  color: var(--ds-color-text-primary);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-full);
  box-shadow: var(--ds-shadow-xs);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-tight);
`;

const EvidenceTagLabel = styled.span`
  flex-shrink: 0;
  color: var(--ds-color-text-muted);
  font-weight: var(--ds-font-weight-medium);
`;

const EvidenceTagValue = styled.span`
  min-width: 0;
  overflow: hidden;
  color: var(--ds-color-text-primary);
  font-weight: var(--ds-font-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DiagnosticTitle = styled.strong`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const DiagnosticDescription = styled.p`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
`;
