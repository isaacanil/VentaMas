import { DateTime } from 'luxon';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectBusinessData } from '../../../../../../features/auth/businessSlice';
import { SelectSettingCart } from '../../../../../../features/cart/cartSlice';
import { separator } from '../../../../../../hooks/separator';
import { useFormatPhoneNumber } from '../../../../../../hooks/useFormatPhoneNumber';
import DateUtils from '../../../../../../utils/date/dateUtils';
import { resolveDocumentIdentity } from '../../../../../../utils/invoice/documentIdentity.js';
import {
  getTotalPrice,
  getTax,
  resetAmountToBuyForProduct,
  getProductsPrice,
  getProductsTax,
  getTotalDiscount,
  getProductIndividualDiscount,
  getProductsIndividualDiscounts
} from '../../../../../../utils/pricing';
import { convertTimeToSpanish } from '../../../../../../views/component/modals/ProductForm/components/sections/WarrantyInfo';



// Máximo de caracteres por línea
const CENTER_WIDTH = 40;

/* =========================================================
   Funciones auxiliares
   ========================================================= */

// Ajustamos wrapText para que corte en maxWidth (40) sin guión
export const wrapText = (text, maxWidth = CENTER_WIDTH) => {
  // Si el texto no sobrepasa el ancho, lo retornamos tal cual
  if (text.length <= maxWidth) return text;

  // Marcamos el punto de quiebre igual al maxWidth
  const breakPoint = maxWidth;

  // Primera línea: desde 0 hasta maxWidth (no le agregamos guión)
  const firstLine = text.slice(0, breakPoint);

  // Resto del texto que queda pendiente de envolver
  const remaining = text.slice(breakPoint);

  // Unimos la primera línea con el resto (de forma recursiva)
  return firstLine + '\n' + wrapText(remaining, maxWidth);
};

// Centrar texto tras envolver
// eslint-disable-next-line react-refresh/only-export-components
export const wrapAndCenter = (text, maxWidth = CENTER_WIDTH) => {
  const wrapped = wrapText(text, maxWidth);
  return wrapped
    .split('\n')
    .map(line => centerText(line, maxWidth))
    .join('\n');
};

// Centrar una sola línea a un ancho dado
// eslint-disable-next-line react-refresh/only-export-components
export const centerText = (text, maxWidth = CENTER_WIDTH) => {
  const spaces = Math.floor((maxWidth - text.length) / 2);
  return ' '.repeat(spaces) + text;
};

// Línea separadora
// eslint-disable-next-line react-refresh/only-export-components
export const separatorLine = (maxWidth = CENTER_WIDTH) => '-'.repeat(maxWidth);

// Formatear columnas (left, right, center)
// eslint-disable-next-line react-refresh/only-export-components
export const formatColumn = (text, width, align = 'left') => {
  let str = text.toString();

  // Si excede el ancho, lo envolvemos
  if (str.length > width) {
    return wrapText(str, width);
  }

  // Según la alineación
  if (align === 'left') {
    return str.padEnd(width, ' ');
  } else if (align === 'right') {
    return str.padStart(width, ' ');
  } else if (align === 'center') {
    const spaces = Math.floor((width - str.length) / 2);
    return ' '.repeat(spaces) + str + ' '.repeat(width - str.length - spaces);
  }
};

// Concatenar nombre del producto con medida y pie
// eslint-disable-next-line react-refresh/only-export-components
export const getFullProductName = (product) => {
  return product.name +
    (product.measurement ? ` Medida: [${product.measurement}]` : '') +
    (product.footer ? ` Pie: [${product.footer}]` : '');
};

/* =========================================================
   Secciones
   ========================================================= */

// ----------------- Business Header -----------------
// eslint-disable-next-line react-refresh/only-export-components
export const renderBusinessHeader = (business, formatPhoneNumber) => {
  // SIN salto de línea al principio: empieza de inmediato
  let header = '';
  header += wrapAndCenter(business.name || 'Nombre del Negocio') + '\n';
  header += wrapAndCenter(business.address || 'Dirección del Negocio') + '\n';
  header += wrapAndCenter(formatPhoneNumber(business.tel) || 'Teléfono') + '\n';
  if (business.rnc) {
    header += wrapAndCenter(`RNC: ${business.rnc}`) + '\n';
  }
  header += separatorLine() + '\n';

  return header;
};

// ----------------- Invoice Header -----------------
// eslint-disable-next-line react-refresh/only-export-components
export const renderInvoiceHeader = (data, fechaActual) => {
  let header = '';
  const identity = resolveDocumentIdentity(data);
  header += 'Fecha: ' + fechaActual + '\n';
  if (identity.label) {
    header += identity.label.toUpperCase() + ': ' + (identity.value || '-') + '\n';
  }
  header += centerText(identity.description || identity.title) + '\n';
  header += separatorLine() + '\n';

  // Salto de línea al final de la sección
  return header;
};

// ----------------- Client Info -----------------
// eslint-disable-next-line react-refresh/only-export-components
export const renderClientInfo = (client, formatPhoneNumber) => {
  if (!client) return ''; // nada si no hay cliente

  let clientText = '';
  const prefixClient = 'CLIENTE: ';

  // Nombre del cliente (en mayúsculas, si quieres)
  const name = client.name?.toUpperCase() || 'CLIENTE GENERICO';

  // Calculamos el ancho disponible para el nombre (restamos la longitud del prefijo al total)
  const availableWidthForName = CENTER_WIDTH - prefixClient.length;

  // Envolvemos el nombre
  const wrappedName = wrapText(name, availableWidthForName);
  const nameLines = wrappedName.split('\n');

  // Primera línea con el prefijo
  clientText += prefixClient + nameLines[0] + '\n';

  // Si hay líneas adicionales, las alineamos debajo con espacios equivalentes a "CLIENTE: "
  for (let i = 1; i < nameLines.length; i++) {
    clientText += ' '.repeat(prefixClient.length) + nameLines[i] + '\n';
  }

  // Resto de los datos del cliente
  if (client.personalID) {
    clientText += 'CEDULA/RNC: ' + client.personalID + '\n';
  }
  if (client.tel) {
    clientText += 'TEL: ' + formatPhoneNumber(client.tel) + '\n';
  }
  if (client.address) {
    const prefix = 'DIR: ';
    const availableWidthForAddress = CENTER_WIDTH - prefix.length;
    const wrappedAddress = wrapText(client.address, availableWidthForAddress);
    const addressLines = wrappedAddress.split('\n');

    // Primera línea de dirección
    clientText += prefix + addressLines[0] + '\n';
    // Las siguientes líneas con la misma indentación
    for (let i = 1; i < addressLines.length; i++) {
      clientText += ' '.repeat(prefix.length) + addressLines[i] + '\n';
    }
  }

  // Línea separadora
  clientText += separatorLine() + '\n';

  return clientText;
};

// ----------------- Products -----------------
// eslint-disable-next-line react-refresh/only-export-components
export const renderProducts = (
  products,
  taxReceipt,
  getTax,
  getTotalPrice,
  resetAmountToBuyForProduct,
  formatter,
  NCF
) => {
  let prodText = '';
  // Cabecera de columnas
  prodText += formatColumn("CANT/PRICE", 13, 'center') +
              formatColumn("ITBIS", 10, 'right') +
              formatColumn("TOTAL", 17, 'right') + '\n';
  prodText += separatorLine() + '\n';

  if (Array.isArray(products) && products.length > 0) {
    products.forEach((product) => {
      // Columna izquierda
      let leftCol = '';
      if (product?.weightDetail?.isSoldByWeight) {
        leftCol = `${product.weightDetail.weight} ${product.weightDetail.weightUnit}x${separator(
          getTotalPrice(resetAmountToBuyForProduct(product), taxReceipt?.enabled)
        )}`;
      } else {
        leftCol = `${product.amountToBuy || 0} x ${separator(
          getTotalPrice(resetAmountToBuyForProduct(product), taxReceipt?.enabled)
        )}`;
      }

      // Construimos cada columna
      const col1 = formatColumn(leftCol, 13, 'left');
      const col2 = formatColumn(separator(getTax(product, NCF)).toString(), 10, 'right');
      const col3 = formatColumn(separator(getTotalPrice(product, NCF)).toString(), 17, 'right');
      prodText += col1 + col2 + col3 + '\n';      // Nombre completo del producto (y lo partimos en líneas de máx 40)
      prodText += wrapText(getFullProductName(product), CENTER_WIDTH) + '\n';

      // Descuento individual (si aplica)
      if (product?.discount && product?.discount?.value > 0) {
        const discountAmount = getProductIndividualDiscount(product);
        const discountType = product.discount.type === 'percentage' ? `${product.discount.value}%` : 'Monto fijo';
        prodText += wrapText(`Descuento: -${formatter(discountAmount)} (${discountType})`, CENTER_WIDTH) + '\n';
      }

      // Garantía (si aplica)
      if (product?.warranty?.status) {
        const warrantyText = convertTimeToSpanish(product.warranty.quantity, product.warranty.unit) + ' de Garantía';
        prodText += wrapText(warrantyText, CENTER_WIDTH) + '\n';
      }
    });
  } else {
    // Caso sin productos
    const col1 = formatColumn('1.0 x 530.00', 13, 'left');
    const col2 = formatColumn('80.85', 10, 'right');
    const col3 = formatColumn('530.00', 17, 'right');
    prodText += col1 + col2 + col3 + '\n';
    prodText += wrapText('FUNDA DE CEMENTO DOMICEN', CENTER_WIDTH) + '\n';
  }

  prodText += separatorLine() + '\n';
  return prodText;
};

// ----------------- Payment Area -----------------
// eslint-disable-next-line react-refresh/only-export-components
export const renderPaymentArea = (
  data,
  formatter,
  getProductsPrice,
  getProductsTax,
  getTotalDiscount
) => {
  let paymentText = '';

  const renderSingleValueItem = (item) => {
    const left = formatColumn((item.label || "") + ":", 20, 'left');
    const right = formatColumn(item.value2 || "", 20, 'right');
    return left + right;
  };

  const renderDoubleValueItem = (item) => {
    const left = formatColumn((item.subtitle || "") + ":", 14, 'left');
    const mid = formatColumn(item.value1 || "", 13, 'right');
    const right = formatColumn(item.value2 || "", 13, 'right');
    return left + mid + right;
  };

  const formatNumber = (num) => separator(num);
  // Calculos para subtotal, itbis y descuentos
  const subtotal = getProductsPrice(data?.products || []);
  const generalDiscount = getTotalDiscount(subtotal, data?.discount?.value || 0);
  const individualDiscounts = getProductsIndividualDiscounts(data?.products || []);
  const hasIndividualDiscounts = individualDiscounts > 0;

  // Etiquetas de métodos de pago
  const paymentLabel = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
    creditNote: "Nota de Credito"
  };

  // Items a mostrar en la sección de pago
  const items = [
    {
      label: 'ENVÍO',
      value2: formatNumber(data?.delivery?.value),
      condition: data?.delivery?.status
    },
    {
      label: 'SUBTOTAL',
      value2: formatNumber(subtotal),
      condition: true
    },    {
      label: 'DESCUENTO GENERAL',
      value2: formatNumber(generalDiscount),
      condition: !hasIndividualDiscounts && generalDiscount > 0
    },
    {
      label: 'DESCUENTOS PRODUCTOS',
      value2: formatNumber(individualDiscounts),
      condition: hasIndividualDiscounts
    },
    {
      label: 'ITBIS',
      value2: formatNumber(getProductsTax(data?.products || [])),
      condition: true
    },
    ...((data?.paymentMethod?.filter(item => item?.status === true)) || []).map((item) => ({
      label: paymentLabel[item?.method],
      value2: formatNumber(item?.value),
      condition: true
    })),
    {
      subtitle: 'TOTAL',
      value2: formatNumber(data?.totalPurchase?.value),
      condition: true
    },
    {
      label: data?.change?.value >= 0 ? "CAMBIO" : "FALTANTE",
      value2: formatNumber(data?.change?.value),
      condition: true
    },
    {
      label: 'BALANCE ACTUAL',
      value2: formatNumber(data?.pendingBalance || 0),
      condition: data?.change?.value < 0
    }
  ];

  // Renderizamos cada item
  items.forEach(item => {
    if (!item.condition) return;

    if (item.subtitle) {
      paymentText += renderDoubleValueItem(item) + '\n';
    } else {
      paymentText += renderSingleValueItem(item) + '\n';
    }
  });

  // Sección de notas de crédito aplicadas
  const creditNotes = data?.creditNotePayment || [];
  if (creditNotes.length > 0) {
    paymentText += separatorLine() + '\n';
    paymentText += centerText('NOTAS DE CREDITO APLICADAS') + '\n';
    paymentText += separatorLine() + '\n';
    
    creditNotes.forEach(note => {
      const ncfText = `NCF: ${note.ncf}`;
      const amountText = formatNumber(note.amountUsed);
      const left = formatColumn(ncfText, 20, 'left');
      const right = formatColumn(amountText, 20, 'right');
      paymentText += left + right + '\n';
    });
    
    paymentText += separatorLine() + '\n';
  }

  paymentText += '\n'; // Cierre con salto de línea
  return paymentText;
};

// ----------------- Footer -----------------
// eslint-disable-next-line react-refresh/only-export-components
export const renderFooter = () => {
  let footer = '';
  footer += wrapText('Gracias por su compra, regrese pronto.', CENTER_WIDTH) + '\n';
  footer += wrapText('   Lo Esperamos.', CENTER_WIDTH);
  return footer;
};

/* =========================================================
   Componente principal
   ========================================================= */
export const InvoiceTemplate4 = React.forwardRef(({ data, ignoreHidden }, ref) => {
  const business = useSelector(selectBusinessData) || {};
  const { taxReceipt } = useSelector(SelectSettingCart) || {};
  const formatPhoneNumber = useFormatPhoneNumber;

  // Fecha
  const fechaActual = data?.date
    ? DateUtils.convertMillisToISODate(
        DateUtils.convertTimestampToMillis(data.date),
        'dd/MM/yyyy HH:mm'
      )
    : DateTime.now().toFormat('dd/MM/yyyy HH:mm');

  // Concatenamos todas las secciones
  const factura =
    renderBusinessHeader(business, formatPhoneNumber) +
    renderInvoiceHeader(data, fechaActual) +
    renderClientInfo(data?.client, formatPhoneNumber) +
    renderProducts(
      data?.products,
      taxReceipt,
      getTax,
      getTotalPrice,
      resetAmountToBuyForProduct,
      separator,
      data?.NCF
    ) +
    renderPaymentArea(data, separator, getProductsPrice, getProductsTax, getTotalDiscount) +
    renderFooter();

  return (
    <HiddenPrintWrapper ignoreHidden={ignoreHidden}>
      <pre ref={ref}>{factura}</pre>
    </HiddenPrintWrapper>
  );
});

export default InvoiceTemplate4;

/* =========================================================
   Estilo Wrapper
   ========================================================= */
export const HiddenPrintWrapper = styled.div`
  display: ${({ ignoreHidden }) => !ignoreHidden && 'none'};
`;
