import { AnimatePresence, motion } from 'framer-motion';
import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectPurchaseList } from '@/features/purchase/purchasesSlice';
import {
  selectPurchaseChartModal,
  togglePurchaseChartModal,
} from '@/features/purchase/purchaseUISlice';
import { Button } from '@/views/templates/system/Button/Button';
import Typography from '@/views/templates/system/Typografy/Typografy';

import { CategoryPurchasesBarChart } from './reports/CategoryPurchasesBarChart';
import { DailyPurchasesBarChart } from './reports/DailyPurchasesBarChart';
import { MonthlyAndAccumulatedPurchaseCharts } from './reports/MonthlyAndAccumulatedPurchaseCharts/MonthlyAndAccumulatedPurchaseCharts';
import { ProviderPurchasesBarChart } from './reports/ProvidersPurchasesBarChart';

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

export const PurchasesReport = () => {
  const dispatch = useDispatch();
  const purchases = useSelector(selectPurchaseList);
  const { isOpen } = useSelector(selectPurchaseChartModal);
  const handleOpenPurchaseChart = () => dispatch(togglePurchaseChartModal());
  const componentRef = useRef(null);
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
              <Typography variant="h2">Reporte de compras</Typography>
              <Button title="Cerrar" onClick={handleOpenPurchaseChart} />
            </Header>
            <DailyPurchasesBarChart purchases={purchases} />
            <ProviderPurchasesBarChart purchases={purchases} />
            <CategoryPurchasesBarChart purchases={purchases} />
            <MonthlyAndAccumulatedPurchaseCharts purchases={purchases} />
            {/* <CategoryExpenseBarChart
                            expenses={expensesList}
                        />
                        <MonthlyAndAccumulatedExpenseCharts
                            expenses={expensesList}
                        /> */}
          </Component>
        </Backdrop>
      )}
    </AnimatePresence>
  );
};
const Component = styled(motion.div)`
  display: grid;
  gap: 4em;
  align-content: start;
  width: 98vw;
  height: 100%;
  padding: 0 1em;
  overflow-y: scroll;
  background-color: #fff;
  border: 1px solid #1d1d1d37;
  border-radius: 0.5em;
`;

const Backdrop = styled(motion.div)`
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
