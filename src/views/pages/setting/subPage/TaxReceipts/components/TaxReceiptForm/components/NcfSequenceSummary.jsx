import styled from "styled-components";

const SummaryContainer = styled.div`
  /* Tokens ligeros y compactos (solo claro) */
  --pad-y: 12px;
  --pad-x: 14px;
  --gap: 8px;
  --radius: 10px;
  --outline-variant: #e0e3eb;   /* gris suave (light) */
  --on-surface: #1f1f1f;
  --on-surface-variant: #5f6368; /* gris Google */
  --surface: #ffffff;
  --chip-bg: rgba(26, 115, 232, 0.08);
  --chip-fg: #1a73e8;

  color: var(--on-surface);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 16px;

  /* Densidad aún más compacta si se desea: <SummaryContainer data-density="compact" /> */
  &[data-density="compact"] {
    --pad-y: 10px;
    --pad-x: 12px;
    --gap: 6px;
    gap: 10px;
    margin-bottom: 12px;
  }
`;

const SummaryItem = styled.article`
  min-width: 220px;
  display: flex;
`;

const SummaryCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius);
  padding: var(--pad-y) var(--pad-x);
  display: grid;
  gap: var(--gap);
  width: 100%;
  min-height: 100%;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  transition: box-shadow 120ms ease, transform 120ms ease, border-color 120ms ease;

  &:hover {
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    transform: translateY(-1px);
  }

  &:focus-within {
    outline: 2px solid rgba(26,115,232,0.25);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const SummaryLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--on-surface-variant);
  line-height: 1.2;
`;

const SummaryValue = styled.span`
  font-size: clamp(16px, 1.6vw, 20px);
  font-weight: 600;
  color: var(--on-surface);
  line-height: 1.15;
  word-break: break-word;
  font-family: "Roboto Mono", "Fira Code", Menlo, Consolas, monospace;
  letter-spacing: 0.02em;
`;

const SummaryHint = styled.span`
  font-size: 12px;
  color: var(--on-surface-variant);
  line-height: 1.45;
`;

const SummaryFooter = styled.div`
  margin-top: 4px;
  padding-top: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  border-top: 1px solid var(--outline-variant);
`;

const SummaryBadge = styled.span`
  background: var(--chip-bg);
  color: var(--chip-fg);
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  line-height: 1.6;
`;

const resolveDisplayValue = (value, fallback) => {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
};

export default function NcfSequenceSummary({
  current,
  next,
  last,
  quantity,
  increment,
  density = "compact", // "compact" | "regular"
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
      key: "current",
      label: "NCF actual (almacenado)",
      value: resolveDisplayValue(current, "Sin datos aún"),
      hint: current
        ? "Este es el comprobante configurado actualmente."
        : "Completa serie, tipo y secuencia para visualizarlo.",
    },
    {
      key: "next",
      label: "Próximo NCF (siguiente factura)",
      value: resolveDisplayValue(next, "Pendiente de cálculo"),
      hint: next
        ? "Así se generará el próximo comprobante disponible."
        : "Calculamos el próximo NCF cuando completes la configuración.",
    },
    {
      key: "last",
      label: "Último NCF proyectado",
      value: resolveDisplayValue(last, "Necesitamos cantidad válida"),
      hint: last
        ? quantityLabel
          ? `Se alcanzará tras emitir ${quantityLabel}.`
          : "Corresponde al tope de esta configuración."
        : "Indica una cantidad y verificaremos el límite generado.",
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
