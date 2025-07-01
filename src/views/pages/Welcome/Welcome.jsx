import React, { useEffect, Suspense } from 'react'
import { useSelector } from 'react-redux'
import { Link, useMatch, useNavigate } from 'react-router-dom'
import { selectUser } from '../../../features/auth/userSlice'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { Spin } from 'antd'
import Header from './components/Header'
import ROUTES_PATH from '../../../routes/routesName'
import { Footer } from './components/Footer/Footer'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy loading de componentes
const Body = React.lazy(() => import('./components/Body/Body'))

export const Welcome = () => {
  const user = useSelector(selectUser)
  const { HOME } = ROUTES_PATH.BASIC_TERM
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      navigate(HOME);
    }
  }, [user, HOME, navigate]);

  // Variantes de animación para Framer Motion
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  return (
    <>
      <Helmet>
        <title>Ventamax - Sistema de Punto de Venta</title>
        <meta name="description" content="Ventamax es un sistema completo de punto de venta diseñado para llevar tu negocio al siguiente nivel con herramientas avanzadas y fácil de usar." />
        <meta name="keywords" content="punto de venta, facturación, inventario, ventas, negocio" />
        <meta property="og:title" content="Ventamax - Sistema de Punto de Venta" />
        <meta property="og:description" content="Sistema completo de punto de venta para tu negocio" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      {/* <ChangerPasswordModal /> */}
        <AnimatePresence mode="wait">        <Container
          as={motion.div}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <ErrorBoundary>
            <Header />
            <MainContent>
              <Suspense fallback={
                <LoadingContainer>
                  <Spin size="large" tip="Cargando..." />
                </LoadingContainer>
              }>
                <Body />
              </Suspense>
            </MainContent>
            <Footer />
          </ErrorBoundary>
        </Container>
      </AnimatePresence>
    </>
  )
}
const Container = styled.div`
  min-height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  margin: 0;
  background-color: #ffffff;
  color: #333;
  
  @media (max-width: 768px) {
    min-height: 100%;
  }
 
  a {
    color: var(--color-primary, #1890ff);
    font-size: 1.5rem;
    margin-bottom: 1rem;
    transition: color 0.3s ease;
    
    &:hover {
      color: var(--color-primary-hover, #40a9ff);
    }
  }
`

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Permite que el contenido se comprima si es necesario */
`

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  flex-direction: column;
  gap: 16px;
  
  .ant-spin-text {
    color: var(--color-text-secondary, #666);
    font-size: 16px;
  }
`

