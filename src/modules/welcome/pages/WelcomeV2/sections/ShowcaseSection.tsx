import { type Variants } from 'framer-motion';
import { useState } from 'react';

import {
  Accent,
  Bar,
  CheckMark,
  Content,
  ContentText,
  ContentVisual,
  Header,
  HighlightGrid,
  HighlightItem,
  ModuleDesc,
  ModuleTitle,
  Section,
  SectionLabel,
  SectionTitle,
  Tab,
  TabEmoji,
  TabLabel,
  Tabs,
  VisualBars,
  VisualIcon,
  VisualLabel,
} from './ShowcaseSection.styles';

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
