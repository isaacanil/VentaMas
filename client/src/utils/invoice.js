export function isInvoicePaidInFull(invoice) {
    // Extract the paid amount and the total purchase amount from the invoice
    const paidAmount = invoice.payment.value;
    const totalPurchase = invoice.totalPurchase.value;

    // Compare if the paid amount is equal to the total purchase amount
    return paidAmount === totalPurchase;
}

export function getActivePaymentMethods(invoice) {
    // Initialize an array to hold the names of active payment methods
    const activeMethods = [];

    // Loop through each payment method in the invoice
    invoice.paymentMethod.forEach(method => {
        // If the payment method is active, add its name to the array
        if (method.status) {
            activeMethods.push(method.method);
        }
    });

    // Join the names of active payment methods into a single string
    return activeMethods.join(', ') || '';
}

export function translatePaymentMethods(methodsString) {
    // Mapa de traducciones de los métodos de pago del inglés al español
    const translations = {
        "cash": "efectivo",
        "card": "tarjeta",
        "transfer": "transferencia"
    };

    // Dividir la cadena de métodos de pago en un arreglo
    const methodsArray = methodsString.split(', ');

    // Traducir cada método de pago utilizando el mapa de traducciones
    const translatedMethodsArray = methodsArray.map(method => translations[method] || method);

    // Unir los métodos traducidos en una sola cadena y retornar
    return translatedMethodsArray.join(', ');
}


export function abbreviatePaymentMethods(methodsArray) {
    // Mapa de abreviaturas específicas para cada método de pago en español
    const abbreviations = {
        "cash": "Efectivo",  // O "Efec"
        "card": "TC",   // O "Tjta"
        "transfer": "Transf" // O "Trans"
    };

    // Generar abreviaturas específicas para cada método de pago
    const abbreviatedMethodsArray = methodsArray.map(method => abbreviations[method.toLowerCase()] || method);

    // Unir los métodos abreviados en una sola cadena y retornar
    return abbreviatedMethodsArray.join(', ');
}

export function calculateInvoicesTotal(invoices) {
    console.log(invoices)
    return invoices.reduce((total, invoice) => total + invoice.data.totalPurchase.value, 0);
}
export function countInvoices(invoices) {
    return invoices.length;
}



