import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';


import { selectUser } from '@/features/auth/userSlice';
import { usePendingBalance } from '@/firebase/accountsReceivable/fbGetPendingBalance';
import { formatPrice } from '@/utils/format';
import { Subtitle } from '@/views/pages/checkout/Style';


export const GeneralBalance = ({ data }) => {
  const user = useSelector(selectUser);
  const businessID = user?.businessID;
  const clientId = data?.client?.id;
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
