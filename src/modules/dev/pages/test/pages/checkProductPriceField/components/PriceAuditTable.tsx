import type { CSSProperties } from 'react';

interface PriceRow {
  id: string;
  name: string;
  listPrice: number;
  price: number;
  eqLPPrice: boolean;
  diffLP: number;
}

interface PriceAuditTableProps {
  rows: PriceRow[];
  onFixOne: (row: PriceRow) => void | Promise<void>;
}

const th: CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: '1px solid #eee',
  position: 'sticky',
  top: 0,
  background: 'white',
  zIndex: 1,
};

const td: CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid #f0f0f0',
};

export const PriceAuditTable = ({
  rows,
  onFixOne,
}: PriceAuditTableProps) => {
  return (
    <div style={{ overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Nombre</th>
            <th style={th}>List Price</th>
            <th style={th}>Price (actual)</th>
            <th style={th}>Diff (LP-Price)</th>
            <th style={th}>LP == Price</th>
            <th style={th}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              style={{ background: row.eqLPPrice ? '#f7fff7' : '#fff4f2' }}
            >
              <td style={td}>{row.id}</td>
              <td style={td}>{row.name}</td>
              <td style={{ ...td, textAlign: 'right' }}>{row.listPrice}</td>
              <td style={{ ...td, textAlign: 'right' }}>{row.price}</td>
              <td style={{ ...td, textAlign: 'right' }}>{row.diffLP}</td>
              <td style={td}>{row.eqLPPrice ? 'Sí' : 'No'}</td>
              <td style={td}>
                {!row.eqLPPrice && (
                  <button
                    onClick={() => void onFixOne(row)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                    }}
                    title="Igualar price=listPrice"
                  >
                    Igualar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
