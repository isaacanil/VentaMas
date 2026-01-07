import { DateTime } from 'luxon';

export const defaultAR = {
  id: '', // ID de la cuenta por cobrar
  invoiceId: '', // ID de la factura
  clientId: '', // ID del cliente
  paymentFrequency: 'monthly', // Frecuencia del pago
  totalInstallments: 1, // Número total de cuotas (dues)
  installmentAmount: 0.0, // Monto por cuota (amountByDue)
  paymentDate: null, // Fecha de pago en milisegundos
  lastPaymentDate: null, // Fecha del último pago en milisegundos
  lastPayment: 0.0, // Último pago
  totalReceivable: 0.0, // Total de cuentas por cobrar (totalCXC)
  currentBalance: 0.0, // Saldo actual (BalanceToday)
  arBalance: 0.0, // Balance de la cuenta por cobrar (balanceCXC)
  isClosed: false, // Indica si la cuenta está cerrada
  isActive: true, // Estado activo de la cuenta
  createdAt: DateTime.now().toMillis(), // Fecha de creación en milisegundos
  updatedAt: DateTime.now().toMillis(), // Fecha de actualización en milisegundos
  createdBy: '', // Creado por
  updatedBy: '', // Actualizado por
  comments: '', // Comentarios adicionales
};
