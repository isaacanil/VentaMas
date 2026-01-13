// @ts-nocheck
import styled from 'styled-components';

const SummaryContainer = styled.div`
  /* Tokens ligeros y compactos (solo claro) */
  --pad-y: 12px;
  --pad-x: 14px;
  --gap: 8px;
  --radius: 10px;
  --outline-variant: #e0e3eb; /* gris suave (light) */
  --on-surface: #1f1f1f;
  --on-surface-variant: #5f6368; /* gris Google */
  --surface: #fff;
  --chip-bg: rgb(26 115 232 / 8%);
  --chip-fg: #1a73e8;

  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  color: var(--on-surface);

  /* Densidad aún más compacta si se desea: <SummaryContainer data-density="compact" /> */
  &[data-density='compact'] {
    --pad-y: 10px;
    --pad-x: 12px;
    --gap: 6px;

    gap: 10px;
    margin-bottom: 12px;
  }
`;

const SummaryItem = styled.article`
  display: flex;
  min-width: 220px;
`;

const SummaryCard = styled.div`
  display: grid;
  gap: var(--gap);
  width: 100%;
  min-height: 100%;
  padding: var(--pad-y) var(--pad-x);
  background: var(--surface);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius);
  box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
  transition:
    box-shadow 120ms ease,
    transform 120ms ease,
    border-color 120ms ease;

  &:hover {
    box-shadow: 0 2px 6px rgb(0 0 0 / 8%);
    transform: translateY(-1px);
  }

  &:focus-within {
    outline: 2px solid rgb(26 115 232 / 25%);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const SummaryLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const SummaryValue = styled.span`
  font-family: 'Poppins', monospace;
  font-size: clamp(16px, 1.6vw, 20px);
  font-weight: 600;
  line-height: 1.15;
  color: var(--on-surface);
  letter-spacing: 0.02em;
  overflow-wrap: anywhere;
`;

const SummaryHint = styled.span`
  font-size: 12px;
  line-height: 1.45;
  color: var(--on-surface-variant);
`;

const SummaryFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px solid var(--outline-variant);
`;

const SummaryBadge = styled.span`
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.6;
  color: var(--chip-fg);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  background: var(--chip-bg);
  border-radius: 999px;
`;

const resolveDisplayValue = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
};

export default function NcfSequenceSummary({
  current,
  next,
  last,
  quantity,
  increment,
  density = 'compact', // "compact" | "regular"
}) {
  const safeQuantity = Number(quantity);
  const safeIncrement = Number(increment);

  const quantityLabel =
    Number.isFinite(safeQuantity) && safeQuantity > 0
      ? `${safeQuantity} comprobantes`
      : null;

  const incrementLabel =
    Number.isFinite(safeIncrement) && safeIncrement > 0
      ? `Incremento ${safeIncrement}`
      : null;

  const items = [
    {
      key: 'current',
      label: 'NCF actual (almacenado)',
      value: resolveDisplayValue(current, 'Sin datos aún'),
      hint: current
        ? 'Este es el comprobante configurado actualmente.'
        : 'Completa serie, tipo y secuencia para visualizarlo.',
    },
    {
      key: 'next',
      label: 'Próximo NCF (siguiente factura)',
      value: resolveDisplayValue(next, 'Pendiente de cálculo'),
      hint: next
        ? 'Así se generará el próximo comprobante disponible.'
        : 'Calculamos el próximo NCF cuando completes la configuración.',
    },
    {
      key: 'last',
      label: 'Último NCF proyectado',
      value: resolveDisplayValue(last, 'Necesitamos cantidad válida'),
      hint: last
        ? quantityLabel
          ? `Se alcanzará tras emitir ${quantityLabel}.`
          : 'Corresponde al tope de esta configuración.'
        : 'Indica una cantidad y verificaremos el límite generado.',
      footer: [quantityLabel, incrementLabel].filter(Boolean),
    },
  ];

  return (
    <SummaryContainer data-density={density}>
      {items.map(({ key, label, value, hint, footer }) => (
        <SummaryItem key={key}>
          <SummaryCard tabIndex={0}>
            <SummaryLabel>{label}</SummaryLabel>
            <SummaryValue>{value}</SummaryValue>
            <SummaryHint>{hint}</SummaryHint>
            {footer && footer.length > 0 && (
              <SummaryFooter>
                {footer.map((footerItem) => (
                  <SummaryBadge key={footerItem}>{footerItem}</SummaryBadge>
                ))}
              </SummaryFooter>
            )}
          </SummaryCard>
        </SummaryItem>
      ))}
    </SummaryContainer>
  );
}
