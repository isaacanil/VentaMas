import type { FilterBarItem } from '@/components/common/FilterBar/FilterBar';

import type {
  AccountsPayableAgingBucket,
  AccountsPayableGroupBy,
  AccountsPayableTraceabilityFilter,
} from '../utils/accountsPayableDashboard';

interface BuildAccountsPayableToolbarItemsParams {
  agingBucketFilter: AccountsPayableAgingBucket | 'all';
  groupBy: AccountsPayableGroupBy;
  onAgingBucketChange: (value: AccountsPayableAgingBucket | 'all') => void;
  onGroupByChange: (value: AccountsPayableGroupBy) => void;
  onTraceabilityChange: (value: AccountsPayableTraceabilityFilter) => void;
  traceabilityFilter: AccountsPayableTraceabilityFilter;
}

export const buildAccountsPayableToolbarItems = ({
  agingBucketFilter,
  groupBy,
  onAgingBucketChange,
  onGroupByChange,
  onTraceabilityChange,
  traceabilityFilter,
}: BuildAccountsPayableToolbarItemsParams): FilterBarItem[] => [
  {
    key: 'aging-bucket',
    type: 'select',
    section: 'main',
    label: 'Aging',
    value: agingBucketFilter,
    onChange: (value) =>
      onAgingBucketChange((value as AccountsPayableAgingBucket | 'all') ?? 'all'),
    options: [
      { label: 'Todos', value: 'all' },
      { label: 'Al día', value: 'current' },
      { label: 'Vencido 1-30', value: 'due_1_30' },
      { label: 'Vencido 31-60', value: 'due_31_60' },
      { label: 'Vencido 61+', value: 'due_61_plus' },
      { label: 'Sin fecha', value: 'no_due_date' },
    ],
    allowClear: false,
    minWidth: 180,
  },
  {
    key: 'traceability-filter',
    type: 'select',
    section: 'main',
    label: 'Trazabilidad',
    value: traceabilityFilter,
    onChange: (value) =>
      onTraceabilityChange(
        (value as AccountsPayableTraceabilityFilter | null) ?? 'all',
      ),
    options: [
      { label: 'Todos', value: 'all' },
      { label: 'Con pagos', value: 'with_payments' },
      { label: 'Con evidencia', value: 'with_evidence' },
      { label: 'Sin evidencia', value: 'missing_evidence' },
      { label: 'Solo vencidas', value: 'overdue' },
    ],
    allowClear: false,
    minWidth: 180,
  },
  {
    key: 'group-by',
    type: 'select',
    section: 'main',
    label: 'Agrupar',
    value: groupBy,
    onChange: (value) =>
      onGroupByChange((value as AccountsPayableGroupBy | null) ?? 'provider'),
    options: [
      { label: 'Proveedor', value: 'provider' },
      { label: 'Aging', value: 'aging' },
      { label: 'Sin agrupación', value: 'none' },
    ],
    allowClear: false,
    minWidth: 180,
  },
];
