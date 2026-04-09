import { DateTime } from 'luxon';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import { PRODUCT_BRAND_DEFAULT } from '@/features/updateProduct/updateProductSlice';
import { formatPhoneNumber } from '@/utils/format/formatPhoneNumber';
import { resolveInvoiceAmount } from '@/utils/invoice/amount';
import { resolveDocumentIdentity } from '@/utils/invoice/documentIdentity';
import { formatInvoicePrice } from '@/utils/invoice/documentCurrency';
import { resolveInvoiceDateMillis } from '@/utils/invoice/date';
import { toNumber } from '@/utils/number/toNumber';
import {
  resolveInvoiceDisplayedTax,
  resolveInvoiceDisplayedTotal,
} from '@/utils/accounting/lineMonetary';
import {
  resetAmountToBuyForProduct,
  getProductsPrice,
  getProductsTax,
  getTotalDiscount,
  getProductIndividualDiscount,
  getProductsIndividualDiscounts,
} from '@/utils/pricing';
import { convertTimeToSpanish } from '@/components/modals/ProductForm/components/sections/warranty.helpers';
import type {
  InvoiceBusinessInfo,
  InvoiceClient,
  InvoiceData,
  InvoiceProduct,
  InvoiceTemplateProps,
} from '@/types/invoice';

// Máximo de caracteres por línea
const CENTER_WIDTH = 40;
const RECEIPT_WIDTH_MM = '80mm';

type FormatPhone = (value?: string | null) => string;
type TaxReceiptConfig = { enabled?: boolean };
type ProductCalculator = (
  products: InvoiceProduct[],
  enabled?: boolean,
) => number;

/* =========================================================
   Funciones auxiliares
   ========================================================= */

// Ajustamos wrapText para que corte en maxWidth (40) sin guión
const wrapText = (text: string, maxWidth = CENTER_WIDTH): string => {
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
const wrapAndCenter = (text: string, maxWidth = CENTER_WIDTH) => {
  const wrapped = wrapText(text, maxWidth);
  return wrapped
    .split('\n')
    .map((line: string) => centerText(line, maxWidth))
    .join('\n');
};

// Centrar una sola línea a un ancho dado
const centerText = (text: string, maxWidth = CENTER_WIDTH) => {
  const spaces = Math.floor((maxWidth - text.length) / 2);
  return ' '.repeat(spaces) + text;
};

// Línea separadora
const separatorLine = (maxWidth = CENTER_WIDTH) => '-'.repeat(maxWidth);

// Formatear columnas (left, right, center)
const formatColumn = (
  text: string | number,
  width: number,
  align: 'left' | 'right' | 'center' = 'left',
): string => {
  let str = text.toString();

  // Si excede el ancho, lo envolvemos
  if (str.length > width) {
    return wrapText(str, width);
  }

  // Según la alineación
  if (align === 'right') {
    return str.padStart(width, ' ');
  } else if (align === 'center') {
    const spaces = Math.floor((width - str.length) / 2);
    return ' '.repeat(spaces) + str + ' '.repeat(width - str.length - spaces);
  }

  return str.padEnd(width, ' ');
};

// Concatenar nombre del producto con medida y pie
const getFullProductName = (product: InvoiceProduct) => {
  return (
    (product.name ?? '') +
    (product.measurement ? ` Medida: [${product.measurement}]` : '') +
    (product.footer ? ` Pie: [${product.footer}]` : '')
  );
};

/* =========================================================
   Secciones
   ========================================================= */

// ----------------- Business Header -----------------
const renderBusinessHeader = (
  business: InvoiceBusinessInfo,
  phoneFormatter: FormatPhone,
) => {
  // SIN salto de línea al principio: empieza de inmediato
  let header = '';
  header += wrapAndCenter(business.name || 'Nombre del Negocio') + '\n';
  header += wrapAndCenter(business.address || 'Dirección del Negocio') + '\n';
  header +=
    wrapAndCenter(phoneFormatter(business.tel || '') || 'Teléfono') + '\n';
  if (business.rnc) {
    header += wrapAndCenter(`RNC: ${business.rnc}`) + '\n';
  }
  header += separatorLine() + '\n';

  return header;
};

// ----------------- Invoice Header -----------------
const renderInvoiceHeader = (
  data: InvoiceData | null | undefined,
  fechaActual: string,
) => {
  let header = '';
  const identity = resolveDocumentIdentity(data as any);
  header += 'Fecha: ' + fechaActual + '\n';
  if (identity.label) {
    header +=
      identity.label.toUpperCase() + ': ' + (identity.value || '-') + '\n';
  }
  header += centerText(identity.description || identity.title) + '\n';
  header += separatorLine() + '\n';

  // Salto de línea al final de la sección
  return header;
};

// ----------------- Client Info -----------------
const renderClientInfo = (
  client: InvoiceClient | null | undefined,
  phoneFormatter: FormatPhone,
) => {
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
    clientText += 'TEL: ' + phoneFormatter(client.tel || '') + '\n';
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
const renderProducts = (
  data: InvoiceData | null | undefined,
  products: InvoiceProduct[] | undefined,
  taxReceiptEnabled: boolean,
  resetAmountFn: typeof resetAmountToBuyForProduct,
) => {
  let prodText = '';
  // Cabecera de columnas
  prodText +=
    formatColumn('CANT/PRICE', 13, 'center') +
    formatColumn('ITBIS', 10, 'right') +
    formatColumn('TOTAL', 17, 'right') +
    '\n';
  prodText += separatorLine() + '\n';

  if (Array.isArray(products) && products.length > 0) {
    products.forEach((product) => {
      // Columna izquierda
      let leftCol = '';
      if (product?.weightDetail?.isSoldByWeight) {
        leftCol = `${product.weightDetail?.weight} ${product.weightDetail?.weightUnit}x${formatInvoicePrice(
          resolveInvoiceDisplayedTotal(
            resetAmountFn(product),
            data,
            taxReceiptEnabled,
          ),
          data,
        )}`;
      } else {
        leftCol = `${resolveInvoiceAmount(product?.amountToBuy)} x ${formatInvoicePrice(
          resolveInvoiceDisplayedTotal(
            resetAmountFn(product),
            data,
            taxReceiptEnabled,
          ),
          data,
        )}`;
      }

      // Construimos cada columna
      const col1 = formatColumn(leftCol, 13, 'left');
      const col2 = formatColumn(
        formatInvoicePrice(
          resolveInvoiceDisplayedTax(product, data, taxReceiptEnabled),
          data,
        ),
        10,
        'right',
      );
      const col3 = formatColumn(
        formatInvoicePrice(
          resolveInvoiceDisplayedTotal(product, data, taxReceiptEnabled),
          data,
        ),
        17,
        'right',
      );
      prodText += col1 + col2 + col3 + '\n'; // Nombre completo del producto (y lo partimos en líneas de máx 40)
      prodText += wrapText(getFullProductName(product), CENTER_WIDTH) + '\n';

      const rawBrand =
        typeof product?.brand === 'string' ? product.brand.trim() : '';
      if (
        rawBrand &&
        rawBrand.toLowerCase() !== PRODUCT_BRAND_DEFAULT.toLowerCase()
      ) {
        prodText += wrapText(`Marca: ${rawBrand}`, CENTER_WIDTH) + '\n';
      }

      // Descuento individual (si aplica)
      if (product?.discount && (product?.discount?.value ?? 0) > 0) {
        const discountAmount = getProductIndividualDiscount(product);
        const discountType =
          product.discount.type === 'percentage'
            ? `${product.discount.value}%`
            : 'Monto fijo';
        prodText +=
          wrapText(
            `Descuento: -${formatInvoicePrice(discountAmount || 0, data)} (${discountType})`,
            CENTER_WIDTH,
          ) + '\n';
      }

      // Garantía (si aplica)
      if (product?.warranty?.status) {
        const warrantyText =
          convertTimeToSpanish(
            product.warranty.quantity,
            product.warranty.unit,
          ) + ' de Garantía';
        prodText += wrapText(warrantyText, CENTER_WIDTH) + '\n';
      }
    });
  } else {
    // Caso sin productos
    const col1 = formatColumn(`1.0 x ${formatInvoicePrice(530, data)}`, 13, 'left');
    const col2 = formatColumn(formatInvoicePrice(80.85, data), 10, 'right');
    const col3 = formatColumn(formatInvoicePrice(530, data), 17, 'right');
    prodText += col1 + col2 + col3 + '\n';
    prodText += wrapText('FUNDA DE CEMENTO DOMICEN', CENTER_WIDTH) + '\n';
  }

  prodText += separatorLine() + '\n';
  return prodText;
};

// ----------------- Payment Area -----------------
const renderPaymentArea = (
  data: InvoiceData | null | undefined,
  getProductsPriceFn: ProductCalculator,
  getProductsTaxFn: ProductCalculator,
  getTotalDiscountFn: typeof getTotalDiscount,
) => {
  let paymentText = '';

  const renderSingleValueItem = (item: {
    label?: string;
    value2?: string | number | null;
  }) => {
    const left = formatColumn((item.label || '') + ':', 20, 'left');
    const right = formatColumn(item.value2 || '', 20, 'right');
    return left + right;
  };

  const renderDoubleValueItem = (item: {
    subtitle?: string;
    value1?: string | number | null;
    value2?: string | number | null;
  }) => {
    const left = formatColumn((item.subtitle || '') + ':', 14, 'left');
    const mid = formatColumn(item.value1 || '', 13, 'right');
    const right = formatColumn(item.value2 || '', 13, 'right');
    return left + mid + right;
  };

  const formatNumber = (num: unknown) => formatInvoicePrice(toNumber(num), data);
  // Calculos para subtotal, itbis y descuentos
  const subtotal = toNumber(getProductsPriceFn(data?.products || []));
  const generalDiscount = toNumber(
    getTotalDiscountFn(subtotal, toNumber(data?.discount?.value)),
  );
  const individualDiscounts = toNumber(
    getProductsIndividualDiscounts(data?.products || []),
  );
  const hasIndividualDiscounts = individualDiscounts > 0;
  const changeValue = toNumber(data?.change?.value);
  const deliveryEnabled = Boolean(data?.delivery?.status);
  const pendingBalance = toNumber(data?.pendingBalance);

  // Etiquetas de métodos de pago
  const paymentLabel = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    creditNote: 'Nota de Credito',
  };

  type PaymentItem = {
    label?: string;
    subtitle?: string;
    value1?: string | number | null;
    value2?: string | number | null;
    condition: boolean;
  };
  // Items a mostrar en la sección de pago
  const items: PaymentItem[] = [
    {
      label: 'ENVÍO',
      value2: formatNumber(data?.delivery?.value),
      condition: deliveryEnabled,
    },
    {
      label: 'SUBTOTAL',
      value2: formatNumber(subtotal),
      condition: true,
    },
    {
      label: 'DESCUENTO GENERAL',
      value2: formatNumber(generalDiscount),
      condition: !hasIndividualDiscounts && generalDiscount > 0,
    },
    {
      label: 'DESCUENTOS PRODUCTOS',
      value2: formatNumber(individualDiscounts),
      condition: hasIndividualDiscounts,
    },
    {
      label: 'ITBIS',
      value2: formatNumber(getProductsTaxFn(data?.products || [])),
      condition: true,
    },
    ...(data?.paymentMethod?.filter((item) => item?.status === true) || []).map(
      (item) => {
        const methodKey =
          typeof item?.method === 'string' ? item.method : 'cash';
        return {
          label:
            paymentLabel[methodKey as keyof typeof paymentLabel] ??
            paymentLabel.cash,
          value2: formatNumber(item?.value),
          condition: true,
        };
      },
    ),
    {
      subtitle: 'TOTAL',
      value2: formatNumber(data?.totalPurchase?.value),
      condition: true,
    },
    {
      label: changeValue >= 0 ? 'CAMBIO' : 'FALTANTE',
      value2: formatNumber(changeValue),
      condition: true,
    },
    {
      label: 'BALANCE ACTUAL',
      value2: formatNumber(pendingBalance),
      condition: changeValue < 0,
    },
  ];

  // Renderizamos cada item
  items.forEach((item) => {
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

    creditNotes.forEach((note) => {
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
const renderFooter = () => {
  let footer = '';
  footer +=
    wrapText('Gracias por su compra, regrese pronto.', CENTER_WIDTH) + '\n';
  footer += wrapText('   Lo Esperamos.', CENTER_WIDTH);
  return footer;
};

/* =========================================================
   Componente principal
   ========================================================= */
export const InvoiceTemplate4 = React.forwardRef<
  HTMLDivElement,
  InvoiceTemplateProps
>(({ data, ignoreHidden }, ref) => {
  const business = (useSelector(selectBusinessData) ||
    {}) as InvoiceBusinessInfo;
  const { taxReceipt } =
    (useSelector(SelectSettingCart) as { taxReceipt?: TaxReceiptConfig }) || {};
  // formatPhoneNumber ya está importado

  // Fecha
  const invoiceMillis = resolveInvoiceDateMillis(data?.date);
  const fechaActual = invoiceMillis
    ? DateTime.fromMillis(invoiceMillis).toFormat('dd/MM/yyyy HH:mm')
    : DateTime.now().toFormat('dd/MM/yyyy HH:mm');
  const taxReceiptEnabled = Boolean(taxReceipt?.enabled);

  // Concatenamos todas las secciones
  const factura =
    renderBusinessHeader(business, formatPhoneNumber as any) +
    renderInvoiceHeader(data, fechaActual) +
    renderClientInfo(data?.client, formatPhoneNumber as any) +
    renderProducts(
      data,
      data?.products,
      taxReceiptEnabled,
      resetAmountToBuyForProduct,
    ) +
    renderPaymentArea(
      data,
      getProductsPrice as unknown as ProductCalculator,
      getProductsTax as unknown as ProductCalculator,
      getTotalDiscount,
    ) +
    renderFooter();

  return (
    <HiddenPrintWrapper $visible={Boolean(ignoreHidden)}>
      <ReceiptPaper ref={ref}>
        <ReceiptText>{factura}</ReceiptText>
      </ReceiptPaper>
    </HiddenPrintWrapper>
  );
});

InvoiceTemplate4.displayName = 'InvoiceTemplate4';

export default InvoiceTemplate4;

/* =========================================================
   Estilo Wrapper
   ========================================================= */
const HiddenPrintWrapper = styled.div<{ $visible: boolean }>`
  display: ${({ $visible }) => ($visible ? 'block' : 'none')};
`;

const ReceiptPaper = styled.div`
  width: ${RECEIPT_WIDTH_MM};
  max-width: ${RECEIPT_WIDTH_MM};
  padding: 3mm 2mm;
  margin: 0 auto;
  background: #fff;
  box-sizing: border-box;

  @media print {
    width: ${RECEIPT_WIDTH_MM};
    max-width: ${RECEIPT_WIDTH_MM};
    padding: 0;
    margin: 0;
  }
`;

const ReceiptText = styled.pre`
  width: 100%;
  margin: 0;
  white-space: pre-wrap;
  font-family: 'Courier New', Consolas, monospace;
  font-size: 10px;
  line-height: 1.3;
  color: #111;

  @media print {
    font-size: 10px;
    line-height: 1.25;
  }
`;
