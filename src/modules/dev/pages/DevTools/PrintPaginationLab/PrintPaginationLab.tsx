import { useCallback, useMemo, useState } from 'react';

import {
  MinusOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
} from '@/constants/icons/antd';

import {
  PaginatedDocument,
  type PaginatedBlock,
  type PaginatedDocumentContext,
  type PaginationRuntimeState,
} from '@/components/DocumentPagination';
import { printFrozenPaginatedDocument } from '@/components/DocumentPagination/browser';
import { useInvoicePaginationScenario } from './invoiceScenario/InvoicePaginationScenario';
import {
  INVOICE_SCENARIO_PRESETS,
  type InvoiceScenarioPresetId,
} from './invoiceScenario/invoiceScenarioFixtures';
import * as Styles from './PrintPaginationLab.styles';

const BASE_ROW_COUNT = 38;
const MIN_ROW_COUNT = 8;
const MAX_ROW_COUNT = 82;
const ROW_STEP = 5;
type LabScenarioMode = 'generic' | 'invoice';
const PRINT_READY_STATE: PaginationRuntimeState = {
  chromeOverflowRoles: [],
  duplicateBlockIds: [],
  measured: false,
  overflowBlockIds: [],
  pageCount: 1,
  readyToPrint: false,
  stable: false,
  unmeasuredBlockIds: [],
};
const PRESETS = [
  {
    label: '1 pagina',
    rows: 8,
  },
  {
    label: '2 paginas',
    rows: 18,
  },
  {
    label: '3+ paginas',
    rows: 48,
  },
  {
    label: 'Resumen al borde',
    rows: 34,
  },
] as const;
const SCENARIO_MODES: Array<{
  id: LabScenarioMode;
  label: string;
}> = [
  {
    id: 'generic',
    label: 'Demo',
  },
  {
    id: 'invoice',
    label: 'Factura',
  },
];

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-DO', {
    currency: 'DOP',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(value);

const buildRowDescription = (index: number, expanded: boolean) => {
  const baseText = `Servicio operativo ${String(index + 1).padStart(2, '0')}`;

  if (!expanded || index % 4 !== 0) {
    return baseText;
  }

  return `${baseText}. Incluye detalle extendido, referencia interna, condicion fiscal y observacion para validar alto variable.`;
};

const resolvePageRoleLabel = ({
  isFirstPage,
  isLastPage,
  totalPages,
}: PaginatedDocumentContext) => {
  if (totalPages === 1) {
    return 'Pagina unica';
  }

  if (isFirstPage) {
    return 'Primera pagina';
  }

  if (isLastPage) {
    return 'Pagina final';
  }

  return 'Pagina intermedia';
};

const PrintPaginationLab = () => {
  const [scenarioMode, setScenarioMode] =
    useState<LabScenarioMode>('generic');
  const [rowCount, setRowCount] = useState(BASE_ROW_COUNT);
  const [invoicePresetId, setInvoicePresetId] =
    useState<InvoiceScenarioPresetId>('twoPages');
  const [expandedHeader, setExpandedHeader] = useState(true);
  const [expandedFooter, setExpandedFooter] = useState(true);
  const [expandedRows, setExpandedRows] = useState(true);
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [giantBlockEnabled, setGiantBlockEnabled] = useState(false);
  const [paginationState, setPaginationState] =
    useState<PaginationRuntimeState>(PRINT_READY_STATE);
  const isInvoiceScenario = scenarioMode === 'invoice';
  const invoiceScenario = useInvoicePaginationScenario({
    includeOverflowBlock: isInvoiceScenario && giantBlockEnabled,
    presetId: invoicePresetId,
  });

  const blocks = useMemo<PaginatedBlock[]>(
    () =>
      Array.from({ length: rowCount }, (_, index) => {
        const quantity = (index % 4) + 1;
        const unitPrice = 420 + index * 17;
        const tax = unitPrice * quantity * 0.18;
        const total = unitPrice * quantity + tax;

        return {
          id: `row-${index + 1}`,
          content: (
            <Styles.BodyRow $tone={index % 2 === 0 ? 'soft' : 'plain'}>
              <Styles.RowStrong $align="center">{index + 1}</Styles.RowStrong>
              <Styles.RowCell>
                {buildRowDescription(index, expandedRows)}
              </Styles.RowCell>
              <Styles.RowCell $align="center">{quantity}</Styles.RowCell>
              <Styles.RowCell $align="right">
                {formatMoney(unitPrice)}
              </Styles.RowCell>
              <Styles.RowStrong $align="right">
                {formatMoney(total)}
              </Styles.RowStrong>
            </Styles.BodyRow>
          ),
        };
      }),
    [expandedRows, rowCount],
  );

  const subtotal = useMemo(
    () =>
      Array.from({ length: rowCount }, (_, index) => {
        const quantity = (index % 4) + 1;
        const unitPrice = 420 + index * 17;
        return unitPrice * quantity;
      }).reduce((total, value) => total + value, 0),
    [rowCount],
  );
  const tax = subtotal * 0.18;
  const grandTotal = subtotal + tax;

  const summaryBlock = useMemo<PaginatedBlock>(
    () => ({
      id: 'summary',
      content: (
        <Styles.SummaryBlock $expanded={expandedSummary}>
          <Styles.SummaryTitle>Resumen final</Styles.SummaryTitle>
          <Styles.TotalsGrid>
            <Styles.Notes>
              Este bloque pertenece al body. Si no cabe despues de las filas, el
              motor lo mueve completo a la pagina siguiente sin cortarlo.
              {expandedSummary ? (
                <>
                  {' '}
                  Esta version extendida agrega observaciones de auditoria,
                  terminos comerciales y referencias internas para probar que el
                  resumen sigue viajando como un bloque atomico.
                </>
              ) : null}
            </Styles.Notes>
            <Styles.Totals>
              <Styles.TotalLine>
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </Styles.TotalLine>
              <Styles.TotalLine>
                <span>ITBIS</span>
                <span>{formatMoney(tax)}</span>
              </Styles.TotalLine>
              <Styles.TotalLine $strong>
                <span>Total</span>
                <span>{formatMoney(grandTotal)}</span>
              </Styles.TotalLine>
            </Styles.Totals>
          </Styles.TotalsGrid>
        </Styles.SummaryBlock>
      ),
    }),
    [expandedSummary, grandTotal, subtotal, tax],
  );
  const giantBlock = useMemo<PaginatedBlock>(
    () => ({
      id: 'giant-block',
      content: (
        <Styles.GiantBlock>
          <Styles.SummaryTitle>Bloque gigante de prueba</Styles.SummaryTitle>
          <Styles.Notes>
            Este bloque intencionalmente supera la capacidad util de una pagina.
            Sirve para validar que el motor detecta overflow antes de imprimir y
            evita esconder un corte real dentro de la vista congelada.
          </Styles.Notes>
        </Styles.GiantBlock>
      ),
    }),
    [],
  );
  const documentBlocks = useMemo(
    () => {
      if (!giantBlockEnabled) {
        return [...blocks, summaryBlock];
      }

      const nextBlocks = [...blocks];
      nextBlocks.splice(Math.min(4, nextBlocks.length), 0, giantBlock);
      return [...nextBlocks, summaryBlock];
    },
    [blocks, giantBlock, giantBlockEnabled, summaryBlock],
  );
  const activeBlocks = isInvoiceScenario
    ? invoiceScenario.blocks
    : documentBlocks;

  const handleRowCountChange = useCallback((nextCount: number) => {
    setRowCount(Math.min(MAX_ROW_COUNT, Math.max(MIN_ROW_COUNT, nextCount)));
  }, []);

  const handlePrint = useCallback(async () => {
    if (!paginationState.readyToPrint) {
      return;
    }

    try {
      await printFrozenPaginatedDocument({
        title: isInvoiceScenario
          ? 'VentaMas - lab factura paginada'
          : 'VentaMas - lab de paginacion',
      });
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'No se pudo preparar la impresion del documento.',
      );
    }
  }, [isInvoiceScenario, paginationState.readyToPrint]);
  const printStateLabel = !paginationState.measured
    ? 'Midiendo'
    : paginationState.readyToPrint
      ? 'Listo'
      : paginationState.overflowBlockIds.length ||
          paginationState.unmeasuredBlockIds.length ||
          paginationState.chromeOverflowRoles.length
        ? 'Overflow'
        : !paginationState.stable
          ? 'Conservador'
          : 'Revisar';

  const renderHeader = useCallback(
    (context: PaginatedDocumentContext) => (
      <Styles.DocumentHeader $expanded={expandedHeader}>
        <Styles.HeaderTop>
          <Styles.Brand>
            <Styles.BrandName>VentaMas Documento</Styles.BrandName>
            <Styles.BrandMeta>
              RNC 101-99999-1 | Av. Duarte 100, Santo Domingo
            </Styles.BrandMeta>
            {expandedHeader ? (
              <>
                <Styles.BrandMeta>
                  Sucursal: Principal | Caja: Demo | Vendedor: Laboratorio
                </Styles.BrandMeta>
                <Styles.BrandMeta>
                  Condicion: credito 30 dias | Moneda: DOP
                </Styles.BrandMeta>
              </>
            ) : null}
          </Styles.Brand>
          <Styles.DocumentMeta>
            <Styles.DocumentTitle>Factura paginada</Styles.DocumentTitle>
            <Styles.DocumentNumber>LAB-000042</Styles.DocumentNumber>
            <Styles.DocumentNumber>
              Pagina {context.pageNumber} de {context.totalPages}
            </Styles.DocumentNumber>
            <Styles.PageRolePill>
              {resolvePageRoleLabel(context)}
            </Styles.PageRolePill>
          </Styles.DocumentMeta>
        </Styles.HeaderTop>
        {expandedHeader && context.isFirstPage ? (
          <Styles.ClientBand>
            <Styles.ClientText>
              Cliente: Distribuidora Camino Verde | RNC 132-45678-9
            </Styles.ClientText>
            <Styles.ClientText>NCF: E310000000123</Styles.ClientText>
          </Styles.ClientBand>
        ) : null}
        {expandedHeader && !context.isFirstPage ? (
          <Styles.ContinuationBand>
            <Styles.ClientText>
              Continuacion del documento LAB-000042
            </Styles.ClientText>
            <Styles.ClientText>Detalle distribuido por alto real</Styles.ClientText>
          </Styles.ContinuationBand>
        ) : null}
        <Styles.ColumnHeader>
          <span>#</span>
          <span>Descripcion</span>
          <span>Cant.</span>
          <span>Precio</span>
          <span>Total</span>
        </Styles.ColumnHeader>
      </Styles.DocumentHeader>
    ),
    [expandedHeader],
  );

  const renderFooter = useCallback(
    ({ isLastPage, pageNumber, totalPages }: PaginatedDocumentContext) => (
      <Styles.Footer $expanded={expandedFooter}>
        <Styles.FooterTop>
          <span>Copia cliente</span>
          <span>
            Pagina {pageNumber} de {totalPages}
          </span>
        </Styles.FooterTop>
        {expandedFooter && isLastPage ? (
          <Styles.SignatureGrid>
            <Styles.SignatureLine>Despachado por</Styles.SignatureLine>
            <Styles.SignatureLine>Recibido conforme</Styles.SignatureLine>
          </Styles.SignatureGrid>
        ) : null}
        {expandedFooter && !isLastPage ? (
          <Styles.FooterContinuation>
            Este documento continua en la pagina siguiente.
          </Styles.FooterContinuation>
        ) : null}
      </Styles.Footer>
    ),
    [expandedFooter],
  );

  return (
    <Styles.Page>
      <Styles.PrintPaginationGlobalStyle />
      <Styles.Workbench>
        <Styles.ControlPanel>
          <Styles.PanelHeader>
            <Styles.Eyebrow>Lab</Styles.Eyebrow>
            <Styles.Title>Paginacion HTML</Styles.Title>
            <Styles.Description>
              Header y footer se repiten, el body se reparte por alto real.
            </Styles.Description>
          </Styles.PanelHeader>

          <Styles.ControlGroup>
            <Styles.ControlLabel>Escenario</Styles.ControlLabel>
            <Styles.SegmentedControl>
              {SCENARIO_MODES.map((scenario) => (
                <Styles.SegmentButton
                  key={scenario.id}
                  $active={scenarioMode === scenario.id}
                  aria-pressed={scenarioMode === scenario.id}
                  onClick={() => {
                    setScenarioMode(scenario.id);
                    setGiantBlockEnabled(false);
                  }}
                  type="button"
                >
                  {scenario.label}
                </Styles.SegmentButton>
              ))}
            </Styles.SegmentedControl>
          </Styles.ControlGroup>

          {isInvoiceScenario ? (
            <Styles.ControlGroup>
              <Styles.ControlLabel>Factura</Styles.ControlLabel>
              <Styles.PresetGrid>
                {INVOICE_SCENARIO_PRESETS.map((preset) => (
                  <Styles.PresetButton
                    key={preset.id}
                    $active={invoicePresetId === preset.id && !giantBlockEnabled}
                    title={preset.description}
                    onClick={() => {
                      setInvoicePresetId(preset.id);
                      setGiantBlockEnabled(false);
                    }}
                    type="button"
                  >
                    {preset.label}
                  </Styles.PresetButton>
                ))}
              </Styles.PresetGrid>
            </Styles.ControlGroup>
          ) : (
            <>
              <Styles.ControlGroup>
                <Styles.ControlLabel>Filas</Styles.ControlLabel>
                <Styles.Stepper>
                  <Styles.IconButton
                    aria-label="Quitar filas"
                    onClick={() => handleRowCountChange(rowCount - ROW_STEP)}
                    type="button"
                  >
                    <MinusOutlined aria-hidden />
                  </Styles.IconButton>
                  <Styles.StepperValue>{rowCount}</Styles.StepperValue>
                  <Styles.IconButton
                    aria-label="Agregar filas"
                    onClick={() => handleRowCountChange(rowCount + ROW_STEP)}
                    type="button"
                  >
                    <PlusOutlined aria-hidden />
                  </Styles.IconButton>
                </Styles.Stepper>
              </Styles.ControlGroup>

              <Styles.ControlGroup>
                <Styles.ControlLabel>Casos</Styles.ControlLabel>
                <Styles.PresetGrid>
                  {PRESETS.map((preset) => (
                    <Styles.PresetButton
                      key={preset.label}
                      $active={rowCount === preset.rows && !giantBlockEnabled}
                      onClick={() => {
                        setRowCount(preset.rows);
                        setGiantBlockEnabled(false);
                      }}
                      type="button"
                    >
                      {preset.label}
                    </Styles.PresetButton>
                  ))}
                </Styles.PresetGrid>
              </Styles.ControlGroup>

              <Styles.ControlGroup>
                <Styles.ControlLabel>Altura</Styles.ControlLabel>
                <Styles.SegmentedControl>
                  <Styles.SegmentButton
                    $active={expandedHeader}
                    aria-pressed={expandedHeader}
                    onClick={() => setExpandedHeader((value) => !value)}
                    type="button"
                  >
                    Header
                  </Styles.SegmentButton>
                  <Styles.SegmentButton
                    $active={expandedFooter}
                    aria-pressed={expandedFooter}
                    onClick={() => setExpandedFooter((value) => !value)}
                    type="button"
                  >
                    Footer
                  </Styles.SegmentButton>
                </Styles.SegmentedControl>
              </Styles.ControlGroup>

              <Styles.ToggleRow>
                Filas variables
                <Styles.ToggleInput
                  checked={expandedRows}
                  onChange={(event) => setExpandedRows(event.target.checked)}
                  type="checkbox"
                />
              </Styles.ToggleRow>
              <Styles.ToggleRow>
                Resumen grande
                <Styles.ToggleInput
                  checked={expandedSummary}
                  onChange={(event) => setExpandedSummary(event.target.checked)}
                  type="checkbox"
                />
              </Styles.ToggleRow>
            </>
          )}
          <Styles.ToggleRow>
            Bloque gigante
            <Styles.ToggleInput
              checked={giantBlockEnabled}
              onChange={(event) => setGiantBlockEnabled(event.target.checked)}
              type="checkbox"
            />
          </Styles.ToggleRow>

          <Styles.MetricsGrid>
            <Styles.Metric>
              <dt>Bloques</dt>
              <dd>{activeBlocks.length}</dd>
            </Styles.Metric>
            <Styles.Metric>
              <dt>Paginas</dt>
              <dd>{paginationState.pageCount}</dd>
            </Styles.Metric>
            <Styles.Metric>
              <dt>Estado</dt>
              <dd>{printStateLabel}</dd>
            </Styles.Metric>
            <Styles.Metric>
              <dt>Total</dt>
              <dd>
                {(isInvoiceScenario
                  ? invoiceScenario.totalLabel
                  : formatMoney(grandTotal)
                ).replace('DOP', 'RD$')}
              </dd>
            </Styles.Metric>
          </Styles.MetricsGrid>

          <Styles.ActionRow>
            <Styles.ActionButton
              disabled={!paginationState.readyToPrint}
              onClick={handlePrint}
              type="button"
            >
              <PrinterOutlined aria-hidden />
              Imprimir
            </Styles.ActionButton>
            <Styles.SecondaryActionButton
              onClick={() => {
                setRowCount(BASE_ROW_COUNT);
                setExpandedHeader(true);
                setExpandedFooter(true);
                setExpandedRows(true);
                setExpandedSummary(false);
                setGiantBlockEnabled(false);
                setInvoicePresetId('twoPages');
              }}
              type="button"
            >
              <ReloadOutlined aria-hidden />
              Reset
            </Styles.SecondaryActionButton>
          </Styles.ActionRow>
        </Styles.ControlPanel>

        <Styles.PreviewShell>
          <PaginatedDocument
            ariaLabel="Vista previa paginada"
            blocks={activeBlocks}
            onPaginationStateChange={setPaginationState}
            renderFooter={
              isInvoiceScenario ? invoiceScenario.renderFooter : renderFooter
            }
            renderHeader={
              isInvoiceScenario ? invoiceScenario.renderHeader : renderHeader
            }
            showDebug
          />
        </Styles.PreviewShell>
      </Styles.Workbench>
    </Styles.Page>
  );
};

export default PrintPaginationLab;
