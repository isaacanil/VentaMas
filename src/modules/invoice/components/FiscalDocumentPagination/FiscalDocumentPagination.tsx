import { useMemo } from 'react';

import {
  PaginatedDocument,
  type PageGeometry,
  type PaginationRuntimeState,
} from '@/components/DocumentPagination';
import {
  buildInvoicePrintDocumentModel,
  type InvoicePrintDocumentKind,
} from '@/modules/invoice/printPagination';
import type {
  InvoiceBusinessInfo,
  InvoiceData,
  InvoiceSignatureAssets,
} from '@/types/invoice';

import { buildFiscalDocumentPagination } from './adapters/buildFiscalDocumentPagination';
import * as Styles from './FiscalDocumentPagination.styles';

type FiscalDocumentPaginationProps = {
  business?: InvoiceBusinessInfo | null;
  className?: string;
  data?: InvoiceData | null;
  geometry?: PageGeometry;
  kind?: InvoicePrintDocumentKind;
  onPaginationStateChange?: (state: PaginationRuntimeState) => void;
  previewSignatureAssets?: InvoiceSignatureAssets | null;
  showDebug?: boolean;
};

const FISCAL_DOCUMENT_GEOMETRY: PageGeometry = {
  bodyGapPx: 8,
  chromeGapMm: 1,
  heightMm: 297,
  paddingBlockMm: 12,
  paddingInlineMm: 13,
  widthMm: 210,
};

export const FiscalDocumentPagination = ({
  business,
  className,
  data,
  geometry,
  kind,
  onPaginationStateChange,
  previewSignatureAssets,
  showDebug = false,
}: FiscalDocumentPaginationProps) => {
  const model = useMemo(
    () =>
      buildInvoicePrintDocumentModel({
        business,
        data,
        kind,
        previewSignatureAssets,
      }),
    [business, data, kind, previewSignatureAssets],
  );
  const pagination = useMemo(
    () => buildFiscalDocumentPagination(model),
    [model],
  );

  return (
    <Styles.Root
      className={className}
      data-print-document-id={model.id ?? undefined}
      data-print-document-kind={model.kind}
    >
      <PaginatedDocument
        ariaLabel={pagination.ariaLabel}
        blocks={pagination.blocks}
        geometry={geometry ?? FISCAL_DOCUMENT_GEOMETRY}
        onPaginationStateChange={onPaginationStateChange}
        renderFooter={pagination.renderFooter}
        renderHeader={pagination.renderHeader}
        showDebug={showDebug}
      />
    </Styles.Root>
  );
};
