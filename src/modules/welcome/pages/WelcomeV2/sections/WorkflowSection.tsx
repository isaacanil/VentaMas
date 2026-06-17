import type { Variants } from 'framer-motion';

import { SectionLabel } from './SectionPrimitives.styles';
import {
  Accent,
  Connector,
  Header,
  Inner,
  Section,
  SectionSub,
  SectionTitle,
  Step,
  StepContent,
  StepDesc,
  StepIcon,
  StepLine,
  StepNumber,
  Steps,
  StepTitle,
} from './WorkflowSection.styles';

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
