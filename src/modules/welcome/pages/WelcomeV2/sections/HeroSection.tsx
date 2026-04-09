import { m, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import ROUTES_PATH from '@/router/routes/routesName';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  }),
};

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <Hero>
      <HeroBg />
      <HeroContent>
        <Badge custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <BadgeDot /> Nuevo — Gestión de almacenes multi-nivel
        </Badge>

        <Title custom={1} variants={fadeUp} initial="hidden" animate="visible">
          Todo lo que necesitas para <Highlight>gestionar tu negocio</Highlight>{' '}
          en un solo lugar
        </Title>

        <Subtitle
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          Ventas, inventario, facturación, cuentas por cobrar, compras, gastos y
          reportes — todo conectado en tiempo real. Diseñado para negocios en
          República Dominicana.
        </Subtitle>

        <ButtonRow
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <PrimaryBtn
            onClick={() => navigate(ROUTES_PATH.AUTH_TERM.LOGIN)}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Comenzar ahora
            <ArrowSvg />
          </PrimaryBtn>
          <SecondaryBtn
            href="#showcase"
            as={m.a}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Ver módulos
          </SecondaryBtn>
        </ButtonRow>

        <TrustRow
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <TrustItem>
            <TrustIcon>✓</TrustIcon> Prueba gratis 30 días
          </TrustItem>
          <TrustItem>
            <TrustIcon>✓</TrustIcon> Sin tarjeta de crédito
          </TrustItem>
          <TrustItem>
            <TrustIcon>✓</TrustIcon> Soporte incluido
          </TrustItem>
        </TrustRow>
      </HeroContent>

      <MockupWrap
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <MockupCard
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        >
          <MockupBar>
            <MockupDot $c="#ff5f57" />
            <MockupDot $c="#ffbd2e" />
            <MockupDot $c="#28c840" />
          </MockupBar>
          <MockupBody>
            <MockupSidebar>
              <MockupNavItem $active>Ventas</MockupNavItem>
              <MockupNavItem>Inventario</MockupNavItem>
              <MockupNavItem>Facturas</MockupNavItem>
              <MockupNavItem>Clientes</MockupNavItem>
              <MockupNavItem>Reportes</MockupNavItem>
            </MockupSidebar>
            <MockupMain>
              <MockupHeader>
                <MockupTitle>Punto de Venta</MockupTitle>
                <MockupBadge>$12,450.00</MockupBadge>
              </MockupHeader>
              <MockupGrid>
                <MockupProduct>
                  <MockupProductIcon>📦</MockupProductIcon>
                  <span>Producto A</span>
                  <MockupPrice>$250.00</MockupPrice>
                </MockupProduct>
                <MockupProduct>
                  <MockupProductIcon>🧴</MockupProductIcon>
                  <span>Producto B</span>
                  <MockupPrice>$180.00</MockupPrice>
                </MockupProduct>
                <MockupProduct>
                  <MockupProductIcon>💊</MockupProductIcon>
                  <span>Producto C</span>
                  <MockupPrice>$95.00</MockupPrice>
                </MockupProduct>
                <MockupProduct>
                  <MockupProductIcon>🥤</MockupProductIcon>
                  <span>Producto D</span>
                  <MockupPrice>$45.00</MockupPrice>
                </MockupProduct>
              </MockupGrid>
            </MockupMain>
          </MockupBody>
        </MockupCard>
      </MockupWrap>
    </Hero>
  );
};

export default HeroSection;

/* ── small SVG ────────────────────────────── */
const ArrowSvg = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginLeft: 6 }}
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

/* ── Styles ───────────────────────────────── */
const Hero = styled.section`
  position: relative;
  display: flex;
  align-items: center;
  gap: 40px;
  max-width: 1200px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 120px 24px 80px;

  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
    padding-top: 100px;
    gap: 48px;
  }
`;

const HeroBg = styled.div`
  position: fixed;
  top: -200px;
  right: -200px;
  width: 700px;
  height: 700px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(0, 102, 255, 0.08) 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  flex: 1;
  max-width: 600px;

  @media (max-width: 1024px) {
    max-width: 700px;
  }
`;

const Badge = styled(m.div)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  margin-bottom: 24px;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary, #06f);
  background: rgba(0, 102, 255, 0.08);
  border: 1px solid rgba(0, 102, 255, 0.15);
  border-radius: 100px;
`;

const BadgeDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary, #06f);
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
`;

const Title = styled(m.h1)`
  margin: 0 0 20px;
  font-size: clamp(2.2rem, 5vw, 3.6rem);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.02em;
  color: var(--text-100, #2b3043);
`;

const Highlight = styled.span`
  background: linear-gradient(135deg, var(--primary, #06f), #7c3aed);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled(m.p)`
  margin: 0 0 32px;
  font-size: clamp(1rem, 2vw, 1.18rem);
  line-height: 1.7;
  color: var(--text-60, #5c667b);
`;

const ButtonRow = styled(m.div)`
  display: flex;
  gap: 16px;
  margin-bottom: 32px;

  @media (max-width: 1024px) {
    justify-content: center;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PrimaryBtn = styled(m.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, var(--primary, #06f), #4f46e5);
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0, 102, 255, 0.3);
  outline: none;
`;

const SecondaryBtn = styled(m.a)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-100, #2b3043);
  cursor: pointer;
  background: #fff;
  border: 1.5px solid var(--border, #d7dbe8);
  border-radius: 12px;
  text-decoration: none;
`;

const TrustRow = styled(m.div)`
  display: flex;
  gap: 24px;
  flex-wrap: wrap;

  @media (max-width: 1024px) {
    justify-content: center;
  }
`;

const TrustItem = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-60, #5c667b);
`;

const TrustIcon = styled.span`
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--success, #33d9b2);
  border-radius: 50%;
`;

/* ── Mockup ───────────────────────────────── */
const MockupWrap = styled(m.div)`
  position: relative;
  z-index: 1;
  flex: 1;
  max-width: 520px;
  perspective: 1000px;

  @media (max-width: 1024px) {
    max-width: 600px;
    width: 100%;
  }
`;

const MockupCard = styled(m.div)`
  border-radius: 16px;
  background: #fff;
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
`;

const MockupBar = styled.div`
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
`;

const MockupDot = styled.span<{ $c: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $c }) => $c};
`;

const MockupBody = styled.div`
  display: flex;
  min-height: 280px;
`;

const MockupSidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 0;
  width: 120px;
  background: #f8f9fc;
  border-right: 1px solid #eee;

  @media (max-width: 480px) {
    width: 90px;
  }
`;

const MockupNavItem = styled.div<{ $active?: boolean }>`
  padding: 8px 16px;
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  color: ${({ $active }) => ($active ? 'var(--primary, #06f)' : '#888')};
  background: ${({ $active }) =>
    $active ? 'rgba(0, 102, 255, 0.08)' : 'transparent'};
  border-left: 3px solid
    ${({ $active }) => ($active ? 'var(--primary, #06f)' : 'transparent')};
`;

const MockupMain = styled.div`
  flex: 1;
  padding: 16px;
`;

const MockupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const MockupTitle = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-100, #2b3043);
`;

const MockupBadge = styled.span`
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--primary, #06f);
  background: rgba(0, 102, 255, 0.08);
  border-radius: 8px;
`;

const MockupGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const MockupProduct = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  font-size: 11px;
  font-weight: 500;
  color: #555;
  background: #f8f9fc;
  border-radius: 10px;
  border: 1px solid #eef0f4;
`;

const MockupProductIcon = styled.span`
  font-size: 22px;
`;

const MockupPrice = styled.span`
  font-weight: 700;
  color: var(--primary, #06f);
  font-size: 12px;
`;
