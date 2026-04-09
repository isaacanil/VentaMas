import { Card, Button, Modal } from 'antd';

import { InfoCircleOutlined } from '@ant-design/icons';
import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { PurchasePill } from '../PurchasePill/PurchasePill';

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  padding: 1rem 0;

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  background-color: #f8fafc;
  border-radius: 10px;
  border: 1px solid #edf2f7;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background-color: #ffffff;
    border-color: #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    transform: translateY(-1px);
  }
`;

const DetailLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const DetailValue = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
  min-height: 24px;
`;

import {
  selectPurchase,
  updateProduct,
} from '@/features/purchase/addPurchaseSlice';
import { useFbGetProviders } from '@/firebase/provider/useFbGetProvider';
import { formatQuantity } from '@/utils/formatters';
import type { Purchase, PurchaseReplenishment } from '@/utils/purchase/types';

import ProductsTable from '../ProductsTable';
import ReceiptHistorySection from './components/ReceiptHistorySection/ReceiptHistorySection';
import {
  formatReceiptDate,
  formatReceiptValue,
  resolveReceiptConditionLabel,
  resolveReceiptProvider,
  resolveReceiptWorkflowMeta,
} from './utils';



type PurchaseReplenishmentRow = PurchaseReplenishment & {
  key?: string | number;
};

interface PurchaseReceiptFormProps {
  initialReceivedMap?: Map<string | number, number>;
}

const NOOP_REMOVE_PRODUCT = (_payload: {
  id?: string;
  key?: string | number;
}) => undefined;
const NOOP_QUANTITY_CLICK = async (_record: PurchaseReplenishmentRow) =>
  undefined;

const PurchaseReceiptForm = ({ initialReceivedMap = new Map() }: PurchaseReceiptFormProps) => {
  const dispatch = useDispatch();
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const purchase = useSelector(selectPurchase) as unknown as Purchase;
  const { providers = [] } = useFbGetProviders();

  const replenishments = useMemo(
    () =>
      Array.isArray(purchase?.replenishments)
        ? (purchase.replenishments as PurchaseReplenishmentRow[])
        : [],
    [purchase],
  );

  const provider = useMemo(
    () => resolveReceiptProvider(purchase?.provider, providers),
    [providers, purchase?.provider],
  );

  const workflowMeta = useMemo(() => resolveReceiptWorkflowMeta(purchase), [purchase]);

  const handleProductUpdate = useCallback(
    ({
      index,
      ...updatedValues
    }: { index?: string | number } & Partial<PurchaseReplenishmentRow>) => {
      dispatch(updateProduct({ value: updatedValues, index }));
    },
    [dispatch],
  );

  const noteValue =
    typeof purchase?.note === 'string' && purchase.note.trim()
      ? purchase.note.trim()
      : null;

  return (
    <ReceiptLayout>
      <CompactHeader>
        <HeaderLeft>
          <ProviderTitle>
            {formatReceiptValue(provider.name, 'Sin proveedor')}
          </ProviderTitle>
          <HeaderBadges>
            <PurchasePill>
              Compra #{formatReceiptValue(purchase?.numberId ?? purchase?.id, '...')}
            </PurchasePill>
            <PurchasePill>{workflowMeta.label}</PurchasePill>
            {purchase?.deliveryAt && (
              <DeliveryInfo>
                <Label>Entrega:</Label> {formatReceiptDate(purchase?.deliveryAt)}
              </DeliveryInfo>
            )}
          </HeaderBadges>
        </HeaderLeft>
        <HeaderActions>
          <Button
            icon={<InfoCircleOutlined />}
            onClick={() => setIsDetailsVisible(true)}
          >
            Información de la compra
          </Button>
        </HeaderActions>
      </CompactHeader>



      <Modal
        title="Información Administrativa de la Compra"
        open={isDetailsVisible}
        onCancel={() => setIsDetailsVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsDetailsVisible(false)}>
            Cerrar
          </Button>,
        ]}
        width={650}
        centered
      >
        <DetailGrid>
          <DetailItem>
            <DetailLabel>RNC / Identificación</DetailLabel>
            <DetailValue>{formatReceiptValue(provider.rnc)}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Tipo de Comprobante</DetailLabel>
            <DetailValue>{formatReceiptValue(provider.voucherType)}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Condición de Pago</DetailLabel>
            <DetailValue>{resolveReceiptConditionLabel(purchase?.condition)}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Número de Factura</DetailLabel>
            <DetailValue>{formatReceiptValue(purchase?.invoiceNumber)}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>NCF / Comprobante</DetailLabel>
            <DetailValue>{formatReceiptValue(purchase?.proofOfPurchase)}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>ID de Pedido</DetailLabel>
            <DetailValue>{formatReceiptValue(purchase?.orderId)}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Fecha de Pago Estimada</DetailLabel>
            <DetailValue>{formatReceiptDate(purchase?.paymentAt)}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Total de Productos</DetailLabel>
            <DetailValue>{formatQuantity(replenishments.length, 0)}</DetailValue>
          </DetailItem>
        </DetailGrid>
      </Modal>

      {noteValue ? (
        <StyledCard title="Nota de la compra">
          <NoteText>{noteValue}</NoteText>
        </StyledCard>
      ) : null}

      <StyledCard
        title="Recepción de Productos"
        extra={<CardHint>Registra las cantidades que están entrando ahora</CardHint>}
      >
        <ProductsTable
          products={replenishments}
          onEditProduct={handleProductUpdate}
          removeProduct={NOOP_REMOVE_PRODUCT}
          onQuantityClick={NOOP_QUANTITY_CLICK}
          mode="complete"
          initialReceivedMap={initialReceivedMap}
        />
      </StyledCard>

      <ReceiptHistorySection receiptHistory={purchase?.receiptHistory} />
    </ReceiptLayout>
  );
};

export default PurchaseReceiptForm;

const ReceiptLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StyledCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  overflow: hidden;

  .ant-card-head {
    min-height: auto;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .ant-card-head-title {
    padding: 0;
    font-size: 16px;
    font-weight: 600;
    color: #262626;
  }

  .ant-card-extra {
    padding: 0;
  }

  .ant-card-body {
    padding: 0;
  }

  @media (max-width: 576px) {
    .ant-card-head {
      padding: 10px 14px;
    }

    .ant-card-head-title {
      font-size: 15px;
    }
  }
`;

const CompactHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 2px solid #f0f2f5;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProviderTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #141414;
  letter-spacing: -0.02em;

  @media (max-width: 576px) {
    font-size: 20px;
  }
`;

const HeaderBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const DeliveryInfo = styled.span`
  font-size: 13px;
  color: #595959;
`;

const Label = styled.span`
  font-weight: 600;
  color: #8c8c8c;
  text-transform: uppercase;
  font-size: 11px;
`;

const HeaderActions = styled.div``;

const NoteText = styled.p`
  margin: 0;
  padding: 0 24px 24px;
  font-size: 14px;
  line-height: 1.6;
  color: #434343;
  white-space: pre-wrap;

  @media (max-width: 576px) {
    padding: 0 16px 16px;
  }
`;


const CardHint = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #8c8c8c;
`;
