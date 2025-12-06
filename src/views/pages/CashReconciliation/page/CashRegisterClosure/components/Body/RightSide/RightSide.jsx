import { useCallback, useEffect, useMemo, useRef } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../../features/auth/userSlice';
import {
  addPropertiesToCashCount,
  selectCashCount,
  setCashCountClosingBanknotes,
  setCashCountClosingComments,
  updateCashCountTotals,
} from '../../../../../../../../features/cashCount/cashCountManagementSlice';
import { useInvoicesForCashCount } from '../../../../../../../../hooks/cashCount/useInvoicesForCashCount';
import { usePaymentsForCashCount } from '../../../../../../../../hooks/cashCount/usePaymentsForCashCount';
import { useExpensesForCashCount } from '../../../../../../../../hooks/expense/useExpensesForCashCount';
import { isArrayEmpty } from '../../../../../../../../utils/array/ensureArray';
import { CashDenominationCalculator } from '../../../../../resource/CashDenominationCalculator/CashDenominationCalculator';
import { Comments } from '../../../Comments/Comments';
import { DateSection } from '../../Header/DateSection';

import { CashCountMetaData } from './CashCountMetaData';
import { CashBoxClosureDetails } from './components/CashBoxClosureDetails/CashBoxClosureDetails';
import { TransactionSummary } from './components/TransactionSummary/TransactionSummary';
import { ViewExpenses } from './components/ViewExpenses/ViewExpenses';
import { ViewInvoice } from './components/ViewInvoive/ViewInvoice';

function useExpenseComments(expenses) {
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2,
      }),
    [],
  );

  const generate = useCallback(() => {
    if (isArrayEmpty(expenses)) return '';

    const pad = (label) => label.padEnd(14, ' '); // ancho uniforme
    const header = 'GASTOS (detalle)';
    const detailLines = [];
    let total = 0;

    expenses
      .filter((e) => e?.payment?.comment?.trim()) // solo gastos relevantes
      .forEach(({ description = '—', amount = 0, payment }) => {
        total += Number(amount);

        detailLines.push(
          '',
          `• ${pad('Concepto:')} ${description.trim()}`,
          `  ${pad('Importe:')} ${formatter.format(amount)}`,
          `  ${pad('Observaciones:')} ${payment.comment.trim()}`,
        );
      });

    if (!detailLines.length) return '';

    const totalLine = `\nTOTAL GASTOS: ${formatter.format(total)}`;

    // Resultado sin líneas en blanco extra
    return [header, ...detailLines, totalLine].join('\n');
  }, [expenses, formatter]);

  return useMemo(generate, [generate]);
}

export const RightSide = ({ calculationIsOpen, setCalculationIsOpen }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const cashReconciliation = useSelector(selectCashCount, shallowEqual);
  const { id, state } = cashReconciliation;
  const { banknotes, comments } = cashReconciliation.closing;

  const didInitComments = useRef(false);

  const {
    data: invoices,
    loading: invoicesLoading,
    count: invoicesCount,
  } = useInvoicesForCashCount(id);

  const { data: expenses, loading: expensesLoading } =
    useExpensesForCashCount(id);

  const { data: arPayments, loading: arPaymentsLoading } =
    usePaymentsForCashCount(
      user,
      cashReconciliation.opening?.employee?.id,
      cashReconciliation.opening?.date,
      cashReconciliation.closing?.date || null,
    );

  const mergeExpenseComments = useCallback(
    (expenseBlock) => {
      const existing = cashReconciliation.closing.comments || '';
      const base = existing.replace(/\n\nGASTOS.*$/s, '').trim();
      const combined = base + (expenseBlock ? `${expenseBlock}` : '');
      dispatch(setCashCountClosingComments(combined));
    },
    [dispatch, cashReconciliation.closing.comments],
  );

  const expenseBlock = useExpenseComments(expenses, mergeExpenseComments);

  const handleCommentsInput = useCallback(
    (text) => {
      dispatch(setCashCountClosingComments(text));
    },
    [dispatch, expenseBlock],
  );

  const handleChangesBanknotes = useCallback(
    (bn) => dispatch(setCashCountClosingBanknotes(bn)),
    [dispatch],
  );

  const metaData = useMemo(
    () =>
      CashCountMetaData(
        cashReconciliation,
        invoices,
        expenses,
        arPayments?.payments || [],
      ),
    [cashReconciliation, invoices, expenses, arPayments],
  );

  useEffect(() => {
    dispatch(updateCashCountTotals(metaData));
    dispatch(addPropertiesToCashCount(metaData));
  }, [dispatch, metaData]);

  useEffect(() => {
    if (!didInitComments.current && expenseBlock) {
      mergeExpenseComments(expenseBlock); // agrega el bloque GASTOS
      didInitComments.current = true; // marcamos que ya se hizo
    }
  }, [expenseBlock, mergeExpenseComments]);

  return (
    <Container>
      <CashDenominationCalculator
        banknotes={banknotes}
        setBanknotes={handleChangesBanknotes}
        title={'Cierre'}
        datetime={<DateSection date={cashReconciliation.closing.date} />}
        isExpanded={calculationIsOpen}
        setIsExpanded={setCalculationIsOpen}
        readOnly={state === 'closed'}
      />

      <TransactionSummary invoices={invoices} loading={invoicesLoading} />

      <Row>
        <ViewInvoice
          invoices={invoices}
          invoicesCount={invoicesCount}
          loading={invoicesLoading}
        />
        <ViewExpenses
          cashCountId={id}
          expenses={expenses}
          loading={expensesLoading}
        />
      </Row>
      <CashBoxClosureDetails
        loading={invoicesLoading || expensesLoading || arPaymentsLoading}
        invoices={invoices}
        expenses={expenses}
        arPayments={arPayments?.payments || []}
      />
      <Comments
        label="Comentario de cierre"
        placeholder="Escribe aquí ..."
        readOnly={state === 'closed'}
        value={comments}
        rows={6}
        onChange={(e) => handleCommentsInput(e.target.value)}
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

const Row = styled.div`
  display: flex;
  gap: 0.4em;
`;
