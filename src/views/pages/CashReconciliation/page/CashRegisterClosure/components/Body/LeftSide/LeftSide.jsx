import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  selectCashCount,
  setCashCountOpeningBanknotes,
} from '../../../../../../../../features/cashCount/cashCountManagementSlice';
import { CashDenominationCalculator } from '../../../../../resource/CashDenominationCalculator/CashDenominationCalculator';
import { UserView } from '../../../../../resource/UserView/UserView';
import { Comments } from '../../../Comments/Comments';
import { DateSection } from '../../Header/DateSection';

export const LeftSide = ({ calculationIsOpen, setCalculationIsOpen }) => {
  const CashReconciliation = useSelector(selectCashCount);
  const { banknotes } = CashReconciliation.opening;
  const dispatch = useDispatch();
  const handleChangesBanknotes = (banknotes) =>
    dispatch(setCashCountOpeningBanknotes(banknotes));

  return (
    <Container>
      <CashDenominationCalculator
        readOnly
        banknotes={banknotes}
        setBanknotes={handleChangesBanknotes}
        title={'Apertura'}
        datetime={<DateSection date={CashReconciliation.opening.date} />}
        isExpanded={calculationIsOpen}
        setIsExpanded={setCalculationIsOpen}
      />
      <UserView
        user={CashReconciliation.opening?.employee}
        label="Entregado por"
        user2={CashReconciliation.opening?.approvalEmployee}
        label2="Recibido por"
        title={'Autorización de Apertura'}
      />
      {CashReconciliation.closing.initialized === true ? (
        <UserView
          user={CashReconciliation.closing?.employee}
          label="Entregado por"
          user2={CashReconciliation.closing?.approvalEmployee}
          label2="Recibido por"
          title={'Autorización de Cierre'}
        />
      ) : null}
      <Comments
        label="Comentario de apertura"
        placeholder="Escribe aquí ..."
        readOnly
        rows={6}
        value={CashReconciliation.opening.comments}
      />
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  align-items: start;
  align-content: start;
  gap: 0.4em;
`;
