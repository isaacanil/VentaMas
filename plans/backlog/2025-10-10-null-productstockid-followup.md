# Facturas sin `productStockId` asignado

- Fecha propuesta: 2025-10-10
- Estado: Seguimiento operativo pendiente

- Asegurarse de monitorear en logs del worker `processInvoiceOutbox` que los productos con `productStockId: null` se omiten como antes (no se generan backorders/claves de inventario inesperadas).
- Validar con operaciones reales/preventas que los reportes de inventario se mantienen alineados cuando la venta no estaba asociada a un stock específico.
- Considerar si en el backend necesitamos un movimiento alterno para ventas sin stock (actualmente se ignoran).

Actualizar o cerrar esta nota cuando terminemos la verificación en ambientes reales.
