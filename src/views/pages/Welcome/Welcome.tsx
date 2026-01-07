// @ts-nocheck
import { Spin } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import ROUTES_PATH from '@/router/routes/routesName';
import { lazyWithRetry } from '@/utils/lazyWithRetry';

import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { Footer } from './components/Footer/Footer';
import Header from './components/Header';

// Lazy loading de componentes
const Body = lazyWithRetry(
  () => import('./components/Body/Body'),
  'WelcomeBody',
);

export const Welcome = () => {
  const user = useSelector(selectUser);
  const { HOME } = ROUTES_PATH.BASIC_TERM;
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(HOME);
    }
  }, [user, HOME, navigate]);

  // Variantes de animación para Framer Motion
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  return (
    <>
      <title>Ventamax - Sistema de Punto de Venta</title>
      <meta
        name="description"
        content="Ventamax es un sistema completo de punto de venta diseñado para llevar tu negocio al siguiente nivel con herramientas avanzadas y fácil de usar."
      />
      <meta
        name="keywords"
        content="punto de venta, facturación, inventario, ventas, negocio"
      />
      <meta property="og:title" content="Ventamax - Sistema de Punto de Venta" />
      <meta
        property="og:description"
        content="Sistema completo de punto de venta para tu negocio"
      />
      <meta property="og:type" content="website" />
      <link rel="canonical" href={window.location.href} />
      {/* <ChangerPasswordModal /> */}
      <AnimatePresence mode="wait">
        {' '}
        <Container
          as={motion.div}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <ErrorBoundary>
            <Header />
            <MainContent>
              <Suspense
                fallback={
                  <LoadingContainer>
                    <Spin size="large" tip="Cargando...">
                      <div style={{ width: '100%', minHeight: 400 }} />
                    </Spin>
                  </LoadingContainer>
                }
              >
                <Body />
              </Suspense>
            </MainContent>
            <Footer />
          </ErrorBoundary>
        </Container>
      </AnimatePresence>
    </>
  );
};
const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  margin: 0;
  color: #333;
  background-color: #fff;

  @media (width <= 768px) {
    min-height: 100%;
  }

  a {
    margin-bottom: 1rem;
    font-size: 1.5rem;
    color: var(--color-primary, #1890ff);
    transition: color 0.3s ease;

    &:hover {
      color: var(--color-primary-hover, #40a9ff);
    }
  }
`;

const MainContent = styled.main`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0; /* Permite que el contenido se comprima si es necesario */
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
  min-height: 400px;

  .ant-spin-text {
    font-size: 16px;
    color: var(--color-text-secondary, #666);
  }
`;
