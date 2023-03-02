import useFormatTimestamp from "../useFormatTimeStamp";

const formatBill = (data) => {
    const { date, id, NCF, client, totalShoppingItems, totalTaxes, paymentMethod, payment, change, delivery, totalPurchase } = data;
    const { name = '', tel = '', address = '', personalID = '' } = client || {};
    const shoppingItems = totalShoppingItems.value;
    const taxes = totalTaxes.value;
    const total = totalPurchase.value;
    
    const method = () => {
        if(paymentMethod){
            return paymentMethod.find((item) => item.status === true).method;
        }
        data.cardPaymentMethod && 'Tarjeta'
        data.cashPaymentMethod && 'Efectivo'
        data.transferPaymentMethod && 'Transferencia'
    }
    const paymentValue = () => {
        payment && payment.value 
        data.cardPaymentMethod && data.cardPaymentMethod.value
        data.cashPaymentMethod && data.cashPaymentMethod.value
        data.transferPaymentMethod && data.transferPaymentMethod.value
    };
    const deliveryValue = delivery.value;
    const changeValue = change.value;
    return {
      ['Fecha']: useFormatTimestamp(date),
      ['ID']: id,
      ['Comprobante']: NCF,
      ['Nombre Cliente']: name || null ? name || 'Cliente Genérico' : 'Cliente Genérico',
      ['Teléfono Cliente']: tel ? tel : 'N/A',
      ['Dirección Cliente']: address ? address : 'N/A',
      ['RNC/Cédula']: personalID ? personalID : 'N/A',
      ['Cantidad de Productos']: shoppingItems,
      ['Total ITBIS']: taxes,
      ['Método de Pago']: method(),
      ['Pagado']: paymentValue(),
      ['Delivery']: deliveryValue,
      ['Cambio']: changeValue,
      ['Total']: total
    }
  }
  
    export default formatBill;