export const validations = [
    {
        condition: () => !purchase?.provider || purchase?.provider?.id == "",
        message: 'Agregue el proveedor'
    },
    {
        condition: () => purchase.replenishments.length <= 0,
        message: 'Agregue un producto'
    },
    {
        condition: () => !purchase.dates.deliveryDate,
        message: 'Agregue la Fecha de entrega'
    },
    {
        condition: () => !purchase.condition,
        message: 'Agregue la Condición'
    }
];

