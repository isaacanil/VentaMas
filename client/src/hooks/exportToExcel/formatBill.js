import { useFormatPrice } from "../useFormatPrice";
import useFormatTimestamp from "../useFormatTimeStamp";

const formatBillResumen = (data) => {
  const { date, id, NCF, client, totalShoppingItems, totalTaxes, paymentMethod, payment, change, delivery, totalPurchase } = data;
  const { name = '', tel = '', address = '', personalID = '' } = client || {};
  const shoppingItems = totalShoppingItems.value;
  const taxes = totalTaxes.value;
  const total = totalPurchase.value;
  const method = () => {
    if (paymentMethod) {
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
    ['Total ITBIS']: useFormatPrice(taxes),
    ['Método de Pago']: method(),
    ['Pagado']: paymentValue(),
    ['Delivery']: useFormatPrice(deliveryValue, 'rd'),
    ['Cambio']: useFormatPrice(changeValue),
    ['Total']: useFormatPrice(total)
  }
}
const formatBillDetailed = (facturas) => {
  const resultados = [];

  for (let i = 0; i < facturas.length; i++) {
    const factura = facturas[i].data;
    const products = factura.products;
    const clientName = factura.client.name;
    const NCF = factura.NCF;
    const date = factura.date;
    const id = factura.id;
    const total = factura.totalPurchase.value;

    for (let j = 0; j < products.length; j++) {
      const product = products[j];
      const productId = product.id;
      const productName = product.productName;
      const amountToBuy = product.amountToBuy.total;
      const category = product.category;
      const price = product.price.unit;
      const type = product.type;

      const resultado = {
        ["Fecha"]: useFormatTimestamp(date),
        ["Id Factura"]: id,
        ["Comprobante"]: NCF,
        ["Cliente"]: clientName,
        ["Nombre del Producto"]: productId,
        ["Producto"]: productName,
        ["Categoría"]: category,
        ["Tipo"]: type,
        ["Precio"]: useFormatPrice(price),
        ["Cantidad Facturada"]: amountToBuy,
        ["Total"]: useFormatPrice(total)
      };

      resultados.push(resultado);
    }
  }

  return resultados;
}

export const formatBill = ({ type, data }) => {
  switch (type) {
    case "Resumen":
      return formatBillResumen(data)

    case "Detailed":
      return formatBillDetailed(data)

    default:
      break;
  }
}
