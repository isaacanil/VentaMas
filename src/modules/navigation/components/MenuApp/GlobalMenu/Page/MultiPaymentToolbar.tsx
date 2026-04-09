import { BankOutlined } from '@/constants/icons/antd';
import React from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { Button } from '@/components/ui/Button/Button';
import type { ToolbarComponentProps } from '@/modules/navigation/components/MenuApp/GlobalMenu/types';

export const MultiPaymentToolbar = ({
  side = 'left',
}: ToolbarComponentProps) => {
  const matchWithMultiPayment = useMatch('/accounts-receivable');
  const navigate = useNavigate();

  const handleOpenMultiPayment = () => {
    navigate('/multi-payment');
  };

  return matchWithMultiPayment ? (
    <Container>
      {side === 'right' && (
        <Button
          onClick={handleOpenMultiPayment}
          title={`Pago múltiple`}
          borderRadius={'light'}
          icon={<BankOutlined />}
        />
      )}
    </Container>
  ) : null;
};

const Container = styled.div`
  display: flex;
  align-items: center;
`;
