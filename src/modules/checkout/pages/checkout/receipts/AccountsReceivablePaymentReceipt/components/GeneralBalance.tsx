import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { selectUser } from '@/features/auth/userSlice';
import { usePendingBalance } from '@/firebase/accountsReceivable/fbGetPendingBalance';
import { formatPrice } from '@/utils/format';
import { Subtitle } from '@/modules/checkout/pages/checkout/Style';
import type { AccountsReceivablePaymentReceipt } from '@/utils/accountsReceivable/types';
import type { UserIdentity } from '@/types/users';

type GeneralBalanceProps = {
  data?: AccountsReceivablePaymentReceipt | null;
};

export const GeneralBalance = ({ data }: GeneralBalanceProps) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessID = user?.businessID ?? null;
  const clientId = data?.client?.id ?? null;
  const [pendingBalance, setPendingBalance] = useState(0);

  usePendingBalance(businessID, clientId, setPendingBalance);

  return (
    <Container>
      <Subtitle>Balance General</Subtitle>
      <Subtitle>{formatPrice(pendingBalance)}</Subtitle>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  justify-items: right;
  width: min-content;
  width: 100%;
  white-space: nowrap;
`;
