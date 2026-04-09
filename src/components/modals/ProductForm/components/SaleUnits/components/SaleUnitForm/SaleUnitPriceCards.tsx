import {
  DollarCircleOutlined,
  RiseOutlined,
  FallOutlined,
} from '@/constants/icons/antd';
import React from 'react';

import { formatPrice } from '@/utils/format';

import {
  Card,
  CardContainer,
  CardTitle,
  IconContainer,
  OptionContainer,
  OptionTitle,
} from './styles';

import type { PriceCardRow } from './types';

const PriceCardOption = ({
  title,
  value,
}: {
  title: string;
  value: React.ReactNode;
}) => (
  <OptionContainer>
    <OptionTitle>{title}</OptionTitle>
    <span>{value}</span>
  </OptionContainer>
);

export const SaleUnitPriceCards = ({
  cardData,
}: {
  cardData: PriceCardRow[];
}) => (
  <CardContainer>
    {cardData.map((item) => (
      <Card
        key={item.key}
        style={{
          backgroundColor:
            item.key === '1'
              ? '#fff5e8'
              : item.key === '2'
                ? '#f4fef6'
                : '#e9f3f9',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
          }}
        >
          <IconContainer>
            {item.key === '1' && (
              <DollarCircleOutlined
                style={{ fontSize: '24px', color: '#ffbf00' }}
              />
            )}
            {item.key === '2' && (
              <RiseOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
            )}
            {item.key === '3' && (
              <FallOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            )}
          </IconContainer>
          <CardTitle>{item.tipoPrecio}</CardTitle>
        </div>
        <PriceCardOption
          title="Monto"
          value={formatPrice(item.precioSinItbis)}
        />
        <PriceCardOption title="Itbis" value={formatPrice(item.itbis)} />
        <PriceCardOption title="Margen" value={formatPrice(item.margen)} />
        <PriceCardOption
          title="Ganancia (%)"
          value={item.porcentajeGanancia}
        />
        <PriceCardOption title="Total" value={formatPrice(item.total)} />
      </Card>
    ))}
  </CardContainer>
);
