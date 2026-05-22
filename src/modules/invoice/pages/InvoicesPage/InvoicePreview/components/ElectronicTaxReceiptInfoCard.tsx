import { Button, Descriptions, Tag, notification } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { fbRefreshElectronicTaxReceiptStatus } from '@/firebase/electronicTaxReceipts/fbRefreshElectronicTaxReceiptStatus';
import type { ElectronicTaxReceiptSnapshot, InvoiceData } from '@/types/invoice';
import {
  resolveElectronicTaxReceiptSnapshot,
  resolveElectronicTaxReceiptStatusLabel,
} from '@/utils/invoice/electronicTaxReceipt';

type Props = {
  businessId?: string | null;
  invoiceId?: string | null;
  invoiceData?: InvoiceData | null;
  onRefreshed?: (snapshot: ElectronicTaxReceiptSnapshot) => void;
};

const statusColor = (snapshot?: ElectronicTaxReceiptSnapshot | null) => {
  const rawStatus = String(
    snapshot?.dgiiValidationStatus ||
      snapshot?.dgiiStatus ||
      snapshot?.requestStatus ||
      snapshot?.status ||
      '',
  ).toLowerCase();
  if (rawStatus.includes('accepted')) return 'green';
  if (rawStatus.includes('reject') || rawStatus.includes('failed')) return 'red';
  if (rawStatus.includes('shadow')) return 'blue';
  return 'gold';
};

export const ElectronicTaxReceiptInfoCard = ({
  businessId,
  invoiceId,
  invoiceData,
  onRefreshed,
}: Props) => {
  const [refreshing, setRefreshing] = useState(false);
  const snapshot = resolveElectronicTaxReceiptSnapshot(invoiceData);
  const statusLabel =
    resolveElectronicTaxReceiptStatusLabel(snapshot) || 'Pendiente';

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
      onRefreshed?.(result.electronicTaxReceipt);
      notification.success({
        message: 'Estado e-CF actualizado',
        description: result.electronicTaxReceipt?.eNcf || result.submissionId,
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

  if (!snapshot) {
    return <EmptyMessage>Esta factura no tiene solicitud e-CF registrada.</EmptyMessage>;
  }

  return (
    <Card>
      <Header>
        <Tag color={statusColor(snapshot)}>{statusLabel}</Tag>
        <Button
          size="small"
          onClick={handleRefresh}
          loading={refreshing}
          disabled={!snapshot.submissionId}
        >
          Consultar GISYS
        </Button>
      </Header>
      <Descriptions size="small" column={1} bordered>
        <Descriptions.Item label="Tipo">
          {snapshot.documentType || 'N/D'}
        </Descriptions.Item>
        <Descriptions.Item label="e-NCF">
          {snapshot.eNcf || 'Pendiente'}
        </Descriptions.Item>
        <Descriptions.Item label="Submission">
          {snapshot.submissionId || 'N/D'}
        </Descriptions.Item>
        <Descriptions.Item label="TrackId">
          {snapshot.dgiiTrackId || snapshot.trackId || 'Pendiente'}
        </Descriptions.Item>
        <Descriptions.Item label="Código seguridad">
          {snapshot.securityCode || 'Pendiente'}
        </Descriptions.Item>
        <Descriptions.Item label="Último error">
          {snapshot.lastError || 'Sin error'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

const Card = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
`;

const EmptyMessage = styled.div`
  padding: 1rem;
  color: #666;
`;
