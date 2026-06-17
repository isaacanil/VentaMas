import {
  faShoppingCart,
  faReceipt,
  faPercentage,
  faShoppingBag,
  faTag,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import { toNumber } from '@/utils/number/toNumber';
import type { InvoiceData, InvoicePaymentMethod } from '@/types/invoice';

const PAYMENT_LABEL_TRANSLATIONS = {
  cash: 'Efectivo',
  efectivo: 'Efectivo',
  card: 'Tarjeta',
  tarjeta: 'Tarjeta',
  creditcard: 'Tarjeta',
  debitcard: 'Tarjeta',
  transfer: 'Transferencia',
  transferencia: 'Transferencia',
  transferbank: 'Transferencia',
  banktransfer: 'Transferencia',
  deposit: 'Depósito',
  deposito: 'Depósito',
  cheque: 'Cheque',
  check: 'Cheque',
};

const formatPaymentMethodLabel = (rawLabel: any) => {
  if (!rawLabel) return 'Método';
  const normalized = String(rawLabel)
    .toLowerCase()
    .replace(/[\s_-]/g, '');
  return PAYMENT_LABEL_TRANSLATIONS[normalized] ?? rawLabel;
};

export const InvoiceResume = ({
  invoice,
  onOpenPaymentInfo,
  isEditLocked = false,
}: {
  invoice: InvoiceData;
  onOpenPaymentInfo?: () => void;
  isEditLocked?: boolean;
}) => {
  const changeAmount = toNumber(invoice?.change?.value);
  const totalPurchase = toNumber(invoice?.totalPurchase?.value);
  const subtotal = toNumber(invoice?.totalPurchaseWithoutTaxes?.value);
  const taxes = toNumber(invoice?.totalTaxes?.value);
  const items = toNumber(invoice?.totalShoppingItems?.value);
  const discountPercentage = Number(invoice?.discount?.value ?? 0);

  const formattedSubtotal = formatPrice(subtotal);
  const formattedTaxes = formatPrice(taxes);
  const formattedTotal = formatPrice(totalPurchase);
  const formattedItems = Number(items).toLocaleString();

  const changeLabel = changeAmount >= 0 ? 'Cambio' : 'Pendiente';

  const changeHelper =
    changeAmount >= 0
      ? 'Cambio a devolver al cliente'
      : 'Monto pendiente por cobrar';

  const grossTotal = subtotal + taxes;
  const discountDifference = grossTotal - totalPurchase;
  const normalizedDiscount =
    discountDifference > 0 ? Math.round(discountDifference * 100) / 100 : 0;

  const discountPercentLabel = discountPercentage.toLocaleString('es-DO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: discountPercentage % 1 === 0 ? 0 : 2,
  });
  const discountHelperText =
    discountPercentage > 0
      ? `Ahorro del ${discountPercentLabel}% sobre el total`
      : 'Ajuste aplicado al total';
  const formattedDiscount =
    normalizedDiscount > 0 ? `-${formatPrice(normalizedDiscount)}` : '';

  type DetailItemStatus = 'discount' | 'primary' | 'returned' | 'pending';
  type DetailItem = {
    icon: IconDefinition;
    label: string;
    value: string;
    helper: string;
    status?: DetailItemStatus;
  };
  const detailItems: DetailItem[] = [
    {
      icon: faShoppingBag,
      label: 'Artículos vendidos',
      value: formattedItems,
      helper: 'Cantidad total de artículos',
    },
    {
      icon: faReceipt,
      label: 'Subtotal',
      value: formattedSubtotal,
      helper: 'Antes de impuestos',
    },
    {
      icon: faPercentage,
      label: 'Impuestos',
      value: formattedTaxes,
      helper: 'Impuestos facturados',
    },
  ];

  if (normalizedDiscount > 0) {
    detailItems.push({
      icon: faTag,
      label: 'Descuento aplicado',
      value: formattedDiscount || formatPrice(0),
      helper: discountHelperText,
      status: 'discount',
    });
  }

  detailItems.push({
    icon: faShoppingCart,
    label: 'Total Facturado',
    value: formattedTotal,
    helper: 'Monto final con descuentos',
    status: 'primary',
  });

  const paymentMethods: InvoicePaymentMethod[] = Array.isArray(
    invoice?.paymentMethod,
  )
    ? invoice.paymentMethod
    : [];
  const activePaymentMethods = paymentMethods.filter(
    (method) => method?.status,
  );

  const paymentBreakdown = activePaymentMethods.map((method) => {
    const amount = Number(method?.value) || 0;
    const rawLabel = method?.name || method?.method || 'Método';
    const label = formatPaymentMethodLabel(rawLabel);
    const helper = method?.reference ? `Ref: ${method.reference}` : null;

    return {
      label,
      helper,
      value: formatPrice(amount),
    };
  });

  const balanceSummary = {
    label: changeLabel,
    helper: changeHelper,
    value: formatPrice(Math.abs(changeAmount)),
    status: changeAmount >= 0 ? 'returned' : 'pending',
  };

  return (
    <Container>
      <ResumeCard>
        <CardHeader>
          <HeaderText>
            <HeaderTitle>Resumen de totales</HeaderTitle>
          </HeaderText>
          {onOpenPaymentInfo && (
            <HeaderActions>
              <Button
                type="primary"
                size="small"
                onClick={onOpenPaymentInfo}
                disabled={isEditLocked}
              >
                Editar pago
              </Button>
            </HeaderActions>
          )}
        </CardHeader>

        <CardBody>
          <Section>
            <SectionHeading>Detalle del cálculo</SectionHeading>
            <RowList>
              {detailItems.map((item) => (
                <Row key={item.label}>
                  <RowMain>
                    {/* <RowIcon data-status={item.status}>
                                            <FontAwesomeIcon icon={item.icon} />
                                        </RowIcon> */}
                    <RowText>
                      <RowLabel $status={item.status} $context="detail">
                        {item.label}
                      </RowLabel>
                      <RowHelper>
                        <Tooltip
                          title={item.helper}
                          placement="top"
                          trigger={['hover', 'click']}
                        >
                          <InfoIconButton
                            type="button"
                            aria-label={`Ver más información sobre ${item.label}`}
                          >
                            <FontAwesomeIcon icon={faCircleInfo} />
                          </InfoIconButton>
                        </Tooltip>
                      </RowHelper>
                    </RowText>
                  </RowMain>
                  <RowValue $status={item.status} $context="detail">
                    {item.value}
                  </RowValue>
                </Row>
              ))}
            </RowList>
          </Section>

          <PaymentSection>
            <SectionHeading>Métodos de pago</SectionHeading>
            <RowList>
              {paymentBreakdown.length > 0 ? (
                paymentBreakdown.map((item) => (
                  <Row key={item.label}>
                    <RowMain>
                      <RowText>
                        <RowLabel $context="detail">{item.label}</RowLabel>
                        {item.helper && (
                          <RowHelper>
                            <Tooltip
                              title={item.helper}
                              placement="top"
                              trigger={['hover', 'click']}
                            >
                              <InfoIconButton
                                type="button"
                                aria-label={`Ver información adicional de ${item.label}`}
                              >
                                <FontAwesomeIcon icon={faCircleInfo} />
                              </InfoIconButton>
                            </Tooltip>
                          </RowHelper>
                        )}
                      </RowText>
                    </RowMain>
                    <RowValue $context="detail">{item.value}</RowValue>
                  </Row>
                ))
              ) : (
                <EmptyRow>Sin métodos de pago registrados</EmptyRow>
              )}
            </RowList>

            <BalanceRow>
              <RowMain>
                <RowText>
                  <RowLabel $context="detail" $status={balanceSummary.status}>
                    {balanceSummary.label}
                  </RowLabel>
                  <RowHelper>
                    <Tooltip
                      title={balanceSummary.helper}
                      placement="top"
                      trigger={['hover', 'click']}
                    >
                      <InfoIconButton
                        type="button"
                        aria-label="Ver información adicional del balance"
                      >
                        <FontAwesomeIcon icon={faCircleInfo} />
                      </InfoIconButton>
                    </Tooltip>
                  </RowHelper>
                </RowText>
              </RowMain>
              <RowValue $context="detail" $status={balanceSummary.status}>
                {balanceSummary.value}
              </RowValue>
            </BalanceRow>
          </PaymentSection>
        </CardBody>
      </ResumeCard>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
`;

const ResumeCard = styled.div`
  overflow: hidden;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgb(15 23 42 / 6%);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const HeaderTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #262626;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
`;

const CardBody = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 3em;
  padding: 16px 24px 20px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionHeading = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #5d6d83;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const RowList = styled.div`
  display: grid;
  gap: 10px;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
`;

const RowMain = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const RowText = styled.div`
  display: flex;
  gap: 2px;
`;

const RowLabel = styled.div<{ $status?: string; $context?: string }>`
  font-size: ${(props: { $status?: string; $context?: string }) => {
    if (props.$context === 'detail') {
      if (
        props.$status === 'primary' ||
        props.$status === 'returned' ||
        props.$status === 'pending'
      )
        return '14px';
      return '12.5px';
    }
    return '13px';
  }};
  font-weight: ${(props: { $status?: string; $context?: string }) => {
    if (props.$context === 'detail') {
      if (
        props.$status === 'primary' ||
        props.$status === 'returned' ||
        props.$status === 'pending'
      )
        return 700;
      return 500;
    }
    return 600;
  }};
  color: ${(props: { $status?: string; $context?: string }) => {
    // Cambio en verde, Pendiente en rojo
    if (props.$status === 'returned') return '#237804';
    if (props.$status === 'pending') return '#d4380d';
    if (props.$context === 'detail' && props.$status === 'primary') {
      return '#1f2937';
    }
    return '#27364b';
  }};
`;

const RowHelper = styled.div`
  display: flex;
  gap: 0;
  align-items: center;
  justify-content: flex-start;
  color: #8a97ab;
`;

const RowValue = styled.div<{ $status?: string; $context?: string }>`
  min-width: 96px;
  font-size: ${(props: { $status?: string; $context?: string }) => {
    if (props.$context === 'detail') {
      if (
        props.$status === 'primary' ||
        props.$status === 'returned' ||
        props.$status === 'pending'
      )
        return '18px';
      return '14px';
    }
    return '15px';
  }};
  font-weight: ${(props: { $status?: string; $context?: string }) => {
    if (props.$context === 'detail') {
      if (
        props.$status === 'primary' ||
        props.$status === 'returned' ||
        props.$status === 'pending'
      )
        return 700;
      return 500;
    }
    return 600;
  }};
  color: ${(props: { $status?: string; $context?: string }) => {
    if (props.$status === 'returned') return '#237804';
    if (props.$status === 'balanced') return '#1f2933';
    if (props.$status === 'pending') return '#d4380d';
    if (props.$status === 'primary') return '#27364b';
    if (props.$status === 'discount') return '#d4380d';
    return '#1f2933';
  }};
  text-align: right;
`;

const InfoIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  font-size: 13px;
  color: #8a97ab;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 50%;
  transition: color 0.2s ease;

  &:hover,
  &:focus {
    color: #5d6d83;
  }

  &:focus-visible {
    outline: 2px solid rgb(39 54 75 / 40%);
    outline-offset: 2px;
  }
`;

const PaymentSection = styled(Section)``;

const BalanceRow = styled(Row)``;

const EmptyRow = styled.div`
  padding-left: 42px;
  font-size: 12px;
  color: #8a97ab;
`;
