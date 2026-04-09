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
    <div
      style={{
        margin: '8px 0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            background: '#eafaf1',
            color: '#0f7a3e',
            padding: '4px 8px',
            borderRadius: 6,
          }}
        >
          Iguales: <strong>{equalCount}</strong>
        </span>
        <span
          style={{
            background: '#fdecea',
            color: '#b71c1c',
            padding: '4px 8px',
            borderRadius: 6,
          }}
        >
          No coinciden: <strong>{mismatchCount}</strong>
        </span>
        <span style={{ marginLeft: 8, color: '#555' }}>Total: {total}</span>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <button
          onClick={() => onSetViewFilter('equal')}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid #ddd',
            background: viewFilter === 'equal' ? '#f0fdf4' : 'white',
          }}
          disabled={busy}
        >
          Solo iguales
        </button>
        <button
          onClick={() => onSetViewFilter('mismatch')}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid #ddd',
            background: viewFilter === 'mismatch' ? '#fef2f2' : 'white',
          }}
          disabled={busy}
        >
          Solo no coinciden
        </button>
        <button
          onClick={() => onSetViewFilter('all')}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid #ddd',
            background: viewFilter === 'all' ? '#f8fafc' : 'white',
          }}
          disabled={busy}
        >
          Todos
        </button>
        <button
          onClick={() => void onFixAllMismatch()}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid #ddd',
            background: '#111827',
            color: 'white',
          }}
          title="Igualar price=listPrice para todos los que no coinciden"
          disabled={busy || mismatchCount === 0}
        >
          Igualar todos (no coinciden)
        </button>
        <button
          onClick={() => void onBackfillListPrice()}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid #ddd',
            background: '#0ea5e9',
            color: 'white',
          }}
          title="Cuando listPrice no existe se copia price"
          disabled={busy || missingListPriceCount === 0}
        >
          Copiar price en listPrice (faltantes)
        </button>
        <button
          onClick={() => void onFixAllBusiness()}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid #ddd',
            background: '#0b5cff',
            color: 'white',
          }}
          title="Igualar price=listPrice en todo el negocio (solo no coinciden)"
          disabled={busy}
        >
          Igualar todo el negocio
        </button>
      </div>
    </div>
  );
};
