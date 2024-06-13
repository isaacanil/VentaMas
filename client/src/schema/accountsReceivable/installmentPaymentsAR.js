export const defaultInstallmentPaymentsAR = {
    installmentPaymentId: "", // Identificador único del pago a plazos
    installmentId: "", // Referencia a la cuota asociada
    paymentId: "", // Referencia al pago asociado
    createdAt: new Date(), // Fecha y hora de creación
    updatedAt: new Date(), // Fecha y hora de la última actualización
    paymentAmount: 0.00, // Monto asignado para el pago a plazos
    createdBy: "", // Usuario que creó el registro del pago
    updatedBy: "", // Usuario que actualizó el registro del pago
    isActive: true // Estado activo del pago a plazos
};