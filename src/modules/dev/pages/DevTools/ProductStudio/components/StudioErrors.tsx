import { WarningOutlined } from '@/constants/icons/antd';
import { Space, Typography } from 'antd';
import styled from 'styled-components';

import type { ProductRecord } from '@/types/products';

const { Text } = Typography;

const ErrorBannerWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
`;

const ErrorList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  
  li {
    font-size: 13px;
    font-weight: 500;
    color: #991b1b;
    margin-bottom: 4px;

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

interface StudioErrorsProps {
    product?: ProductRecord | null;
}

export const StudioErrors: React.FC<StudioErrorsProps> = ({ product }) => {
    const errors: string[] = [];

    // Rule 1: Pérdidas de precios
    if (product?.pricing) {
        const { cost, listPrice, avgPrice, minPrice, cardPrice, offerPrice } = product.pricing;
        const currentCost = Number(cost) || 0;

        if (currentCost > 0) {
            const pricesToCheck = [
                { label: 'Precio de lista', value: listPrice },
                { label: 'Precio medio', value: avgPrice },
                { label: 'Precio mínimo', value: minPrice },
                { label: 'Precio con tarjeta', value: cardPrice },
                { label: 'Precio de oferta', value: offerPrice },
            ];

            const lossLabels = pricesToCheck
                .filter((p) => {
                    const val = Number(p.value);
                    return val > 0 && val < currentCost;
                })
                .map((p) => p.label);

            if (lossLabels.length > 0) {
                errors.push(
                    `Advertencia de pérdida: Los siguientes precios están por debajo de tu costo (${lossLabels.join(', ')}).`,
                );
            }
        }
    }

    if (errors.length === 0) {
        return null;
    }

    return (
        <ErrorBannerWrapper>
            <WarningOutlined style={{ color: '#dc2626', fontSize: 18, marginTop: 2 }} />
            <ErrorList>
                {errors.map((err, index) => (
                    <li key={index}>{err}</li>
                ))}
            </ErrorList>
        </ErrorBannerWrapper>
    );
};
