import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  selectCashCount,
  setCashCountOpeningBanknotes,
} from '@/features/cashCount/cashCountManagementSlice';
import { Comments } from '@/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/Comments/Comments';
import { DateSection } from '@/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/components/Header/DateSection';
import { CashDenominationCalculator } from '@/modules/cashReconciliation/pages/CashReconciliation/resource/CashDenominationCalculator/CashDenominationCalculator';
import { UserView } from '@/modules/cashReconciliation/pages/CashReconciliation/resource/UserView/UserView';
import type {
  CashCountBanknote,
  CashCountRecord,
} from '@/utils/cashCount/types';

interface LeftSideProps {
  calculationIsOpen: boolean;
  setCalculationIsOpen: (value: boolean) => void;
}

export const LeftSide: React.FC<LeftSideProps> = ({
  calculationIsOpen,
  setCalculationIsOpen,
}) => {
  const cashReconciliation = useSelector(selectCashCount) as CashCountRecord;
  const banknotes = cashReconciliation.opening?.banknotes || [];
  const dispatch = useDispatch();
  const handleChangesBanknotes = (nextBanknotes: CashCountBanknote[]) =>
    dispatch(setCashCountOpeningBanknotes(nextBanknotes));

  return (
    <Container>
      <CashDenominationCalculator
        readOnly
        banknotes={banknotes}
        setBanknotes={handleChangesBanknotes}
        title={'Apertura'}
        datetime={<DateSection date={cashReconciliation.opening?.date} />}
        isExpanded={calculationIsOpen}
        setIsExpanded={setCalculationIsOpen}
      />
      <UserView
        user={cashReconciliation.opening?.employee || null}
        label="Entregado por"
        user2={cashReconciliation.opening?.approvalEmployee || null}
        label2="Recibido por"
        title={'Autorización de Apertura'}
      />
      {cashReconciliation.closing?.initialized === true ? (
        <UserView
          user={cashReconciliation.closing?.employee || null}
          label="Entregado por"
          user2={cashReconciliation.closing?.approvalEmployee || null}
          label2="Recibido por"
          title={'Autorización de Cierre'}
        />
      ) : null}
      <Comments
        label="Comentario de apertura"
        placeholder="Escribe aqu? ..."
        readOnly
        rows={6}
        value={cashReconciliation.opening?.comments || ''}
      />
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  gap: 0.4em;
  align-content: start;
  align-items: start;
`;
