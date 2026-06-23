import type { PaginationRuntimeState } from '@/components/DocumentPagination';

export type PaginatedPrintFallbackCode =
  | 'paginated-print-error'
  | 'paginated-print-freeze-blocked'
  | 'paginated-print-layout-blocked'
  | 'paginated-print-source-missing'
  | 'paginated-print-timeout';

const joinValues = (values: string[]) => values.filter(Boolean).join(', ');

const appendIfAny = ({
  label,
  parts,
  values,
}: {
  label: string;
  parts: string[];
  values: string[];
}) => {
  if (values.length === 0) return;
  parts.push(`${label}=${joinValues(values)}`);
};

export const formatPaginatedPrintRuntimeState = (
  state: PaginationRuntimeState,
) => {
  const parts: string[] = [
    `measured=${state.measured ? 'yes' : 'no'}`,
    `stable=${state.stable ? 'yes' : 'no'}`,
    `ready=${state.readyToPrint ? 'yes' : 'no'}`,
    `pages=${state.pageCount}`,
  ];

  appendIfAny({
    label: 'overflowBlocks',
    parts,
    values: state.overflowBlockIds,
  });
  appendIfAny({
    label: 'chromeOverflowRoles',
    parts,
    values: state.chromeOverflowRoles,
  });
  appendIfAny({
    label: 'duplicateBlocks',
    parts,
    values: state.duplicateBlockIds,
  });
  appendIfAny({
    label: 'unmeasuredBlocks',
    parts,
    values: state.unmeasuredBlockIds,
  });

  return parts.join('; ');
};

export const formatPaginatedPrintFallbackReason = ({
  code,
  state,
}: {
  code: PaginatedPrintFallbackCode;
  state?: PaginationRuntimeState | null;
}) => {
  if (!state) {
    return code;
  }

  return `${code}: ${formatPaginatedPrintRuntimeState(state)}`;
};
