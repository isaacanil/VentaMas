import { DateTime } from 'luxon'

export const defaultAR = {
  id: "",  // ID de la cuenta por cobrar
  invoiceId: "", // ID de la factura
  clientId: "", // ID del cliente
  createdAt: DateTime.now().toMillis(), // Fecha de creación en milisegundos
  updatedAt: DateTime.now().toMillis(), // Fecha de actualización en milisegundos
  paymentFrequency: "monthly", // Frecuencia del pago
  totalInstallments: 1, // Número total de cuotas (dues)
  installmentAmount: 0.00,  // Monto por cuota (amountByDue)
  paymentDate: DateTime.now().toMillis(), // Fecha de pago en milisegundos
  lastPaymentDate: null, // Fecha del último pago en milisegundos
  totalReceivable: 0.00, // Total de cuentas por cobrar (totalCXC)
  currentBalance: 0.00, // Saldo actual (BalanceToday)
  arBalance: 0.00, // Balance de la cuenta por cobrar (balanceCXC)
  lastPayment: 0.00, // Último pago
  comments: "", // Comentarios adicionales
  createdBy: "", // Creado por
  updatedBy: "", // Actualizado por
  isClosed: false, // Indica si la cuenta está cerrada
  isActive: true // Estado activo de la cuenta
};

