import React from 'react';

/**
 * Componente para el recibo de pago
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.receipt - Datos del recibo de pago
 * @param {Function} props.formatDate - Función para formatear fechas
 * @param {Function} props.formatCurrency - Función para formatear montos
 */
const PaymentReceipt = React.forwardRef(
  ({ receipt, formatDate, formatCurrency }, ref) => {
    if (!receipt) return null;

    return (
      <div ref={ref} style={{ padding: '20px' }}>
        <h2 style={{ textAlign: 'center' }}>Recibo de Pago de Aseguradora</h2>
        <p>
          <strong>Fecha:</strong>{' '}
          {formatDate(
            receipt.createdAt?.toMillis
              ? receipt.createdAt.toMillis()
              : receipt.date,
          )}
        </p>
        <p>
          <strong>ID de Pago:</strong> {receipt.paymentId || receipt.receiptId}
        </p>
        <p>
          <strong>Aseguradora:</strong> {receipt.insurance}
        </p>
        <h3>Cuentas pagadas:</h3>
        <ul>
          {Array.isArray(receipt.accounts) &&
            receipt.accounts.map((account, index) => (
              <li key={index}>
                <div>Cuenta: {account.arNumber || account.id}</div>
                {account.arId && <div>ID: {account.arId}</div>}
                {account.invoiceNumber && (
                  <div>Factura: {account.invoiceNumber}</div>
                )}
                <div>
                  Total Pagado:{' '}
                  {formatCurrency(account.totalPaid || account.balance || 0)}
                </div>
                <div>
                  Balance Restante: {formatCurrency(account.arBalance || 0)}
                </div>
                {Array.isArray(account.paidInstallments) &&
                  account.paidInstallments.length > 0 && (
                    <div>
                      <h4>Cuotas pagadas:</h4>
                      <ul>
                        {account.paidInstallments.map((installment, idx) => (
                          <li key={idx}>
                            Cuota #{installment.number} - Monto:{' '}
                            {formatCurrency(installment.amount || 0)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </li>
            ))}
        </ul>
        <p>
          <strong>Total:</strong>{' '}
          {formatCurrency(receipt.totalAmount || receipt.total || 0)}
        </p>
        <h3>Métodos de pago:</h3>
        <ul>
          {Array.isArray(receipt.paymentMethod || receipt.paymentMethods) &&
            (receipt.paymentMethod || receipt.paymentMethods).map(
              (method, index) => (
                <li key={index}>
                  {method.method === 'cash'
                    ? 'Efectivo'
                    : method.method === 'card'
                      ? 'Tarjeta'
                      : 'Transferencia'}
                  :{formatCurrency(method.value || 0)}
                  {method.reference ? ` - Ref: ${method.reference}` : ''}
                </li>
              ),
            )}
        </ul>
        {typeof receipt.change === 'number' && receipt.change > 0 && (
          <p>
            <strong>Cambio/Devuelta:</strong> {formatCurrency(receipt.change)}
          </p>
        )}
      </div>
    );
  },
);

PaymentReceipt.displayName = 'PaymentReceipt';

export default PaymentReceipt;
