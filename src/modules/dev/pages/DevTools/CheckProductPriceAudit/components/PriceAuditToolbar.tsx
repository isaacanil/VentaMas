import {
  ActionButton,
  Actions,
  CountBadge,
  CountGroup,
  FilterButton,
  ToolbarRoot,
  TotalCount,
} from './PriceAuditToolbar.styles';

interface PriceAuditToolbarProps {
  busy: boolean;
  equalCount: number;
  mismatchCount: number;
  missingListPriceCount: number;
  total: number;
  viewFilter: 'equal' | 'mismatch' | 'all';
  onSetViewFilter: (value: 'equal' | 'mismatch' | 'all') => void;
  onFixAllMismatch: () => void | Promise<void>;
  onBackfillListPrice: () => void | Promise<void>;
  onFixAllBusiness: () => void | Promise<void>;
}

export const PriceAuditToolbar = ({
  busy,
  equalCount,
  mismatchCount,
  missingListPriceCount,
  total,
  viewFilter,
  onSetViewFilter,
  onFixAllMismatch,
  onBackfillListPrice,
  onFixAllBusiness,
}: PriceAuditToolbarProps) => {
  return (
    <ToolbarRoot>
      <CountGroup>
        <CountBadge $tone="success">
          Iguales: <strong>{equalCount}</strong>
        </CountBadge>
        <CountBadge $tone="danger">
          No coinciden: <strong>{mismatchCount}</strong>
        </CountBadge>
        <TotalCount>Total: {total}</TotalCount>
      </CountGroup>
      <Actions>
        <FilterButton
          $active={viewFilter === 'equal'}
          $tone="equal"
          onClick={() => onSetViewFilter('equal')}
          disabled={busy}
        >
          Solo iguales
        </FilterButton>
        <FilterButton
          $active={viewFilter === 'mismatch'}
          $tone="mismatch"
          onClick={() => onSetViewFilter('mismatch')}
          disabled={busy}
        >
          Solo no coinciden
        </FilterButton>
        <FilterButton
          $active={viewFilter === 'all'}
          $tone="all"
          onClick={() => onSetViewFilter('all')}
          disabled={busy}
        >
          Todos
        </FilterButton>
        <ActionButton
          $tone="dark"
          onClick={() => void onFixAllMismatch()}
          title="Igualar price=listPrice para todos los que no coinciden"
          disabled={busy || mismatchCount === 0}
        >
          Igualar todos (no coinciden)
        </ActionButton>
        <ActionButton
          $tone="sky"
          onClick={() => void onBackfillListPrice()}
          title="Cuando listPrice no existe se copia price"
          disabled={busy || missingListPriceCount === 0}
        >
          Copiar price en listPrice (faltantes)
        </ActionButton>
        <ActionButton
          $tone="blue"
          onClick={() => void onFixAllBusiness()}
          title="Igualar price=listPrice en todo el negocio (solo no coinciden)"
          disabled={busy}
        >
          Igualar todo el negocio
        </ActionButton>
      </Actions>
    </ToolbarRoot>
  );
};
