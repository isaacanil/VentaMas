const defaultInstallmentAR = {
    installmentId: "", // Identificador único de la cuota
    arId: "", // Referencia al AR asociado
    createdAt: new Date(), // Fecha y hora de creación
    updatedAt: new Date(), // Fecha y hora de la última actualización
    installmentDate: new Date(), // Fecha de vencimiento de la cuota
    installmentAmount: 0.00, // Monto asignado para la cuota
    installmentBalance: 0.00,
    createdBy: "", // Usuario que creó la cuota
    updatedBy: "", // Usuario que actualizó la cuota
    isActive: true // Estado activo de la cuota
};