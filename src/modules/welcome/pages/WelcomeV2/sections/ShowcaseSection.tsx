import { m, type Variants } from 'framer-motion';
import { useState } from 'react';
import styled from 'styled-components';

/* ── Showcase tabs — deep-dive into key modules ── */
interface Module {
  id: string;
  label: string;
  emoji: string;
  title: string;
  description: string;
  highlights: string[];
  accentColor: string;
}

const modules: Module[] = [
  {
    id: 'pos',
    label: 'Punto de Venta',
    emoji: '🛒',
    title: 'Vende rápido, sin complicaciones',
    description:
      'Un POS diseñado para velocidad. Escanea códigos de barra, busca productos al instante, aplica descuentos y cobra con múltiples métodos de pago — todo en una sola pantalla.',
    highlights: [
      'Escaneo de código de barras integrado',
      'Búsqueda instantánea de productos',
      'Descuentos por producto o factura',
      'Efectivo, tarjeta y pagos mixtos',
      'Impresión automática de recibos',
      'Pre-ventas para pedidos en campo',
    ],
    accentColor: '#06f',
  },
  {
    id: 'inventory',
    label: 'Inventario',
    emoji: '📦',
    title: 'Control total de tu stock',
    description:
      'Gestiona productos en múltiples almacenes con una jerarquía de estantes, filas y segmentos. Visualiza movimientos, haz conteos físicos y recibe alertas de stock bajo.',
    highlights: [
      'Multi-almacén con ubicaciones',
      'Conteo físico con sesiones',
      'Historial de movimientos',
      'Alertas de stock bajo',
      'Impresión de códigos de barra',
      'Resumen e informes de inventario',
    ],
    accentColor: '#10b981',
  },
  {
    id: 'invoicing',
    label: 'Facturación',
    emoji: '🧾',
    title: 'Facturación fiscal automatizada',
    description:
      'Genera facturas con NCF de forma automática, cumpliendo con la DGII de República Dominicana. Controla secuencias, tipos de comprobante y genera reportes fiscales.',
    highlights: [
      'NCF automáticos (B01, B02, B14, B15)',
      'Secuencias configurables por tipo',
      'Notas de crédito',
      'Exportación PDF profesional',
      'Historial completo de facturas',
      'Cumplimiento DGII',
    ],
    accentColor: '#8b5cf6',
  },
  {
    id: 'cash',
    label: 'Cuadre de Caja',
    emoji: '🏦',
    title: 'Nunca pierdas un centavo',
    description:
      'Abre y cierra caja con montos verificados. El sistema compara ventas registradas vs efectivo real y detecta diferencias automáticamente.',
    highlights: [
      'Apertura con monto inicial',
      'Cierre con conteo de denominaciones',
      'Reconciliación automática',
      'Detección de diferencias',
      'Historial de cuadres',
      'Resumen de facturas por caja',
    ],
    accentColor: '#ef4444',
  },
  {
    id: 'receivable',
    label: 'Cuentas por Cobrar',
    emoji: '💰',
    title: 'Controla cada peso que te deben',
    description:
      'Lleva un registro detallado de las deudas de tus clientes. Registra pagos parciales, genera recibos y audita el estado de todas las cuentas.',
    highlights: [
      'Deudas por cliente',
      'Pagos parciales y totales',
      'Recibos de pago automáticos',
      'Auditoría de cuentas',
      'Historial de transacciones',
      'Alertas de vencimiento',
    ],
    accentColor: '#f59e0b',
  },
];

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const ShowcaseSection = () => {
  const [active, setActive] = useState(modules[0]);

  return (
    <Section id="showcase">
      <Header
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <SectionLabel>Módulos Principales</SectionLabel>
        <SectionTitle>
          Explora lo que puedes hacer con <Accent>Ventamax</Accent>
        </SectionTitle>
      </Header>

      <Tabs>
        {modules.map((moduleItem) => (
          <Tab
            key={moduleItem.id}
            $active={active.id === moduleItem.id}
            $color={moduleItem.accentColor}
            onClick={() => setActive(moduleItem)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <TabEmoji>{moduleItem.emoji}</TabEmoji>
            <TabLabel>{moduleItem.label}</TabLabel>
          </Tab>
        ))}
      </Tabs>

      <Content
        key={active.id}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <ContentText>
          <ModuleTitle $color={active.accentColor}>{active.title}</ModuleTitle>
          <ModuleDesc>{active.description}</ModuleDesc>
          <HighlightGrid>
            {active.highlights.map((h) => (
              <HighlightItem key={h}>
                <CheckMark $color={active.accentColor}>✓</CheckMark>
                {h}
              </HighlightItem>
            ))}
          </HighlightGrid>
        </ContentText>

        <ContentVisual $color={active.accentColor}>
          <VisualIcon>{active.emoji}</VisualIcon>
          <VisualLabel>{active.label}</VisualLabel>
          <VisualBars>
            {[80, 60, 90, 45, 70].map((w, i) => (
              <Bar
                key={`${active.id}-${w}-${i + 1}`}
                $color={active.accentColor}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: w / 100 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              />
            ))}
          </VisualBars>
        </ContentVisual>
      </Content>
    </Section>
  );
};

export default ShowcaseSection;

/* ── Styles ── */
const Section = styled.section`
  padding: 100px 24px;
  background: linear-gradient(180deg, #fafbff 0%, #f0f2ff 100%);

  @media (max-width: 768px) {
    padding: 60px 16px;
  }
`;

const Header = styled(m.div)`
  text-align: center;
  margin-bottom: 48px;
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
  margin: 0;
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

const Tabs = styled.div`
  display: flex;
  gap: 10px;
  max-width: 1000px;
  margin: 0 auto 48px;
  overflow-x: auto;
  padding-bottom: 4px;
  justify-content: center;
  flex-wrap: wrap;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled(m.button)<{ $active: boolean; $color: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid ${({ $active, $color }) => ($active ? $color : '#e0e4eb')};
  border-radius: 12px;
  background: ${({ $active, $color }) => ($active ? `${$color}0d` : '#fff')};
  color: ${({ $active, $color }) =>
    $active ? $color : 'var(--text-60, #5c667b)'};
  white-space: nowrap;
  outline: none;
  transition: all 0.2s;
`;

const TabEmoji = styled.span`
  font-size: 18px;
`;

const TabLabel = styled.span``;

const Content = styled(m.div)`
  display: flex;
  gap: 48px;
  max-width: 1000px;
  margin: 0 auto;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ContentText = styled.div`
  flex: 1;
`;

const ModuleTitle = styled.h3<{ $color: string }>`
  margin: 0 0 16px;
  font-size: 1.5rem;
  font-weight: 800;
  color: ${({ $color }) => $color};
`;

const ModuleDesc = styled.p`
  margin: 0 0 24px;
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-60, #5c667b);
`;

const HighlightGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const HighlightItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-100, #2b3043);
`;

const CheckMark = styled.span<{ $color: string }>`
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: ${({ $color }) => $color};
  border-radius: 6px;
  flex-shrink: 0;
`;

const ContentVisual = styled.div<{ $color: string }>`
  flex: 0 0 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 32px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid ${({ $color }) => `${$color}20`};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    flex: auto;
    width: 100%;
    max-width: 400px;
  }
`;

const VisualIcon = styled.div`
  font-size: 48px;
`;

const VisualLabel = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: var(--text-100, #2b3043);
`;

const VisualBars = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Bar = styled(m.div)<{ $color: string }>`
  width: 100%;
  height: 10px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    ${({ $color }) => $color},
    ${({ $color }) => `${$color}80`}
  );
  transform-origin: left center;
`;
