import React, { useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { selectPurchaseList } from '../../../../../../features/purchase/purchasesSlice';
import { selectPurchaseChartModal, togglePurchaseChartModal } from '../../../../../../features/purchase/purchaseUISlice';
import { DailyPurchasesBarChart } from './reports/DailyPurchasesBarChart';
import Typography from '../../../../../templates/system/Typografy/Typografy';
import { Button } from '../../../../..';
import { ProviderPurchasesBarChart } from './reports/ProvidersPurchasesBarChart';
import { CategoryPurchasesBarChart } from './reports/CategoryPurchasesBarChart';
import { MonthlyAndAccumulatedPurchaseCharts } from './reports/MonthlyAndAccumulatedPurchaseCharts/MonthlyAndAccumulatedPurchaseCharts';

const variantsBackdrop = {
    open: { opacity: 1, zIndex: 1 },
    close: { opacity: 0, zIndex: -1 },
}
const variantsContainer = {
    open: {
        opacity: 1,
        y: 0,
    },
    close: {
        opacity: 0,
        y: '100vh',
    }
}

export const PurchasesReport = () => {
    const dispatch = useDispatch();
    const purchases = useSelector(selectPurchaseList);
    const {isOpen} = useSelector(selectPurchaseChartModal);
    const handleOpenPurchaseChart = () => dispatch(togglePurchaseChartModal());
    const componentRef = useRef(null);
    return (
        <AnimatePresence>
            {isOpen && (
                <Backdrop
                    variants={variantsBackdrop}
                    initial="close"
                    key='backdrop'
                    animate={isOpen ? "open" : "close"}
                    transition={{ duration: 0.5 }}
                    exit="close"
                >
                    <Component
                        ref={componentRef}
                        variants={variantsContainer}
                        initial="close"
                        animate={isOpen ? "open" : "close"}
                        transition={{ duration: 0.5 }}
                        exit="close"
                    >
                        <Header>
                            <Typography variant='h2'>
                                Reporte de compras
                            </Typography>
                            <Button
                                title='Cerrar'
                                onClick={handleOpenPurchaseChart}
                            />
                        </Header>
                        <DailyPurchasesBarChart
                            purchases={purchases}
                        />
                        <ProviderPurchasesBarChart 
                            purchases={purchases}
                        />
                        <CategoryPurchasesBarChart
                            purchases={purchases}
                        />
                        <MonthlyAndAccumulatedPurchaseCharts
                            purchases={purchases}
                        />
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
    )
}


const Group = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
`;

const Component = styled(motion.div)`
  width: 98vw;
  display: grid;
  gap: 4em;
  align-content: start;
  height: 100%;
  background-color: #ffffff;
  border: 1px solid #1d1d1d37;
  border-radius: 0.5em;
  overflow-y: scroll;
  padding: 0 1em;
  `;

const Backdrop = styled(motion.div)`
  width: 100%;
  height: calc(100vh);
  display: grid;
  top: 0;
  justify-content: center;
  position: absolute;
  overflow: hidden;
  z-index: 30;
`

const Header = styled.div`
  display: grid;
  grid-template-columns: 1fr max-content;
  align-items: center;
  position: sticky;
  top: 0;
  padding: 1em 1em 0 ;
  background: white;
  gap: 1em;
  `