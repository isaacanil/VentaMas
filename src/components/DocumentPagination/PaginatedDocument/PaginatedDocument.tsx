import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';

import {
  createEmptyChromeMeasurements,
  resolvePageRole,
} from './hooks/paginationEngine';
import { useMeasuredPagination } from './hooks/useMeasuredPagination';
import * as Styles from './PaginatedDocument.styles';
import type {
  PageGeometry,
  PaginatedBlock,
  PaginatedDocumentContext,
  PaginationMeasurements,
  PaginationPageRole,
  PaginationRuntimeState,
} from './types';

const DEFAULT_PAGE_GEOMETRY: PageGeometry = {
  bodyGapPx: 8,
  chromeGapMm: 5,
  heightMm: 297,
  paddingBlockMm: 12,
  paddingInlineMm: 13,
  widthMm: 210,
};

type PaginatedDocumentProps = {
  ariaLabel: string;
  blocks: PaginatedBlock[];
  className?: string;
  geometry?: PageGeometry;
  renderFooter: (context: PaginatedDocumentContext) => ReactNode;
  renderHeader: (context: PaginatedDocumentContext) => ReactNode;
  onPaginationStateChange?: (state: PaginationRuntimeState) => void;
  showDebug?: boolean;
};

type MeasurementLayerProps = {
  blocks: PaginatedBlock[];
  onMeasure: (measurements: PaginationMeasurements) => void;
  renderFooter: (context: PaginatedDocumentContext) => ReactNode;
  renderHeader: (context: PaginatedDocumentContext) => ReactNode;
  totalPages: number;
};

const readElementHeight = (element: Element | null) =>
  element ? Math.ceil(element.getBoundingClientRect().height) : 0;

const resolveMaxElementHeight = (elements: NodeListOf<Element>) =>
  Math.max(0, ...Array.from(elements).map(readElementHeight));

const buildChromeMeasureContexts = (
  totalPages: number,
): Array<{
  context: PaginatedDocumentContext;
  role: PaginationPageRole;
}> => {
  const multiPageTotal = Math.max(2, totalPages);
  const middlePageTotal = Math.max(3, totalPages);

  return [
    {
      context: {
        isFirstPage: true,
        isLastPage: true,
        pageBlockCount: 0,
        pageNumber: 1,
        totalPages: 1,
      },
      role: 'single',
    },
    {
      context: {
        isFirstPage: true,
        isLastPage: false,
        pageBlockCount: 0,
        pageNumber: 1,
        totalPages: multiPageTotal,
      },
      role: 'first',
    },
    {
      context: {
        isFirstPage: false,
        isLastPage: false,
        pageBlockCount: 0,
        pageNumber: Math.max(2, middlePageTotal - 1),
        totalPages: middlePageTotal,
      },
      role: 'middle',
    },
    {
      context: {
        isFirstPage: false,
        isLastPage: true,
        pageBlockCount: 0,
        pageNumber: multiPageTotal,
        totalPages: multiPageTotal,
      },
      role: 'last',
    },
  ];
};

const MeasurementLayer = ({
  blocks,
  onMeasure,
  renderFooter,
  renderHeader,
  totalPages,
}: MeasurementLayerProps) => {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const measureContexts = useMemo(
    () => buildChromeMeasureContexts(totalPages),
    [totalPages],
  );

  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (
      !layer ||
      typeof window === 'undefined' ||
      typeof ResizeObserver === 'undefined' ||
      typeof window.requestAnimationFrame !== 'function'
    ) {
      return undefined;
    }

    let frameId: number | null = null;

    const measure = () => {
      frameId = null;

      const blockHeights = Array.from(
        layer.querySelectorAll<HTMLElement>('[data-paginated-block-id]'),
      ).reduce<Record<string, number>>((accumulator, element) => {
        const blockId = element.dataset.paginatedBlockId;
        if (blockId) {
          accumulator[blockId] = readElementHeight(element);
        }
        return accumulator;
      }, {});
      const chromeHeights = createEmptyChromeMeasurements();

      measureContexts.forEach(({ role }) => {
        chromeHeights[role] = {
          footerHeight: readElementHeight(
            layer.querySelector(`[data-paginated-footer-role="${role}"]`),
          ),
          headerHeight: readElementHeight(
            layer.querySelector(`[data-paginated-header-role="${role}"]`),
          ),
        };
      });

      onMeasure({
        blockHeights,
        chromeHeights,
        footerHeight: resolveMaxElementHeight(
          layer.querySelectorAll('[data-paginated-footer]'),
        ),
        headerHeight: resolveMaxElementHeight(
          layer.querySelectorAll('[data-paginated-header]'),
        ),
        measured: true,
      });
    };

    const scheduleMeasure = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(measure);
    };

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(layer);
    layer
      .querySelectorAll<HTMLElement>(
        '[data-paginated-header], [data-paginated-footer], [data-paginated-block-id]',
      )
      .forEach((element) => observer.observe(element));
    scheduleMeasure();

    return () => {
      observer.disconnect();
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [blocks, measureContexts, onMeasure, totalPages]);

  return (
    <Styles.MeasurementLayer ref={layerRef} aria-hidden>
      <Styles.MeasurementPaper>
        {measureContexts.map(({ context, role }) => (
          <Styles.MeasurementChrome
            key={`header-measure-${role}`}
            data-paginated-header
            data-paginated-header-role={role}
          >
            {renderHeader(context)}
          </Styles.MeasurementChrome>
        ))}
        <Styles.MeasurementBody>
          {blocks.map((block) => (
            <Styles.PageBlock
              key={`measure-${block.id}`}
              data-paginated-block-id={block.id}
            >
              {block.content}
            </Styles.PageBlock>
          ))}
        </Styles.MeasurementBody>
        {measureContexts.map(({ context, role }) => (
          <Styles.MeasurementChrome
            key={`footer-measure-${role}`}
            data-paginated-footer
            data-paginated-footer-role={role}
          >
            {renderFooter(context)}
          </Styles.MeasurementChrome>
        ))}
      </Styles.MeasurementPaper>
    </Styles.MeasurementLayer>
  );
};

export const PaginatedDocument = ({
  ariaLabel,
  blocks,
  className,
  geometry = DEFAULT_PAGE_GEOMETRY,
  onPaginationStateChange,
  renderFooter,
  renderHeader,
  showDebug = false,
}: PaginatedDocumentProps) => {
  const { layout, measurements, onMeasure } = useMeasuredPagination({
    blocks,
    geometry,
  });
  const totalPages = layout.pages.length;
  const canMeasureDom =
    typeof window !== 'undefined' &&
    (typeof ResizeObserver !== 'undefined' &&
      typeof window.requestAnimationFrame === 'function');
  const runtimeState = useMemo<PaginationRuntimeState>(
    () => ({
      chromeOverflowRoles: layout.chromeOverflowRoles,
      duplicateBlockIds: layout.duplicateBlockIds,
      measured: measurements.measured,
      overflowBlockIds: layout.overflowBlockIds,
      pageCount: totalPages,
      readyToPrint:
        measurements.measured &&
        layout.stable &&
        layout.chromeOverflowRoles.length === 0 &&
        layout.overflowBlockIds.length === 0 &&
        layout.duplicateBlockIds.length === 0 &&
        layout.unmeasuredBlockIds.length === 0,
      stable: layout.stable,
      unmeasuredBlockIds: layout.unmeasuredBlockIds,
    }),
    [
      layout.chromeOverflowRoles,
      layout.duplicateBlockIds,
      layout.overflowBlockIds,
      layout.stable,
      layout.unmeasuredBlockIds,
      measurements.measured,
      totalPages,
    ],
  );
  const rootStyle = useMemo(
    () =>
      ({
        '--paginated-body-gap': `${geometry.bodyGapPx}px`,
        '--paginated-chrome-gap': `${geometry.chromeGapMm}mm`,
        '--paginated-padding-block': `${geometry.paddingBlockMm}mm`,
        '--paginated-padding-inline': `${geometry.paddingInlineMm}mm`,
        '--paginated-page-height': `${geometry.heightMm}mm`,
        '--paginated-page-width': `${geometry.widthMm}mm`,
      }) as CSSProperties,
    [geometry],
  );

  useEffect(() => {
    onPaginationStateChange?.(runtimeState);
  }, [onPaginationStateChange, runtimeState]);

  return (
    <Styles.Root
      className={className}
      data-print-pagination-root
      style={rootStyle}
    >
      <MeasurementLayer
        blocks={blocks}
        onMeasure={onMeasure}
        renderFooter={renderFooter}
        renderHeader={renderHeader}
        totalPages={totalPages}
      />

      {showDebug ? (
        <Styles.DebugPanel>
          <Styles.DebugTitle>Motor propio de paginacion</Styles.DebugTitle>
          <Styles.DebugText>
            Paginas: {totalPages} | Capacidad minima:{' '}
            {Math.round(layout.bodyCapacityPx)}px | Header:{' '}
            {measurements.headerHeight}px | Footer:{' '}
            {measurements.footerHeight}px
          </Styles.DebugText>
          <Styles.DebugText>
            Capacidades:{' '}
            {layout.pageCapacitiesPx
              .map((capacity, index) => `${index + 1}:${Math.round(capacity)}px`)
              .join(' | ')}
          </Styles.DebugText>
          {!measurements.measured ? (
            <Styles.DebugText $danger={!canMeasureDom}>
              {canMeasureDom
                ? 'Midiendo DOM antes de cerrar la paginacion.'
                : 'Este navegador no expone ResizeObserver/requestAnimationFrame; no se puede garantizar impresion sin cortes.'}
            </Styles.DebugText>
          ) : null}
          {!layout.stable ? (
            <Styles.DebugText $danger>
              Layout no estable; usando capacidad conservadora minima.
            </Styles.DebugText>
          ) : null}
          {layout.duplicateBlockIds.length ? (
            <Styles.DebugText $danger>
              IDs duplicados: {layout.duplicateBlockIds.join(', ')}
            </Styles.DebugText>
          ) : null}
          {layout.unmeasuredBlockIds.length ? (
            <Styles.DebugText $danger>
              Bloques sin medicion: {layout.unmeasuredBlockIds.join(', ')}
            </Styles.DebugText>
          ) : null}
          {layout.chromeOverflowRoles.length ? (
            <Styles.DebugText $danger>
              Header/footer exceden la pagina en roles:{' '}
              {layout.chromeOverflowRoles.join(', ')}
            </Styles.DebugText>
          ) : null}
          {layout.overflowBlockIds.length ? (
            <Styles.DebugText $danger>
              Bloques con overflow: {layout.overflowBlockIds.join(', ')}
            </Styles.DebugText>
          ) : (
            <Styles.DebugText>No hay bloques cortados.</Styles.DebugText>
          )}
        </Styles.DebugPanel>
      ) : null}

      <Styles.Pages
        aria-label={ariaLabel}
        data-print-pagination-pages
        data-print-pagination-ready={runtimeState.readyToPrint ? 'true' : 'false'}
      >
        {layout.pages.map((pageBlocks, pageIndex) => {
          const pageNumber = pageIndex + 1;
          const pageRole = resolvePageRole(pageNumber, totalPages);
          const pageContext: PaginatedDocumentContext = {
            isFirstPage: pageNumber === 1,
            isLastPage: pageNumber === totalPages,
            pageBlockCount: pageBlocks.length,
            pageNumber,
            totalPages,
          };

          return (
            <Styles.Page
              key={`page-${pageNumber}`}
              data-print-pagination-page
              data-print-pagination-page-number={pageNumber}
              data-print-pagination-page-role={pageRole}
            >
              <Styles.PageHeader data-print-pagination-page-header>
                {renderHeader(pageContext)}
              </Styles.PageHeader>
              <Styles.PageBody data-print-pagination-page-body>
                {pageBlocks.map((block) => (
                  <Styles.PageBlock key={block.id}>
                    {block.content}
                  </Styles.PageBlock>
                ))}
              </Styles.PageBody>
              <Styles.PageFooter data-print-pagination-page-footer>
                {renderFooter(pageContext)}
              </Styles.PageFooter>
            </Styles.Page>
          );
        })}
      </Styles.Pages>
    </Styles.Root>
  );
};

export type { PaginatedBlock, PaginatedDocumentContext } from './types';
