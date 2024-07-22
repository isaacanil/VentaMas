// Esquema para Payments for Accounts Receivable (Payments_AR) usando camelCase
export const defaultPaymentsAR = {
    id: "", // Identificador único del pago
    paymentMethods: [
      {
        method: "cash",
        value: 0.00,
        status: true
      },
      {
        method: "card",
        value: 0.00,
        reference: "",
        status: false
      },
      {
        method: "transfer",
        value: 0.00,
        reference: "",
        status: false
      }
    ],
    totalPaid: 0.00, // Monto total pagado
    createdAt: new Date(), // Fecha y hora de creación
    updatedAt: new Date(), // Fecha y hora de la última actualización
    comments: "", // Comentarios adicionales
    createdUserId: "", // Usuario que registró el pago
    updatedUserId: "", // Usuario que actualizó el pago
    isActive: true // Estado activo del pago
  };
  