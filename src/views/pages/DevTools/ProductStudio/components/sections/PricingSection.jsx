import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, InputNumber, Space, Tooltip, Typography } from 'antd';
import { useMemo } from 'react';
import styled from 'styled-components';

import {
  FieldGrid,
  SectionCard,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from '../SectionLayout';

const { Text } = Typography;

const PriceTableWrapper = styled.div`
  margin-top: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
`;

const PriceTableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.3fr repeat(3, 1fr);
  gap: 12px;
  padding: 12px 16px;
  background: ${({ $header }) => ($header ? '#f8fafc' : '#fff')};
  font-weight: ${({ $header }) => ($header ? 600 : 500)};
  font-size: 13px;
  text-transform: ${({ $header }) => ($header ? 'uppercase' : 'none')};
  color: ${({ $header }) => ($header ? '#0f172a' : '#334155')};
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
  align-items: flex-start;
  gap: 2px;
  font-weight: 600;

  span.label {
    display: flex;
    align-items: center;
    gap: 4px;
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
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: #0f172a;
`;

const GainCell = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  gap: 2px;
  font-weight: 600;
  color: #0f172a;

  span.percent {
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
  }

  span.placeholder {
    color: #94a3b8;
    font-weight: 500;
  }
`;

const PRICE_ROWS = [
  {
    key: 'listPrice',
    label: 'Precio de lista',
    note: '(precio base)',
    required: true,
    formItemProps: {
      rules: [{ required: true, message: 'Define un precio de lista.' }],
    },
  },
  { key: 'midPrice', label: 'Precio medio' },
  { key: 'minPrice', label: 'Precio mínimo' },
  {
    key: 'cardPrice',
    label: 'Precio con tarjeta',
    tooltip: 'Cuando cobras con tarjeta en el POS te preguntaremos si deseas usar este precio preferencial.',
  },
  { key: 'offerPrice', label: 'Precio de oferta' },
];

const formatCurrency = (value) => {
  if (value === null || Number.isNaN(value) || value === 0) {
    return '—';
  }
  return `RD$ ${value.toFixed(2)}`;
};

const formatPercent = (value) => {
  if (value === null || Number.isNaN(value) || value === 0) {
    return '—';
  }
  return `${value.toFixed(1)}%`;
};

const hasGainValue = (margin, percent) => {
  const hasMargin = margin !== null && !Number.isNaN(margin) && margin > 0;
  const hasPercent = percent !== null && !Number.isNaN(percent) && percent > 0;
  return hasMargin || hasPercent;
};

export const PricingSection = ({ domId, previewMetrics, pricingValues = {} }) => {
  const cost = Number(pricingValues?.cost) || 0;
  const taxRate = Number(pricingValues?.tax) || 0;

  const priceMatrix = useMemo(() => {
    return PRICE_ROWS.map((row) => {
      const rawValue = pricingValues?.[row.key];
      const hasAmount = rawValue !== undefined && rawValue !== null && rawValue !== '';
      const amount = hasAmount ? Number(rawValue) : null;
      const taxAmount = hasAmount ? amount * (taxRate / 100) : null;
      const total = hasAmount ? amount + taxAmount : null;
      const margin = hasAmount ? amount - cost : null;
      const gainPercent = hasAmount && amount > 0 ? ((amount - cost) / amount) * 100 : null;

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

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <FieldGrid>
          <Form.Item
            name={['pricing', 'cost']}
            label="Costo"
            rules={[{ required: true, message: 'Registra el costo base.' }]}
          >
            <InputNumber min={0} prefix="RD$" style={{ width: '100%' }} placeholder="0.00" />
          </Form.Item>
          <Form.Item
            name={['pricing', 'tax']}
            label="ITBIS %"
            tooltip="Asegúrate de usar siempre el ITBIS vigente."
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="18" />
          </Form.Item>
        </FieldGrid>

        <div>
          <Text strong>Lista de precios</Text>
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
                <Form.Item
                  name={['pricing', row.key]}
                  style={{ margin: 0 }}
                  {...(row.formItemProps || {})}
                >
                  <InputNumber
                    min={0}
                    prefix="RD$"
                    style={{ width: '100%' }}
                    placeholder="0.00"
                    {...(row.inputProps || {})}
                  />
                </Form.Item>
                <NumericCell>{formatCurrency(row.taxAmount)}</NumericCell>
                <GainCell>
                  {hasGainValue(row.margin, row.gainPercent) ? (
                    <>
                      {formatCurrency(row.margin) !== '—' && <span>{formatCurrency(row.margin)}</span>}
                      {formatPercent(row.gainPercent) !== '—' && (
                        <span className="percent">{formatPercent(row.gainPercent)}</span>
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
            Completa tus precios para ver cómo varían el ITBIS, la ganancia y el total.
          </Text>
        </div>
      </Space>

    </SectionCard>
  );
};
