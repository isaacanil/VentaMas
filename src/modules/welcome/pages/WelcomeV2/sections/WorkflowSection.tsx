import { m, type Variants } from 'framer-motion';
import styled from 'styled-components';

const steps = [
  {
    number: '01',
    title: 'Crea tu cuenta',
    description:
      'Regístrate en minutos. Configura tu negocio, sucursales y usuarios con roles específicos.',
    icon: '🚀',
  },
  {
    number: '02',
    title: 'Carga tu inventario',
    description:
      'Agrega productos manualmente, con código de barras o importa desde Excel. Organiza por categorías y almacenes.',
    icon: '📋',
  },
  {
    number: '03',
    title: 'Comienza a vender',
    description:
      'Usa el punto de venta para procesar transacciones. El sistema actualiza inventario y genera facturas automáticamente.',
    icon: '💳',
  },
  {
    number: '04',
    title: 'Analiza y crece',
    description:
      'Revisa reportes, identifica tendencias, controla gastos y toma decisiones basadas en datos reales.',
    icon: '📈',
  },
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const WorkflowSection = () => (
  <Section id="workflow">
    <Inner>
      <Header
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <SectionLabel>Cómo Funciona</SectionLabel>
        <SectionTitle>
          De cero a ventas en <Accent>4 pasos</Accent>
        </SectionTitle>
        <SectionSub>
          Empieza a gestionar tu negocio de forma profesional en cuestión de
          minutos.
        </SectionSub>
      </Header>

      <Steps
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {steps.map((step, i) => (
          <Step key={step.number} variants={item}>
            <StepLine>
              <StepNumber>{step.number}</StepNumber>
              {i < steps.length - 1 && <Connector />}
            </StepLine>
            <StepContent>
              <StepIcon>{step.icon}</StepIcon>
              <StepTitle>{step.title}</StepTitle>
              <StepDesc>{step.description}</StepDesc>
            </StepContent>
          </Step>
        ))}
      </Steps>
    </Inner>
  </Section>
);

export default WorkflowSection;

/* ── Styles ── */
const Section = styled.section`
  padding: 100px 24px;
  background: #fff;

  @media (max-width: 768px) {
    padding: 60px 16px;
  }
`;

const Inner = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled(m.div)`
  text-align: center;
  margin-bottom: 64px;
`;

const SectionLabel = styled.span`
  display: inline-block;
  padding: 4px 14px;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--primary, #06f);
  background: rgba(0, 102, 255, 0.07);
  border-radius: 100px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 16px;
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 800;
  line-height: 1.2;
  color: var(--text-100, #2b3043);
`;

const Accent = styled.span`
  background: linear-gradient(135deg, var(--primary, #06f), #7c3aed);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const SectionSub = styled.p`
  max-width: 460px;
  margin: 0 auto;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--text-60, #5c667b);
`;

const Steps = styled(m.div)`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const Step = styled(m.div)`
  display: flex;
  gap: 24px;
`;

const StepLine = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
`;

const StepNumber = styled.div`
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, var(--primary, #06f), #4f46e5);
  border-radius: 14px;
  flex-shrink: 0;
`;

const Connector = styled.div`
  width: 2px;
  flex: 1;
  min-height: 40px;
  background: linear-gradient(
    180deg,
    var(--primary, #06f) 0%,
    rgba(0, 102, 255, 0.1) 100%
  );
  border-radius: 2px;
`;

const StepContent = styled.div`
  padding-bottom: 48px;
`;

const StepIcon = styled.div`
  font-size: 28px;
  margin-bottom: 8px;
`;

const StepTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-100, #2b3043);
`;

const StepDesc = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-60, #5c667b);
  max-width: 480px;
`;
