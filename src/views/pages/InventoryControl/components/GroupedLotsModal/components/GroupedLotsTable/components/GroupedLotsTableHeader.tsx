export function GroupedLotsTableHeader() {
  return (
    <thead>
      <tr>
        <th>Lote</th>
        <th>Vencimiento</th>
        <th>Ubicaciones</th>
        <th style={{ textAlign: 'right' }}>Stock</th>
        <th style={{ textAlign: 'right' }}>Conteo real</th>
        <th style={{ textAlign: 'right' }}>Diferencia</th>
        <th>Editado por</th>
        <th style={{ textAlign: 'center' }}>Acciones</th>
      </tr>
    </thead>
  );
}