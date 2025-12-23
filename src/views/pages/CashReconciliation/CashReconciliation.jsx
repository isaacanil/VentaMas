import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { clearCashCount } from '@/features/cashCount/cashCountManagementSlice';
import { useCashCountClosingPrompt } from '@/hooks/cashCount/useCashCountClosingPrompt';

import { CashReconciliationTable } from './components/Body/CashRecociliationTable';
import { Header } from './components/Header/Header';

export const CashReconciliation = () => {
  useCashCountClosingPrompt();

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearCashCount());
  }, [dispatch]);

  return (
    <Container>
      <Header />
      <CashReconciliationTable />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  width: 100%;
  height: 100%;
  overflow-y: hidden;
  background-color: var(--color2);
`;
