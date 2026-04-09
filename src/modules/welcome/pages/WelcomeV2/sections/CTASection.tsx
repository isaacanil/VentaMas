import { m } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import ROUTES_PATH from '@/router/routes/routesName';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <Section>
      <Card
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <BgOrb $pos="top-left" />
        <BgOrb $pos="bottom-right" />
        <Content>
          <Title>¿Listo para llevar tu negocio al siguiente nivel?</Title>
          <Subtitle>
            Únete a cientos de negocios que ya gestionan sus operaciones con
            Ventamax. Comienza gratis hoy.
          </Subtitle>
          <ButtonRow>
            <PrimaryBtn
              onClick={() => navigate(ROUTES_PATH.AUTH_TERM.LOGIN)}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Comenzar prueba gratuita
            </PrimaryBtn>
            <SecondaryBtn
              as={m.a}
              href={`mailto:soporte@ventamax.com?subject=Demo Ventamax`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Solicitar demo
            </SecondaryBtn>
          </ButtonRow>
          <Fine>
            30 días gratis · Sin tarjeta de crédito · Cancela cuando quieras
          </Fine>
        </Content>
      </Card>
    </Section>
  );
};

export default CTASection;

/* ── Styles ── */
const Section = styled.section`
  padding: 40px 24px 100px;
  background: #fafbff;

  @media (max-width: 768px) {
    padding: 40px 16px 60px;
  }
`;

const Card = styled(m.div)`
  position: relative;
  max-width: 900px;
  margin: 0 auto;
  padding: 72px 48px;
  text-align: center;
  overflow: hidden;
  background: linear-gradient(135deg, #1e1b4b, #312e81);
  border-radius: 24px;

  @media (max-width: 768px) {
    padding: 48px 24px;
  }
`;

const BgOrb = styled.div<{ $pos: string }>`
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  opacity: 0.15;
  pointer-events: none;
  background: radial-gradient(circle, #818cf8, transparent 70%);

  ${({ $pos }) =>
    $pos === 'top-left'
      ? 'top: -100px; left: -100px;'
      : 'bottom: -100px; right: -100px;'}
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
`;

const Title = styled.h2`
  margin: 0 0 16px;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  font-weight: 800;
  line-height: 1.2;
  color: #fff;
`;

const Subtitle = styled.p`
  max-width: 520px;
  margin: 0 auto 32px;
  font-size: 1.05rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PrimaryBtn = styled(m.button)`
  padding: 14px 36px;
  font-size: 16px;
  font-weight: 600;
  color: #1e1b4b;
  background: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  outline: none;
`;

const SecondaryBtn = styled(m.a)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 36px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  text-decoration: none;
`;

const Fine = styled.p`
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
`;
