import type {
  InvoiceBusinessInfo,
  InvoiceData,
  InvoicePaymentMethod,
} from '@/types/invoice';
import type { UserOptions } from 'jspdf-autotable';
import { resolveDocumentIdentity } from '@/utils/invoice/documentIdentity.js';
import { toMillis } from '@/utils/date/dateUtils';

// Función de formateo de precios (ajústala según necesites)
const formatPrice = (value: number | string | null | undefined): string => {
  const numeric = typeof value === 'number' ? value : Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return `$${safeValue.toFixed(2)}`;
};

// Función auxiliar para calcular el descuento total
const getTotalDiscount = (subtotal: number, discountPercent: number) =>
  (subtotal * discountPercent) / 100;

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
};

export async function generateInvoicePDF({
  business,
  data,
}: {
  business?: InvoiceBusinessInfo | null;
  data?: InvoiceData | null;
}): Promise<void> {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF();
  const docWithTable = doc as typeof doc & {
    autoTable: (options: UserOptions) => void;
  };
  const marginLeft = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Alturas reservadas para header y footer
  const headerHeight = 50;
  const footerHeight = 50;

  // Función para dibujar el header en cada página
  const addHeader = () => {
    // Lado izquierdo del header
    doc.setFontSize(16);
    doc.text(business?.name || 'Empresa', marginLeft, 20);
    doc.setFontSize(12);
    let headerY = 28;
    if (business?.address) {
      doc.text(business.address, marginLeft, headerY);
      headerY += 6;
    }
    if (business?.tel) {
      doc.text(`Tel: ${business.tel}`, marginLeft, headerY);
      headerY += 6;
    }
    if (business?.email) {
      doc.text(`Email: ${business.email}`, marginLeft, headerY);
      headerY += 6;
    }
    if (business?.rnc) {
      doc.text(`RNC: ${business.rnc}`, marginLeft, headerY);
      headerY += 6;
    }
    // Lado derecho del header
    const rightX = pageWidth - 80;
    let headerRightY = 20;
    const formatDate = (dateObj: InvoiceData['date']) => {
      const millis = toMillis(dateObj);
      if (!millis) return '';
      return new Date(millis).toLocaleDateString();
    };
    const documentIdentity = resolveDocumentIdentity(data);
    const isPreorderDocument = documentIdentity.type === 'preorder';
    doc.setFontSize(12);
    doc.text(documentIdentity.title, rightX, headerRightY);
    headerRightY += 6;
    doc.text(`Fecha: ${formatDate(data?.date)}`, rightX, headerRightY);
    headerRightY += 6;
    if (documentIdentity.label && !isPreorderDocument) {
      doc.text(
        `${documentIdentity.label}: ${documentIdentity.value || '-'}`,
        rightX,
        headerRightY,
      );
      headerRightY += 6;
    }
    const referenceLabel = isPreorderDocument
      ? 'Preventa'
      : documentIdentity.title || 'Factura';
    const referenceValue = isPreorderDocument
      ? documentIdentity.value ||
        data?.preorderDetails?.numberID ||
        data?.numberID ||
        '-'
      : data?.numberID || '-';
    doc.text(`${referenceLabel} # ${referenceValue}`, rightX, headerRightY);
    headerRightY += 6;
    if (data?.preorderDetails?.date) {
      doc.text(
        `Fecha de pedido: ${formatDate(data.preorderDetails.date)}`,
        rightX,
        headerRightY,
      );
      headerRightY += 6;
    }
    if (data?.dueDate) {
      doc.text(
        `Fecha que vence: ${formatDate(data.dueDate)}`,
        rightX,
        headerRightY,
      );
      headerRightY += 6;
    }
  };

  // Función para dibujar el footer en cada página
  const addFooter = () => {
    const footerMarginBottom = 10;
    const footerStartY = pageHeight - footerHeight - footerMarginBottom;
    doc.setLineWidth(0.5);
    doc.line(
      marginLeft,
      footerStartY - 5,
      pageWidth - marginLeft,
      footerStartY - 5,
    );

    // Grupo de firmas (lado izquierdo)
    let leftX = marginLeft;
    let leftY = footerStartY;
    const signatureLineWidth = 70;
    doc.setFontSize(10);
    doc.line(leftX, leftY, leftX + signatureLineWidth, leftY);
    doc.text('Despachado Por:', leftX, leftY + 5);
    leftY += 20;
    doc.line(leftX, leftY, leftX + signatureLineWidth, leftY);
    doc.text('Recibido Conforme:', leftX, leftY + 5);

    // Vendedor y métodos de pago (lado izquierdo, debajo de las firmas)
    let paymentY = footerStartY;
    if (data?.seller?.name) {
      doc.text(`Vendedor: ${data.seller.name}`, leftX, paymentY - 10);
    }
    const paymentMethods = (data?.paymentMethod ||
      []) as InvoicePaymentMethod[];
    if (paymentMethods.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.text('Métodos de Pago:', leftX, paymentY);
      doc.setFont(undefined, 'normal');
      paymentY += 6;
      paymentMethods.forEach((method) => {
        if (method?.status) {
          const methodKey = method.method ? method.method.toLowerCase() : '';
          const methodLabel =
            PAYMENT_METHODS[methodKey] || method.method || 'Pago';
          let lineText = `${methodLabel}: ${formatPrice(method.value || 0)}`;
          if (method.reference) {
            lineText += ` - Ref: ${method.reference}`;
          }
          doc.text(lineText, leftX, paymentY);
          paymentY += 6;
        }
      });
    }

    // Tipo de copia y totales (lado derecho)
    const rightColX = marginLeft + (pageWidth - 2 * marginLeft) / 2;
    doc.text(data?.copyType || 'COPIA', rightColX, footerStartY - 10);
    const purchaseSubtotal = Number(
      data?.totalPurchaseWithoutTaxes?.value ?? 0,
    );
    const discountPercent = Number(data?.discount?.value ?? 0);
    const computedDiscount = getTotalDiscount(
      purchaseSubtotal,
      discountPercent,
    );
    const totals = {
      subtotal: formatPrice(purchaseSubtotal),
      discount: `-${formatPrice(computedDiscount)}`,
      tax: formatPrice(data?.totalTaxes?.value || 0),
      delivery: formatPrice(data?.delivery?.value || 0),
      total: formatPrice(data?.totalPurchase?.value || 0),
    };
    let totalsY = footerStartY;
    const rowGap = 6;
    doc.setFontSize(12);
    doc.text('Sub-Total:', rightColX, totalsY);
    doc.text(totals.subtotal, pageWidth - marginLeft, totalsY, {
      align: 'right',
    });
    totalsY += rowGap;
    doc.text('ITBIS:', rightColX, totalsY);
    doc.text(totals.tax, pageWidth - marginLeft, totalsY, { align: 'right' });
    totalsY += rowGap;
    if (discountPercent) {
      doc.text(`Descuento (%${discountPercent}):`, rightColX, totalsY);
      doc.text(totals.discount, pageWidth - marginLeft, totalsY, {
        align: 'right',
      });
      totalsY += rowGap;
    }
    if (data?.delivery?.status) {
      doc.text('Delivery:', rightColX, totalsY);
      doc.text(totals.delivery, pageWidth - marginLeft, totalsY, {
        align: 'right',
      });
      totalsY += rowGap;
    }
    doc.setFont(undefined, 'bold');
    doc.text('Total:', rightColX, totalsY);
    doc.text(totals.total, pageWidth - marginLeft, totalsY, { align: 'right' });
    doc.setFont(undefined, 'normal');
  };

  // === Tabla de productos ===
  // Se multiplica cada producto 10 veces para simular una mayor cantidad
  const tableColumn = [
    'CANT.',
    'CODIGO',
    'DESCRIPCION',
    'PRECIO',
    'ITBIS',
    'TOTAL',
  ];
  const tableRows: Array<Array<string | number | null | undefined>> = [];
  (data?.products || []).forEach((product) => {
    const price = Number(product.pricing?.price ?? 0);
    const taxAmount = (price * Number(product.pricing?.tax ?? 0)) / 100;
    const amount = Number(product.amountToBuy ?? 0);
    const total = ((price + taxAmount) * amount).toFixed(2);
    const productData = [
      amount,
      product.barcode,
      product.name,
      price.toFixed(2),
      taxAmount.toFixed(2),
      total,
    ];
    for (let i = 0; i < 10; i++) {
      tableRows.push(productData);
    }
  });

  // Se define la posición de inicio de la tabla dejando espacio para el header
  const startY = headerHeight + 10;

  docWithTable.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: startY,
    margin: { top: headerHeight, bottom: footerHeight },
    didDrawPage: function () {
      addHeader();
      addFooter();
    },
  });

  // Guardar el PDF
  doc.save('factura.pdf');
}
