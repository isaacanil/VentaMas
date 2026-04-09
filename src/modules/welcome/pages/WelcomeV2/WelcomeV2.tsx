import { Spin } from 'antd';
import { AnimatePresence, m, type Variants } from 'framer-motion';
import { useEffect, Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import ROUTES_PATH from '@/router/routes/routesName';

const HeroSection = lazy(() => import('./sections/HeroSection'));
const FeaturesGrid = lazy(() => import('./sections/FeaturesGrid'));
const ShowcaseSection = lazy(() => import('./sections/ShowcaseSection'));
const StatsSection = lazy(() => import('./sections/StatsSection'));
const WorkflowSection = lazy(() => import('./sections/WorkflowSection'));
const TestimonialsSection = lazy(
  () => import('./sections/TestimonialsSection'),
);
const CTASection = lazy(() => import('./sections/CTASection'));
const FooterV2 = lazy(() => import('./sections/FooterV2'));

const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const Fallback = () => (
  <LoadingWrap>
    <Spin size="large" />
  </LoadingWrap>
);

export const WelcomeV2 = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(ROUTES_PATH.BASIC_TERM.HOME);
  }, [user, navigate]);

  return (
    <>
      <title>Ventamax — Punto de Venta Inteligente</title>
      <meta
        name="description"
        content="Ventamax: el sistema de punto de venta todo-en-uno para gestionar ventas, inventario, facturación, cuentas por cobrar y más. Potencia tu negocio."
      />

      <AnimatePresence mode="wait">
        <Page
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <Suspense fallback={<Fallback />}>
            <NavBar />
            <HeroSection />
            <StatsSection />
            <FeaturesGrid />
            <ShowcaseSection />
            <WorkflowSection />
            <TestimonialsSection />
            <CTASection />
            <FooterV2 />
          </Suspense>
        </Page>
      </AnimatePresence>
    </>
  );
};

/* ── Inline NavBar ─────────────────────────────────────────────── */
import { useState } from 'react';

function NavBar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Nav $scrolled={scrolled}>
      <NavInner>
        <Brand onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <BrandIcon>V</BrandIcon>
          Ventamax
        </Brand>
        <NavLinks>
          <NavLink href="#features">Funciones</NavLink>
          <NavLink href="#showcase">Módulos</NavLink>
          <NavLink href="#workflow">Cómo funciona</NavLink>
        </NavLinks>
        <NavCTA
          onClick={() => navigate(ROUTES_PATH.AUTH_TERM.LOGIN)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          Iniciar sesión
        </NavCTA>
      </NavInner>
    </Nav>
  );
}

/* ── Styles ────────────────────────────────────────────────────── */
const Page = styled(m.div)`
  min-height: 100vh;
  overflow-x: hidden;
  background: #fafbff;
  font-family: var(--font-sans, 'Poppins', sans-serif);
  color: var(--text-100, #2b3043);
`;

const LoadingWrap = styled.div`
  display: grid;
  place-items: center;
  min-height: 100vh;
`;

const Nav = styled.nav<{ $scrolled: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  backdrop-filter: blur(12px);
  background: ${({ $scrolled }) =>
    $scrolled ? 'rgba(255,255,255,0.92)' : 'transparent'};
  box-shadow: ${({ $scrolled }) =>
    $scrolled ? '0 1px 8px rgba(0,0,0,0.06)' : 'none'};
  transition: all 0.3s ease;
`;

const NavInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 700;
  color: var(--primary, #06f);
  cursor: pointer;
  user-select: none;
`;

const BrandIcon = styled.span`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, var(--primary, #06f), #4f46e5);
  border-radius: 10px;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 32px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled.a`
  font-size: 15px;
  font-weight: 500;
  color: var(--text-60, #5c667b);
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: var(--primary, #06f);
  }
`;

const NavCTA = styled(m.button)`
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, var(--primary, #06f), #4f46e5);
  border: none;
  border-radius: 10px;
  outline: none;

  @media (max-width: 480px) {
    padding: 8px 16px;
    font-size: 14px;
  }
`;
