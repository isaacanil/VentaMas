import { useCallback, useEffect, useMemo, useRef } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  addPropertiesToCashCount,
  selectCashCount,
  setCashCountClosingBanknotes,
  setCashCountClosingComments,
  updateCashCountTotals,
} from '@/features/cashCount/cashCountManagementSlice';
import { useInvoicesForCashCount } from '@/hooks/cashCount/useInvoicesForCashCount';
import { usePaymentsForCashCount } from '@/hooks/cashCount/usePaymentsForCashCount';
import { useExpensesForCashCount } from '@/hooks/expense/useExpensesForCashCount';
import { isArrayEmpty } from '@/utils/array/ensureArray';
import type { AccountsReceivablePayment } from '@/utils/accountsReceivable/types';
import type {
  CashCountBanknote,
  CashCountExpense,
  CashCountInvoice,
  CashCountRecord,
} from '@/utils/cashCount/types';
import type { UserIdentity } from '@/types/users';
import { Comments } from '@/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/Comments/Comments';
import { DateSection } from '@/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/components/Header/DateSection';
import { CashDenominationCalculator } from '@/modules/cashReconciliation/pages/CashReconciliation/resource/CashDenominationCalculator/CashDenominationCalculator';

import { CashCountMetaData } from './CashCountMetaData';
import { CashBoxClosureDetails } from './components/CashBoxClosureDetails/CashBoxClosureDetails';
import { TransactionSummary } from './components/TransactionSummary/TransactionSummary';
import { ViewExpenses } from './components/ViewExpenses/ViewExpenses';
import { ViewInvoice } from './components/ViewInvoive/ViewInvoice';

const useExpenseComments = (expenses: CashCountExpense[]) => {
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

    const pad = (label: string) => label.padEnd(14, ' ');
    const header = 'GASTOS (detalle)';
    const detailLines: string[] = [];
    let total = 0;

    expenses
      .filter((e) => e?.payment?.comment?.trim())
      .forEach(({ description = '?', amount = 0, payment }) => {
        total += Number(amount);

        detailLines.push(
          '',
          `- ${pad('Concepto:')} ${description.trim()}`,
          `  ${pad('Importe:')} ${formatter.format(amount)}`,
          `  ${pad('Observaciones:')} ${payment?.comment?.trim() || ''}`,
        );
      });

    if (!detailLines.length) return '';

    const totalLine = `\nTOTAL GASTOS: ${formatter.format(total)}`;

    return [header, ...detailLines, totalLine].join('\n');
  }, [expenses, formatter]);

  return useMemo(() => generate(), [generate]);
};

interface RightSideProps {
  calculationIsOpen: boolean;
  setCalculationIsOpen: (value: boolean) => void;
}

export const RightSide: React.FC<RightSideProps> = ({
  calculationIsOpen,
  setCalculationIsOpen,
}) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const cashReconciliation = useSelector(
    selectCashCount,
    shallowEqual,
  ) as CashCountRecord;
  const { id, state } = cashReconciliation;
  const { banknotes = [], comments } = cashReconciliation.closing || {};

  const didInitComments = useRef(false);

  const {
    data: invoices,
    loading: invoicesLoading,
    count: invoicesCount,
  } = useInvoicesForCashCount(id as string);

  const { data: expenses, loading: expensesLoading } =
    useExpensesForCashCount(id as string);

  const { payments: arPayments = [], loading: arPaymentsLoading } =
    usePaymentsForCashCount(
      user,
      cashReconciliation.opening?.employee?.id,
      cashReconciliation.opening?.date,
      cashReconciliation.closing?.date || null,
    );

  const mergeExpenseComments = useCallback(
    (expenseBlock: string) => {
      const existing = cashReconciliation.closing?.comments || '';
      const base = existing.replace(/\n?\n?GASTOS.*$/s, '').trim();
      const combined = expenseBlock
        ? base
          ? `${base}\n\n${expenseBlock}`
          : expenseBlock
        : base;
      dispatch(setCashCountClosingComments(combined));
    },
    [dispatch, cashReconciliation.closing?.comments],
  );

  const expenseBlock = useExpenseComments(expenses as CashCountExpense[]);

  const handleCommentsInput = useCallback(
    (text: string) => {
      dispatch(setCashCountClosingComments(text));
    },
    [dispatch],
  );

  const handleChangesBanknotes = useCallback(
    (bn: CashCountBanknote[]) => dispatch(setCashCountClosingBanknotes(bn)),
    [dispatch],
  );

  const metaData = useMemo(
    () =>
      CashCountMetaData(
        cashReconciliation,
        invoices as CashCountInvoice[],
        expenses as CashCountExpense[],
        arPayments as AccountsReceivablePayment[],
      ),
    [cashReconciliation, invoices, expenses, arPayments],
  );

  useEffect(() => {
    if (!metaData) return;
    dispatch(updateCashCountTotals(metaData));
    dispatch(addPropertiesToCashCount(metaData));
  }, [dispatch, metaData]);

  useEffect(() => {
    if (!didInitComments.current && expenseBlock) {
      mergeExpenseComments(expenseBlock);
      didInitComments.current = true;
    }
  }, [expenseBlock, mergeExpenseComments]);

  return (
    <Container>
      <CashDenominationCalculator
        banknotes={banknotes}
        setBanknotes={handleChangesBanknotes}
        title={'Cierre'}
        datetime={<DateSection date={cashReconciliation.closing?.date} />}
        isExpanded={calculationIsOpen}
        setIsExpanded={setCalculationIsOpen}
        readOnly={state === 'closed'}
      />

      <TransactionSummary loading={invoicesLoading} />

      <Row>
        <ViewInvoice
          invoices={invoices as CashCountInvoice[]}
          invoicesCount={invoicesCount}
          loading={invoicesLoading}
        />
        <ViewExpenses
          expenses={expenses as CashCountExpense[]}
          loading={expensesLoading}
        />
      </Row>
      <CashBoxClosureDetails
        loading={invoicesLoading || expensesLoading || arPaymentsLoading}
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
