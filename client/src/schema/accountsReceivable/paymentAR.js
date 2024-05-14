// Esquema para Payments for Accounts Receivable (Payments_AR) usando camelCase
const defaultPaymentsAR = {
    paymentId: "", // Identificador único del pago
    installmentId: "", // Referencia a la cuota asociada
    totalCash: 0.00, // Total pagado en efectivo
    totalTransf: 0.00, // Total por transferencia bancaria
    refTransf: "", // Referencia de la transferencia
    totalCreditCard: 0.00, // Total por tarjeta de crédito
    refCreditCard: "", // Referencia de la tarjeta de crédito
    totalPaid: 0.00, // Monto total pagado
    createdAt: new Date(), // Fecha y hora de creación
    updatedAt: new Date(), // Fecha y hora de la última actualización
    comments: "", // Comentarios adicionales
    createdUserId: "", // Usuario que registró el pago
    updatedUserId: "", // Usuario que actualizó el pago
    activeStatus: true // Estado activo del pago
  };
  