import { FC, useMemo } from 'react';
import styled from 'styled-components';

import { getPaymentMethodMeta } from '../utils/paymentMethodMeta';

import { PaymentMethodRow } from './PaymentMethodRow';

import type { PaymentMethod } from '@/views/component/modals/InvoiceForm/components/PaymentInfo/types';

interface PaymentMethodsSectionProps {
  paymentMethods: PaymentMethod[];
  readOnly: boolean;
  onStatusChange: (method: PaymentMethod, status: boolean) => void;
  onValueChange: (method: PaymentMethod, value: number | null) => void;
  onReferenceChange: (method: PaymentMethod, reference: string) => void;
}

export const PaymentMethodsSection: FC<PaymentMethodsSectionProps> = ({
  paymentMethods,
  readOnly,
  onStatusChange,
  onValueChange,
  onReferenceChange,
}) => {
  const hasPaymentMethods = paymentMethods.length > 0;

  const methodList = useMemo(() => paymentMethods, [paymentMethods]);

  return (
    <MethodsContainer>
      <SectionTitle>Métodos de pago</SectionTitle>
      {!hasPaymentMethods ? (
        <EmptyMessage>
          No hay métodos de pago configurados para esta factura.
        </EmptyMessage>
      ) : (
        <MethodsWrapper>
          {methodList.map((method) => {
            const meta = getPaymentMethodMeta(method.method, method.name);
            const disableValueInput = method.method === 'creditNote';

            return (
              <PaymentMethodRow
                key={method.method}
                method={method}
                readOnly={readOnly}
                meta={meta}
                disableValueInput={disableValueInput}
                onStatusChange={(status) => onStatusChange(method, status)}
                onValueChange={(value) => onValueChange(method, value)}
                onReferenceChange={(reference) =>
                  onReferenceChange(method, reference)
                }
              />
            );
          })}
        </MethodsWrapper>
      )}
    </MethodsContainer>
  );
};

const MethodsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #434343;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const MethodsWrapper = styled.div`
  display: grid;
  gap: 1rem;
  width: 100%;
`;

const EmptyMessage = styled.div`
  padding: 1rem;
  font-size: 13px;
  color: #8c8c8c;
  text-align: center;
  background: #fafafa;
  border-radius: 8px;
`;
