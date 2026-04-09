import { AnimatePresence, m } from 'framer-motion';
import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectExpenseList } from '@/features/expense/expensesListSlice';
import {
  selectExpenseChartModal,
  toggleExpenseChartModal,
} from '@/features/expense/expenseUISlice';
import type { ExpenseDoc } from '@/utils/expenses/types';
import { Button } from '@/components/ui/Button/Button';
import Typography from '@/components/ui/Typografy/Typografy';

import { CategoryExpenseBarChart } from './reports/CategoryExpenseBarChart';
import { DailyExpenseBarChart } from './reports/DailyExpensesBarChart';
import { MonthlyAndAccumulatedExpenseCharts } from './reports/MonthlyAndAccumulatedExpenseCharts/MonthlyAndAccumulatedExpenseCharts';

export const ExpenseChart = () => {
  const dispatch = useDispatch();
  const { isOpen } = useSelector(selectExpenseChartModal) as {
    isOpen: boolean;
  };
  const handleOpenExpensesChart = () => dispatch(toggleExpenseChartModal());

  const expensesList = useSelector(selectExpenseList) as ExpenseDoc[];

  const componentRef = useRef<HTMLDivElement | null>(null);

  const variantsBackdrop = {
    open: { opacity: 1, zIndex: 1 },
    close: { opacity: 0, zIndex: -1 },
  };

  const variantsContainer = {
    open: {
      opacity: 1,
      y: 0,
    },
    close: {
      opacity: 0,
      y: '100vh',
    },
  };

  //useClickOutSide(componentRef, isOpen, onOpen)

  return (
    <AnimatePresence>
      {isOpen && (
        <Backdrop
          variants={variantsBackdrop}
          initial="close"
          key="backdrop"
          animate={isOpen ? 'open' : 'close'}
          transition={{ duration: 0.5 }}
          exit="close"
        >
          <Component
            ref={componentRef}
            variants={variantsContainer}
            initial="close"
            animate={isOpen ? 'open' : 'close'}
            transition={{ duration: 0.5 }}
            exit="close"
          >
            <Header>
              <Typography variant="h2">Reporte de Gastos</Typography>
              <Button title="Cerrar" onClick={handleOpenExpensesChart} />
            </Header>
            <DailyExpenseBarChart expenses={expensesList} />
            <CategoryExpenseBarChart expenses={expensesList} />
            {/* <MonthlyExpenseBarChart
                expenses={expenses}
              /> */}
            <MonthlyAndAccumulatedExpenseCharts expenses={expensesList} />
          </Component>
        </Backdrop>
      )}
    </AnimatePresence>
  );
};

const Component = styled(m.div)`
  display: grid;
  gap: 4em;
  width: 98vw;
  height: 100%;
  padding: 0 1em;
  overflow-y: scroll;
  background-color: #fff;
  border: 1px solid #1d1d1d37;
  border-radius: 0.5em;
`;

const Backdrop = styled(m.div)`
  position: absolute;
  top: 0;
  z-index: 30;
  display: grid;
  justify-content: center;
  width: 100%;
  height: calc(100vh);
  overflow: hidden;
`;

const Header = styled.div`
  position: sticky;
  top: 0;
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: 1em;
  align-items: center;
  padding: 1em 1em 0;
  background: white;
`;
