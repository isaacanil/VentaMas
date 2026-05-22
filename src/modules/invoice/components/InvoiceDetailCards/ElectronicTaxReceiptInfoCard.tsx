import {
  CopyOutlined,
  DownOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  GlobalOutlined,
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
  resolveElectronicTaxReceiptSnapshot,
  resolveElectronicTaxReceiptStatusKey,
  resolveElectronicTaxReceiptStatusLabel,
} from '@/utils/invoice/electronicTaxReceipt';

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

const cleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
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
  if (statusKey.includes('reject') || statusKey.includes('failed')) {
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
  const eNcf = cleanString(snapshot.eNcf);
  const submissionId = cleanString(snapshot.submissionId);
  const trackId =
    cleanString(snapshot.dgiiTrackId) || cleanString(snapshot.trackId);
  const securityCode = cleanString(snapshot.securityCode);
  const qrUrl = resolveQrUrl(snapshot);
  const statusUrl = cleanString(snapshot.links?.status);
  const xmlUrl = cleanString(snapshot.links?.xml);
  const signedXmlUrl = cleanString(snapshot.links?.signedXml);
  const pdfUrl = cleanString(snapshot.links?.pdf);
  const providerLabel = cleanString(snapshot.provider)
    ?.replace(/_/g, ' ')
    .toUpperCase();
  const documentType = cleanString(snapshot.documentType);

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
  addCopyAction('copy-qr', 'URL QR', qrUrl);
  addOpenAction('open-qr', 'Abrir consulta QR', qrUrl, <QrcodeOutlined />);
  addOpenAction(
    'open-status',
    'Abrir estado proveedor',
    statusUrl,
    <GlobalOutlined />,
  );
  addOpenAction('open-pdf', 'Abrir PDF', pdfUrl, <FilePdfOutlined />);
  addOpenAction('open-xml', 'Abrir XML', xmlUrl, <FileTextOutlined />);
  addOpenAction(
    'open-signed-xml',
    'Abrir XML firmado',
    signedXmlUrl,
    <FileTextOutlined />,
  );

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
    <Card className={className} aria-label="Información e-CF">
      <VmCard.Header>
        <MainRow>
          <TitleBlock>
            <TitleLine>
              <Title>e-CF</Title>
              <VmChip color={statusColor(snapshot)} variant="soft">
                <VmChip.Label>{statusLabel}</VmChip.Label>
              </VmChip>
            </TitleLine>
            <Subtitle>
              {providerLabel
                ? `Comprobante electrónico vía ${providerLabel}`
                : 'Comprobante electrónico'}
            </Subtitle>
          </TitleBlock>

          <Actions>
            <VmButton
              size="sm"
              variant="secondary"
              onPress={handleRefresh}
              isPending={refreshing}
              isDisabled={!submissionId}
            >
              <SyncOutlined />
              Consultar GISYS
            </VmButton>
            <VmDropdown>
              <VmButton
                size="sm"
                variant="secondary"
                isDisabled={actions.length === 0}
                aria-label="Acciones de e-CF"
              >
                Acciones <DownOutlined />
              </VmButton>
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
        <MetaGrid>
          <MetaItem>
            <MetaLabel>e-NCF</MetaLabel>
            <MetaValue $strong>{eNcf || 'Pendiente'}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>Tipo</MetaLabel>
            <MetaValue>{documentType || 'N/D'}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>TrackId</MetaLabel>
            <MetaValue>{trackId || 'DGII pendiente'}</MetaValue>
          </MetaItem>
          {securityCode ? (
            <MetaItem>
              <MetaLabel>Seguridad</MetaLabel>
              <MetaValue>{securityCode}</MetaValue>
            </MetaItem>
          ) : null}
        </MetaGrid>
      </VmCard.Content>
    </Card>
  );
};

const Card = styled(VmCard)`
  gap: var(--ds-space-2);
  padding: var(--ds-space-3) var(--ds-space-4);
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

const Title = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const Subtitle = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;
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

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: var(--ds-space-2);
`;

const MetaItem = styled.div`
  display: grid;
  min-width: 0;
  gap: 2px;
`;

const MetaLabel = styled.span`
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-tight);
  text-transform: uppercase;
`;

const MetaValue = styled.span<{ $strong?: boolean }>`
  overflow: hidden;
  color: var(--ds-color-text-primary);
  font-family: ${({ $strong }) =>
    $strong ? 'var(--ds-font-family-mono)' : 'inherit'};
  font-size: var(--ds-font-size-sm);
  font-weight: ${({ $strong }) =>
    $strong
      ? 'var(--ds-font-weight-semibold)'
      : 'var(--ds-font-weight-medium)'};
  line-height: var(--ds-line-height-tight);
  text-overflow: ellipsis;
  white-space: nowrap;
`;
