import { InfoCircleOutlined } from '@/constants/icons/antd';
import { Form, InputNumber, Select, Space, Tooltip, Typography } from 'antd';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { FocusEvent } from 'react';
import styled from 'styled-components';

import { selectCartTaxationEnabled } from '@/features/cart/cartSlice';
import {
  normalizeProductPricingCurrency,
  type ProductPricingCurrency,
  type ProductPricingFormValues,
} from '@/domain/products/pricingForm';
import { shouldSelectZeroPriceInput } from '@/domain/products/priceInputFocus';
import { initTaxes, taxLabel } from '@/domain/products/productDefaults';
import {
  FieldGrid,
  SectionCard,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from '@/modules/dev/pages/DevTools/ProductStudio/components/SectionLayout';
import { isUnsetOptionalPriceValue } from './pricingSectionValidation';

const { Text } = Typography;

type PriceRowKey =
  | 'listPrice'
  | 'midPrice'
  | 'minPrice'
  | 'cardPrice'
  | 'offerPrice';

type PricingValues = ProductPricingFormValues;

interface PricingSectionProps {
  domId: string;
  pricingValues?: PricingValues;
}

const EMPTY_PRICING_VALUES: PricingValues = {};

const CURRENCY_OPTIONS: Array<{
  value: ProductPricingCurrency;
  label: string;
}> = [
  { value: 'DOP', label: 'DOP - Peso dominicano' },
  { value: 'USD', label: 'USD - Dólar estadounidense' },
];

const TAX_OPTIONS = initTaxes.map((tax) => ({
  value: tax,
  label: taxLabel(tax),
}));

interface PriceRow {
  key: PriceRowKey;
  label: string;
  note?: string;
  required?: boolean;
  tooltip?: string;
}

interface PriceRowWithMetrics extends PriceRow {
  amount: number | null;
  taxAmount: number | null;
  total: number | null;
  margin: number | null;
  gainPercent: number | null;
}

interface PriceTableRowProps {
  $header?: boolean;
}

const PriceTableWrapper = styled.div`
  margin-top: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
`;

const PriceTableRow = styled.div<PriceTableRowProps>`
  display: grid;
  grid-template-columns: 1.5fr 1.5fr repeat(3, 1.1fr);
  gap: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: ${({ $header }) => ($header ? 600 : 500)};
  color: ${({ $header }) => ($header ? '#0f172a' : '#334155')};
  text-transform: ${({ $header }) => ($header ? 'uppercase' : 'none')};
  background: ${({ $header }) => ($header ? '#f8fafc' : '#fff')};
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
  }

  span.numeric-header {
    display: block;
    text-align: right;
  }
`;

const LabelCell = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  font-weight: 600;

  span.label {
    display: flex;
    gap: 4px;
    align-items: center;
    font-weight: 600;
  }

  span.asterisk {
    color: #dc2626;
  }

  span.note {
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
  }
`;

const InfoIcon = styled(InfoCircleOutlined)`
  font-size: 14px;
  color: #94a3b8;
  cursor: help;
`;

const NumericCell = styled.span`
  display: block;
  font-variant-numeric: tabular-nums;
  color: #0f172a;
  text-align: right;
`;

const GainCell = styled.span<{ $isNegative?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
  font-weight: 600;
  color: ${({ $isNegative }) => ($isNegative ? '#dc2626' : '#0f172a')};
  text-align: right;

  span.percent {
    font-size: 12px;
    font-weight: 500;
    color: ${({ $isNegative }) => ($isNegative ? '#f87171' : '#64748b')};
  }

  span.placeholder {
    font-weight: 500;
    color: #94a3b8;
  }
`;

const CompactFormItem = styled(Form.Item)`
  margin: 0 !important;

  .ant-form-item-explain {
    min-height: 0 !important;
    font-size: 11px;
    line-height: 1.3;
  }

  .ant-form-item-margin-offset {
    display: none !important;
  }
`;

const PRICE_ROWS: PriceRow[] = [
  {
    key: 'listPrice',
    label: 'Precio de lista',
    note: '(precio base)',
    required: true,
  },
  { key: 'midPrice', label: 'Precio medio' },
  { key: 'minPrice', label: 'Precio mínimo' },
  {
    key: 'cardPrice',
    label: 'Precio con tarjeta',
    tooltip:
      'Cuando cobras con tarjeta en el POS te preguntaremos si deseas usar este precio preferencial.',
  },
  { key: 'offerPrice', label: 'Precio de oferta' },
];

const formatCurrency = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return '—';
  }
  // format negative numbers nicely
  return value < 0 ? `-${Math.abs(value).toFixed(2)}` : `${value.toFixed(2)}`;
};

const formatPercent = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return '—';
  }
  return `${value.toFixed(1)}%`;
};

const getCurrencyMarker = (currency: ProductPricingCurrency): string =>
  currency === 'DOP' ? 'RD$' : currency;

const hasGainValue = (
  margin: number | null,
  percent: number | null,
): boolean => {
  return (
    (margin !== null && !Number.isNaN(margin)) ||
    (percent !== null && !Number.isNaN(percent))
  );
};

const handlePriceNumberFocus = (event: FocusEvent<HTMLInputElement>) => {
  if (!shouldSelectZeroPriceInput(event.currentTarget.value)) {
    return;
  }
  event.currentTarget.select();
};

export const PricingSection = ({
  domId,
  pricingValues = EMPTY_PRICING_VALUES,
}: PricingSectionProps) => {
  const taxationEnabled = useSelector(selectCartTaxationEnabled);
  const cost = Number(pricingValues?.cost) || 0;
  const taxRate = taxationEnabled ? Number(pricingValues?.tax) || 0 : 0;
  const pricingCurrency = normalizeProductPricingCurrency(
    pricingValues?.currency,
  );
  const currencyMarker = getCurrencyMarker(pricingCurrency);

  const priceMatrix = useMemo<PriceRowWithMetrics[]>(() => {
    return PRICE_ROWS.map((row) => {
      const rawValue = pricingValues?.[row.key];
      const hasAmount =
        rawValue !== undefined && rawValue !== null && rawValue !== '';
      const amount = hasAmount ? Number(rawValue) : null;

      const isValidAmount = hasAmount && amount !== null && amount > 0;
      const taxAmount = isValidAmount ? amount * (taxRate / 100) : null;
      const total = isValidAmount ? amount + taxAmount : null;
      const margin = isValidAmount ? amount - cost : null;
      const gainPercent = isValidAmount
        ? ((amount - cost) / amount) * 100
        : null;

      return {
        ...row,
        amount,
        taxAmount,
        total,
        margin,
        gainPercent,
      };
    });
  }, [pricingValues, taxRate, cost]);

  return (
    <SectionCard id={domId}>
      <SectionHeader>
        <Space>
          <SectionTitle level={4}>Estrategia de precios</SectionTitle>
        </Space>
        <SectionDescription>
          Controla tus márgenes antes de publicar.
        </SectionDescription>
      </SectionHeader>

      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <FieldGrid>
          <Form.Item
            name={['pricing', 'currency']}
            label="Moneda del precio"
            help="Define la moneda operativa del costo y los precios de este producto."
            rules={[
              { required: true, message: 'Selecciona la moneda del precio.' },
            ]}
          >
            <Select options={CURRENCY_OPTIONS} popupMatchSelectWidth={false} />
          </Form.Item>
          <Form.Item
            name={['pricing', 'cost']}
            label={`Costo (${currencyMarker})`}
            rules={[
              { required: true, message: 'Registra el costo base.' },
              {
                validator(_, value) {
                  if (value != null && value !== '' && Number(value) < 0) {
                    return Promise.reject(
                      new Error('El costo no puede ser negativo.'),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="0.00"
              onFocus={handlePriceNumberFocus}
            />
          </Form.Item>
          <Form.Item
            name={['pricing', 'tax']}
            label="ITBIS %"
            tooltip="Asegúrate de usar siempre el ITBIS vigente."
            help={
              taxationEnabled
                ? undefined
                : 'El impuesto no se aplicará según la política fiscal activa del negocio.'
            }
            rules={[{ required: true, message: 'Selecciona el ITBIS.' }]}
          >
            <Select options={TAX_OPTIONS} popupMatchSelectWidth={false} />
          </Form.Item>
        </FieldGrid>

        <div>
          <Text strong>Lista de precios ({currencyMarker})</Text>
          <PriceTableWrapper>
            <PriceTableRow $header>
              <span>Tipo</span>
              <span>Monto</span>
              <span className="numeric-header">ITBIS</span>
              <span className="numeric-header">Ganancia</span>
              <span className="numeric-header">Total</span>
            </PriceTableRow>
            {priceMatrix.map((row) => (
              <PriceTableRow key={row.key}>
                <LabelCell>
                  <span className="label">
                    {row.label}
                    {row.required && <span className="asterisk">*</span>}
                    {row.tooltip && (
                      <Tooltip title={row.tooltip} placement="top">
                        <InfoIcon />
                      </Tooltip>
                    )}
                  </span>
                  {row.note && <span className="note">{row.note}</span>}
                </LabelCell>
                <CompactFormItem
                  name={['pricing', row.key]}
                  dependencies={[['pricing', 'cost']]}
                  rules={[
                    ...(row.required
                      ? [
                          {
                            required: true,
                            message: `Ingresa el ${row.label.toLowerCase()}.`,
                          },
                        ]
                      : []),
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (
                          value === undefined ||
                          value === null ||
                          value === ''
                        ) {
                          return Promise.resolve();
                        }
                        if (isUnsetOptionalPriceValue(row, value)) {
                          return Promise.resolve();
                        }
                        if (row.key === 'listPrice' && Number(value) <= 0) {
                          return Promise.reject(
                            new Error(
                              'El precio de lista debe ser mayor que cero.',
                            ),
                          );
                        }
                        const currentCost = getFieldValue(['pricing', 'cost']);
                        if (
                          Number(currentCost) > 0 &&
                          Number(value) < Number(currentCost)
                        ) {
                          return Promise.reject(new Error('Menor al costo.'));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="0.00"
                    onFocus={handlePriceNumberFocus}
                  />
                </CompactFormItem>
                <NumericCell>{formatCurrency(row.taxAmount)}</NumericCell>
                <GainCell $isNegative={row.margin !== null && row.margin < 0}>
                  {hasGainValue(row.margin, row.gainPercent) ? (
                    <>
                      {formatCurrency(row.margin) !== '—' && (
                        <span>{formatCurrency(row.margin)}</span>
                      )}
                      {formatPercent(row.gainPercent) !== '—' && (
                        <span className="percent">
                          {formatPercent(row.gainPercent)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="placeholder">—</span>
                  )}
                </GainCell>
                <NumericCell>{formatCurrency(row.total)}</NumericCell>
              </PriceTableRow>
            ))}
          </PriceTableWrapper>
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            Completa tus precios para ver cómo varían el ITBIS, la ganancia y el
            total.
          </Text>
        </div>
      </Space>
    </SectionCard>
  );
};
