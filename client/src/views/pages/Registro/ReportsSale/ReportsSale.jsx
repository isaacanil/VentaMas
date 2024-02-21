import React, { useEffect, useMemo, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { LinearScale, CategoryScale, BarElement, Chart, Tooltip } from "chart.js";
import styled from 'styled-components';
import { DailySalesBarChart } from './components/Bars/DailySalesBarChart/DailySalesBarChart';
import { ProductCategorySalesBarChart } from './components/Bars/ProductCategorySalesBarChart/ProductCategorySalesBarChart';
import { ItemsSoldBarChart } from './components/Bars/ItemsSoldBarChart/ItemsSoldBarChart';
import { PaymentMethodBarChart } from './components/Bars/PaymentMethodBarChart/PaymentMethodBarChart';
import { TaxedSalesStackedBarChart } from './components/Bars/TaxedSalesStackedBarChart/TaxedSalesStackedBarChart';
import { PurchaseTypeBarChart } from './components/Bars/PurchaseTypeBarChart/PurchaseTypeBarChart';
import { DiscountsGivenBarChart } from './components/Bars/DiscountsGivenBarChart/DiscountsGivenBarChart';
import { TotalSalesPerCustomerChart } from './components/Bars/TotalSalesPerCustomerChart/TotalSalesPerCustomerChart';
import { AnimatePresence, motion } from 'framer-motion';
import Typography from '../../../templates/system/Typografy/Typografy';
import { Button } from '../../../templates/system/Button/Button';
import { useClickOutSide } from '../../../../hooks/useClickOutSide';
import { CustomerSalesReportTable } from './components/Table/CustomerSalesReportTable';

const MyBarChart = ({ sales, isOpen, onOpen }) => {
  if (!isOpen) return null
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

  //useClickOutSide(ref, isOpen, onOpen)
  useClickOutSide(componentRef, isOpen, onOpen)

  return (
    <AnimatePresence>
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
              Reporte de ventas
            </Typography>
            <Button
              title='Cerrar'
              onClick={onOpen}
            />
          </Header>
          <DailySalesBarChart sales={sales} />
          <CustomerSalesReportTable sales={sales} />
          <Group>
            <PaymentMethodBarChart sales={sales} />
            <PurchaseTypeBarChart sales={sales} />
          </Group>
          <TaxedSalesStackedBarChart sales={sales} />
          <ProductCategorySalesBarChart sales={sales} />
          <ItemsSoldBarChart sales={sales} />
          <DiscountsGivenBarChart sales={sales} />
          <TotalSalesPerCustomerChart sales={sales} />
        </Component>
      </Backdrop>
    </AnimatePresence>
  );
};

export default MyBarChart;

const Group = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
`;

const Component = styled(motion.div)`
  width: 100vw;
  display: grid;
  gap: 4em;
  height: 100%;
  background-color: #ffffff;
  border: 1px solid #1d1d1d37;
  border-radius: 0.5em;
  overflow-y: scroll;
  padding: 1em;
 
  `;

const Backdrop = styled(motion.div)`
  width: 100%;
  height: calc(100vh);
  display: grid;
  justify-content: center;
  position: absolute;
  overflow: hidden;
  top: 0;
  z-index: 3000000000000000000;
`

const Header = styled.div`
  display: grid;
  grid-template-columns: 1fr max-content;
  align-items: center;
  gap: 1em;
  `