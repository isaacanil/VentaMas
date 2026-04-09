import { m, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import styled from 'styled-components';

/* ── Feature data representing real app capabilities ── */
interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
  tag?: string;
}

const features: Feature[] = [
  {
    icon: <Emoji>🛒</Emoji>,
    title: 'Punto de Venta',
    description:
      'Procesa ventas en segundos con escaneo de código de barras, múltiples métodos de pago y recibos automáticos.',
    color: '#06f',
    tag: 'Core',
  },
  {
    icon: <Emoji>📦</Emoji>,
    title: 'Inventario Inteligente',
    description:
      'Controla stock en múltiples almacenes con estructura estante → fila → segmento. Alertas automáticas y movimientos en tiempo real.',
    color: '#10b981',
  },
  {
    icon: <Emoji>🧾</Emoji>,
    title: 'Facturación con NCF',
    description:
      'Genera facturas con comprobantes fiscales (NCF) cumpliendo la normativa de la DGII. Secuencias automáticas y reportes.',
    color: '#8b5cf6',
    tag: 'RD',
  },
  {
    icon: <Emoji>💰</Emoji>,
    title: 'Cuentas por Cobrar',
    description:
      'Gestiona deudas de clientes, registra pagos parciales, genera recibos y audita el estado de las cuentas.',
    color: '#f59e0b',
  },
  {
    icon: <Emoji>🏦</Emoji>,
    title: 'Cuadre de Caja',
    description:
      'Apertura y cierre de caja con reconciliación automática. Compara ventas vs efectivo real y detecta diferencias.',
    color: '#ef4444',
  },
  {
    icon: <Emoji>📊</Emoji>,
    title: 'Reportes y Análisis',
    description:
      'Gráficos interactivos, exportación a PDF y Excel. Visualiza tendencias de venta, productos más vendidos y más.',
    color: '#7c3aed',
  },
  {
    icon: <Emoji>🛍️</Emoji>,
    title: 'Compras y Órdenes',
    description:
      'Crea órdenes de compra, conviértelas en compras, gestiona proveedores y controla backorders pendientes.',
    color: '#0891b2',
  },
  {
    icon: <Emoji>👥</Emoji>,
    title: 'Clientes y Proveedores',
    description:
      'Base de datos completa con historial de compras, deudas, contacto y notas. Todo en un solo lugar.',
    color: '#ea580c',
  },
  {
    icon: <Emoji>🔐</Emoji>,
    title: 'Roles y Permisos',
    description:
      'Admin, Gerente, Cajero, Comprador — cada rol con permisos granulares. Autorización por PIN para acciones sensibles.',
    color: '#be185d',
  },
  {
    icon: <Emoji>💸</Emoji>,
    title: 'Control de Gastos',
    description:
      'Registra gastos del negocio por categoría. Visualiza hacia dónde va tu dinero con reportes claros.',
    color: '#059669',
  },
  {
    icon: <Emoji>📱</Emoji>,
    title: 'Preventas',
    description:
      'Crea pre-ventas desde cualquier dispositivo. Tus vendedores capturan pedidos en campo y se sincronizan al instante.',
    color: '#6366f1',
  },
  {
    icon: <Emoji>🌙</Emoji>,
    title: 'Tema Claro / Oscuro',
    description:
      'Interfaz moderna con soporte para modo oscuro. Trabaja cómodamente de día o de noche.',
    color: '#475569',
  },
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const FeaturesGrid = () => (
  <Section id="features">
    <Header
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <SectionLabel>Funcionalidades</SectionLabel>
      <SectionTitle>
        Todo lo que tu negocio necesita, <Accent>en una sola plataforma</Accent>
      </SectionTitle>
      <SectionSub>
        Más de 10 módulos diseñados para cubrir cada aspecto de tu operación
        diaria.
      </SectionSub>
    </Header>

    <Grid
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {features.map((f) => (
        <Card
          key={f.title}
          variants={card}
          whileHover={{ y: -6, transition: { duration: 0.2 } }}
        >
          <CardIcon $color={f.color}>{f.icon}</CardIcon>
          <CardTitle>
            {f.title}
            {f.tag && <Tag $color={f.color}>{f.tag}</Tag>}
          </CardTitle>
          <CardDesc>{f.description}</CardDesc>
        </Card>
      ))}
    </Grid>
  </Section>
);

export default FeaturesGrid;

/* ── helper ── */
function Emoji({ children }: { children: string }) {
  return <span role="img">{children}</span>;
}

/* ── Styles ── */
const Section = styled.section`
  padding: 100px 24px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 60px 16px;
  }
`;

const Header = styled(m.div)`
  text-align: center;
  margin-bottom: 60px;
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
  max-width: 560px;
  margin: 0 auto;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--text-60, #5c667b);
`;

const Grid = styled(m.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(m.div)`
  padding: 28px 24px;
  background: #fff;
  border: 1px solid #eef0f5;
  border-radius: 16px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  }
`;

const CardIcon = styled.div<{ $color: string }>`
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  font-size: 22px;
  background: ${({ $color }) => `${$color}10`};
  border: 1.5px solid ${({ $color }) => `${$color}25`};
  border-radius: 12px;
`;

const CardTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-100, #2b3043);
`;

const Tag = styled.span<{ $color: string }>`
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}12`};
  border-radius: 6px;
`;

const CardDesc = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-60, #5c667b);
`;
