import React, { useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import Typography from '../../../../../templates/system/Typografy/Typografy';
import { Button } from '../../../../..';
import { useClickOutSide } from '../../../../../../hooks/useClickOutSide';
import { DailyExpenseBarChart } from './reports/DailyExpensesBarChart';
import { CategoryExpenseBarChart } from './reports/CategoryExpenseBarChart';
import { MonthlyExpenseBarChart } from './reports/MonthlyExpenseBarChart';
import { MonthlyAndAccumulatedExpenseCharts } from './reports/MonthlyAndAccumulatedExpenseCharts/MonthlyAndAccumulatedExpenseCharts';
import { useDispatch, useSelector } from 'react-redux';
import { selectExpenseList } from '../../../../../../features/expense/expensesListSlice';
import { selectExpenseChartModal, toggleExpenseChartModal } from '../../../../../../features/expense/expenseUISlice';

export const ExpenseChart = () => {
    const dispatch = useDispatch();

    const { isOpen } = useSelector(selectExpenseChartModal);
    
    const handleOpenExpensesChart = () => dispatch(toggleExpenseChartModal());

    const expensesList = useSelector(selectExpenseList);

    const componentRef = useRef(null);

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

    //useClickOutSide(componentRef, isOpen, onOpen)

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
                                Ventas
                            </Typography>
                            <Button
                                title='Cerrar'
                                onClick={handleOpenExpensesChart}
                            />
                        </Header>
                        <DailyExpenseBarChart
                            expenses={expensesList}
                        />
                        <CategoryExpenseBarChart
                            expenses={expensesList}
                        />
                        {/* <MonthlyExpenseBarChart 
                                expenses={expenses}
                            /> */}
                        <MonthlyAndAccumulatedExpenseCharts
                            expenses={expensesList}
                        />
                    </Component>
                </Backdrop>
            )}
        </AnimatePresence>

    );
};


const Group = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
`;

const Component = styled(motion.div)`
  width: 98vw;
  display: grid;
  gap: 4em;
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