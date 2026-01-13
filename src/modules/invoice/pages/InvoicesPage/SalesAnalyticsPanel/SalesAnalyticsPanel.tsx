import { AnimatePresence, motion } from 'framer-motion';
import React, { useRef, useState, useEffect } from 'react';
import type { SalesRecord } from './utils';
import styled from 'styled-components';

import { useClickOutSide } from '@/hooks/useClickOutSide';
import { Button } from '@/components/ui/Button/Button';
import Typography from '@/components/ui/Typografy/Typografy';

import { DailySalesBarChart } from './components/Bars/DailySalesBarChart/DailySalesBarChart';
import { DiscountsGivenBarChart } from './components/Bars/DiscountsGivenBarChart/DiscountsGivenBarChart';
import { ItemsSoldBarChart } from './components/Bars/ItemsSoldBarChart/ItemsSoldBarChart';
import { PaymentMethodBarChart } from './components/Bars/PaymentMethodBarChart/PaymentMethodBarChart';
import { ProductCategorySalesBarChart } from './components/Bars/ProductCategorySalesBarChart/ProductCategorySalesBarChart';
import { PurchaseTypeBarChart } from './components/Bars/PurchaseTypeBarChart/PurchaseTypeBarChart';
import { TaxedSalesStackedBarChart } from './components/Bars/TaxedSalesStackedBarChart/TaxedSalesStackedBarChart';
import { TotalSalesPerCustomerChart } from './components/Bars/TotalSalesPerCustomerChart/TotalSalesPerCustomerChart';
import { CustomerSalesReportTable } from './components/Table/CustomerSalesReportTable';

type SalesAnalyticsPanelProps = {
  sales: SalesRecord[];
  isOpen: boolean;
  onOpen: () => void;
};

// Hook para detectar tamaño de pantalla
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

const SalesAnalyticsPanel = ({ sales, isOpen, onOpen }: SalesAnalyticsPanelProps) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

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
      y: isMobile ? '100vh' : '50vh',
    },
  };

  useClickOutSide(componentRef, isOpen, onOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <Backdrop
        variants={variantsBackdrop}
        initial="close"
        key="backdrop"
        animate={isOpen ? 'open' : 'close'}
        transition={{ duration: 0.5 }}
        exit="close"
        $isMobile={isMobile}
      >
        <Component
          ref={componentRef}
          variants={variantsContainer}
          initial="close"
          animate={isOpen ? 'open' : 'close'}
          transition={{ duration: 0.5 }}
          exit="close"
          $isMobile={isMobile}
        >
          <Header $isMobile={isMobile}>
            <TitleContainer>
              <Typography variant="h2">Análisis de ventas</Typography>
            </TitleContainer>
            <CloseButton title="Cerrar" onClick={onOpen} $isMobile={isMobile}>
              {isMobile ? '✕' : 'Cerrar'}
            </CloseButton>
          </Header>

          <ChartsContainer $isMobile={isMobile}>
            <DailySalesBarChart sales={sales} />
            <CustomerSalesReportTable sales={sales} />

            <Group $isMobile={isMobile}>
              <PaymentMethodBarChart sales={sales} />
              <PurchaseTypeBarChart sales={sales} />
            </Group>

            <TaxedSalesStackedBarChart sales={sales} />
            <ProductCategorySalesBarChart sales={sales} />
            <ItemsSoldBarChart sales={sales} />
            <DiscountsGivenBarChart sales={sales} />
            <TotalSalesPerCustomerChart sales={sales} />
          </ChartsContainer>
        </Component>
      </Backdrop>
    </AnimatePresence>
  );
};

export default SalesAnalyticsPanel;

const Group = styled.div`
  display: grid;
  grid-template-columns: ${(props) => (props.$isMobile ? '1fr' : '1fr 1fr')};
  gap: 1em;

  @media (width <= 768px) {
    grid-template-columns: 1fr;
    gap: 0.75em;
  }
`;

const Component = styled(motion.div)`
  display: grid;
  gap: ${(props) => (props.$isMobile ? '2em' : '4em')};
  width: ${(props) => (props.$isMobile ? '100vw' : '90vw')};
  max-width: ${(props) => (props.$isMobile ? '100vw' : '1200px')};
  height: 100%;
  padding: ${(props) => (props.$isMobile ? '0.75em' : '1em')};
  overflow-y: scroll;
  background-color: #fff;
  border: 1px solid #1d1d1d37;
  border-radius: ${(props) => (props.$isMobile ? '0' : '0.5em')};

  @media (width <= 768px) {
    gap: 1.5em;
    width: 100vw;
    padding: 0.75em;
    border-radius: 0;
  }

  @media (width <= 480px) {
    gap: 1em;
    padding: 0.5em;
  }
`;

const Backdrop = styled(motion.div)`
  position: absolute;
  top: 0;
  z-index: 3000000000000000000;
  display: grid;
  align-items: ${(props) => (props.$isMobile ? 'stretch' : 'center')};
  justify-content: center;
  width: 100%;
  height: calc(100vh);
  overflow: hidden;

  @media (width <= 768px) {
    align-items: stretch;
  }
`;

const Header = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: 1em;
  align-items: center;
  padding: ${(props) => (props.$isMobile ? '0.5em 0' : '0')};
  margin: ${(props) => (props.$isMobile ? '0 -0.5em' : '0')};
  background-color: #fff;

  @media (width <= 768px) {
    padding: 0.5em 0;
    padding-right: 0.75em;
    padding-left: 0.75em;
    margin: 0 -0.75em;
  }

  @media (width <= 480px) {
    gap: 0.5em;
    padding-right: 0.5em;
    padding-left: 0.5em;
    margin: 0 -0.5em;
  }
`;

const TitleContainer = styled.div`
  @media (width <= 768px) {
    h2 {
      font-size: 1.5em !important;
    }
  }

  @media (width <= 480px) {
    h2 {
      font-size: 1.3em !important;
      line-height: 1.2;
    }
  }
`;

const CloseButton = styled(Button)`
  min-width: ${(props) => (props.$isMobile ? '40px' : 'auto')};
  height: ${(props) => (props.$isMobile ? '40px' : 'auto')};
  padding: ${(props) => (props.$isMobile ? '0' : '0.5em 1em')};
  font-size: ${(props) => (props.$isMobile ? '1.2em' : '1em')};

  @media (width <= 768px) {
    min-width: 36px;
    height: 36px;
    font-size: 1.1em;
  }

  @media (width <= 480px) {
    min-width: 32px;
    height: 32px;
    font-size: 1em;
  }
`;

const ChartsContainer = styled.div`
  display: grid;
  gap: ${(props) => (props.$isMobile ? '2em' : '4em')};

  @media (width <= 768px) {
    gap: 1.5em;
  }

  @media (width <= 480px) {
    gap: 1em;
  }
`;
