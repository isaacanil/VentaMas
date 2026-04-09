import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { Button } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  selectPurchaseChartModal,
  togglePurchaseChartModal,
} from '@/features/purchase/purchaseUISlice';
import type { Purchase } from '@/utils/purchase/types';
import Typography from '@/components/ui/Typografy/Typografy';
import { PurchasesAnalyticsPanel } from './components/PurchasesAnalyticsPanel/PurchasesAnalyticsPanel';

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

interface PurchasesReportProps {
  purchases?: Purchase[];
  loading?: boolean;
}

export const PurchasesReport = ({
  purchases = [],
  loading = false,
}: PurchasesReportProps) => {
  const dispatch = useDispatch();
  const { isOpen } = useSelector(selectPurchaseChartModal) as {
    isOpen: boolean;
  };
  const handleOpenPurchaseChart = () => dispatch(togglePurchaseChartModal());

  return (
    <LazyMotion features={domAnimation}>
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
              variants={variantsContainer}
              initial="close"
              animate={isOpen ? 'open' : 'close'}
              transition={{ duration: 0.5 }}
              exit="close"
            >
              <Header>
                <TitleBlock>
                  <Typography variant="h2">Analisis de compras</Typography>
                  <Subtitle>
                    Revisa como se reparte el gasto del periodo entre
                    suplidores, categorias, condiciones de pago y balances
                    pendientes.
                  </Subtitle>
                </TitleBlock>
                <Button onClick={handleOpenPurchaseChart}>Cerrar</Button>
              </Header>
              <Body>
                <PurchasesAnalyticsPanel
                  purchases={purchases}
                  loading={loading}
                />
              </Body>
            </Component>
          </Backdrop>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
};

const Component = styled(m.div)`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: min(1360px, calc(100vw - 24px));
  height: calc(100vh - 24px);
  overflow: hidden;
  background: var(--color2);
  border: 1px solid rgb(15 23 42 / 12%);
  border-radius: 12px;
  box-shadow: 0 18px 48px rgb(15 23 42 / 18%);
`;

const Backdrop = styled(m.div)`
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  align-items: center;
  justify-content: center;
  padding: 12px;
  overflow: hidden;
  background: rgb(15 23 42 / 16%);
  backdrop-filter: blur(4px);
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: 1em;
  align-items: center;
  padding: 1.1rem 1.25rem 0.85rem;
  background: var(--color2);
  border-bottom: 1px solid rgb(15 23 42 / 8%);

  @media (width <= 768px) {
    grid-template-columns: 1fr;
  }
`;

const TitleBlock = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const Subtitle = styled.p`
  margin: 0;
  max-width: 58rem;
  color: var(--gray-7);
  font-size: 0.92rem;
  line-height: 1.5;
`;

const Body = styled.div`
  min-height: 0;
  padding: 1rem 1.25rem 1.25rem;
  overflow-y: auto;
`;
