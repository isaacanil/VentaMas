import { useMemo } from 'react';
import styled from 'styled-components';

import { formatNumber } from '@/utils/format';

type PaymentDetailsLike = {
  paymentScope?: string;
  paymentOption?: string;
  clientId?: string;
  arId?: string;
};

type PaymentContextSummaryProps = {
  paymentDetails: PaymentDetailsLike;
  extra?: Record<string, unknown> | null;
  clientName?: string;
};

const asFiniteNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asText = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
};

const looksLikeSystemId = (value: string | null): boolean => {
  if (!value) return false;
  const compact = value.replace(/-/g, '');
  if (compact.length < 16) return false;
  const alphanumeric = /^[A-Za-z0-9_]+$/.test(compact);
  const hasLetters = /[A-Za-z]/.test(compact);
  const hasNumbers = /\d/.test(compact);
  return alphanumeric && hasLetters && hasNumbers;
};

const isGenericClient = (value: string | null | undefined): boolean =>
  Boolean(value && /generic client|cliente gen[ée]rico/i.test(value));

const resolveOptionLabel = (
  paymentScope?: string,
  paymentOption?: string,
): string => {
  if (paymentScope === 'balance') return 'Balance general';
  if (paymentOption === 'installment') return 'Cuota';
  if (paymentOption === 'balance') return 'Balance de cuenta';
  if (paymentOption === 'partial') return 'Abono a cuenta';
  return 'Pago a cuenta';
};

const resolveDocument = (extra?: Record<string, unknown> | null) => {
  const explicitLabel = asText(extra?.documentLabel);
  const originType = asText(extra?.originType)?.toLowerCase();
  const ncf = asText(extra?.ncf ?? extra?.NCF ?? extra?.comprobante);
  const invoiceNumberCandidates = [
    asText(extra?.documentNumber),
    asText(extra?.invoiceNumber),
    asText(extra?.numberID),
    asText(extra?.number),
  ].filter((item): item is string => Boolean(item && !looksLikeSystemId(item)));
  const preorderNumberCandidates = [
    asText(extra?.preorderNumber),
    asText(extra?.documentNumber),
    asText(extra?.invoiceNumber),
    asText(extra?.numberID),
    asText(extra?.number),
  ].filter((item): item is string => Boolean(item && !looksLikeSystemId(item)));

  const isPreorder = originType === 'preorder' && !ncf;
  const label = explicitLabel ?? (isPreorder ? 'Preventa' : 'Factura');
  const number = isPreorder
    ? preorderNumberCandidates[0]
    : (invoiceNumberCandidates[0] ?? preorderNumberCandidates[0]);

  return {
    label,
    value: number ? `#${number}` : 'N/A',
  };
};

const formatDocNumber = (value: unknown): string => {
  if (value === null || value === undefined) return 'N/A';
  const numberValue = Number(value);
  if (Number.isFinite(numberValue)) {
    const formatted = formatNumber(numberValue);
    return formatted ? `#${formatted}` : `#${numberValue}`;
  }
  return `#${String(value)}`;
};

export const PaymentContextSummary = ({
  paymentDetails,
  extra,
  clientName,
}: PaymentContextSummaryProps) => {
  const scope = paymentDetails.paymentScope;
  const option = paymentDetails.paymentOption;

  const accountNumber = extra?.numberId ?? extra?.arNumber ?? null;
  const totalInstallments = asFiniteNumber(extra?.totalInstallments);
  const paidInstallments = Array.isArray(extra?.paidInstallments)
    ? extra.paidInstallments.length
    : asFiniteNumber(extra?.paidInstallmentsCount);
  const hasInstallmentInfo = totalInstallments > 0;

  const modeLabel = resolveOptionLabel(scope, option);
  const document = resolveDocument(extra);
  const resolvedClient = useMemo(() => {
    const fromModalClient = asText(clientName);
    const fromExtraClient = asText(
      (extra?.clientName as string | undefined) ??
        (extra?.client as { name?: string } | undefined)?.name,
    );
    if (fromModalClient && !isGenericClient(fromModalClient)) {
      return fromModalClient;
    }
    return fromExtraClient ?? fromModalClient ?? 'N/A';
  }, [clientName, extra]);
  const arIdentifier = asText(accountNumber ?? paymentDetails.arId);

  return (
    <Card>
      <HeaderRow>
        <Title>Resumen de pago</Title>
        <ScopePill>{modeLabel}</ScopePill>
      </HeaderRow>

      <Grid>
        <Item>
          <Label>Cliente</Label>
          <Value>{resolvedClient}</Value>
        </Item>

        {scope === 'account' && (
          <Item>
            <Label>No. CxC</Label>
            <Value>{arIdentifier ? formatDocNumber(arIdentifier) : 'N/A'}</Value>
          </Item>
        )}

        {scope === 'account' && (
          <Item>
            <Label>{document.label}</Label>
            <Value>{document.value}</Value>
          </Item>
        )}

        {scope === 'account' && hasInstallmentInfo && (
          <Item>
            <Label>Cuotas pagadas</Label>
            <Value>
              {Math.min(paidInstallments, totalInstallments)}/{totalInstallments}
            </Value>
          </Item>
        )}

      </Grid>
    </Card>
  );
};

const Card = styled.div`
  display: grid;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Title = styled.span`
  color: #2f2f2f;
  font-size: 13px;
  font-weight: 700;
`;

const ScopePill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e6f4ff;
  color: #0958d9;
  font-size: 12px;
  font-weight: 600;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Item = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

const Label = styled.span`
  color: #727272;
  font-size: 11px;
  font-weight: 600;
`;

const Value = styled.span`
  color: #151515;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
