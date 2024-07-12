const InvoiceTotals = ({ subtotal, tax, total, paid, change }) => (
    <div>
      <p>SUBTOTAL: {subtotal.toFixed(2)}</p>
      <p>ITBIS: {tax.toFixed(2)}</p>
      <p>TOTAL A PAGAR: {total.toFixed(2)}</p>
      <p>EFECTIVO: {paid.toFixed(2)}</p>
      <p>CAMBIO: {change.toFixed(2)}</p>
    </div>
  );

export default InvoiceTotals;
  