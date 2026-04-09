import React from 'react';
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import type {
  InvoicePdfBusiness,
  InvoicePdfData,
  InvoicePdfProduct,
} from '@/pdf/invoicesAndQuotation/types';
import {
  betaInvoicePageLayout,
  estimateInvoicePageLayout,
} from '@/pdf/invoicesAndQuotation/invoices/templates/template2-v2/utils/pageLayout';
import { paginateInvoiceProducts } from '@/pdf/invoicesAndQuotation/invoices/templates/template2-v2/utils/pagination';
import { resolveDocumentIdentity } from '@/utils/invoice/documentIdentity';
import { toMillis } from '@/utils/date/dateUtils';
import {
  getDiscount,
  getProductIndividualDiscount,
  getProductsIndividualDiscounts,
  hasIndividualDiscounts,
  money,
  resolvePdfCurrency,
} from '@/pdf/invoicesAndQuotation/invoices/templates/template2/utils/formatters';

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  creditnote: 'Nota de crédito',
};

const PRODUCT_PREVIEW_MULTIPLIER = 50;
const PAGE_PRODUCT_CAPACITY = 4.8;

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 24,
    fontSize: 9,
    color: '#1f2933',
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#d6dde5',
    paddingBottom: 12,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerBrand: {
    width: betaInvoicePageLayout.logoWidth + 12,
    paddingRight: 12,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  headerRight: {
    width: 180,
    alignItems: 'flex-end',
  },
  businessName: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerText: {
    fontSize: 9,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  logo: {
    width: betaInvoicePageLayout.logoWidth,
    height: betaInvoicePageLayout.logoHeight,
    objectFit: 'contain',
  },
  footer: {
    marginTop: 18,
  },
  footerDivider: {
    borderTopWidth: 1,
    borderTopColor: '#d6dde5',
    paddingTop: 8,
  },
  footerContent: {
    marginTop: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 8,
    color: '#52606d',
  },
  section: {
    marginBottom: 14,
  },
  footerSpacer: {
    height: 10,
  },
  clientCard: {
    borderWidth: 1,
    borderColor: '#dfe7ef',
    borderRadius: 4,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: 10,
  },
  clientColumnLeft: {
    flex: 1,
    paddingRight: 10,
  },
  clientColumnRight: {
    width: 180,
    alignItems: 'flex-end',
  },
  headerSeparator: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    marginVertical: 6,
  },
  headerClientRow: {
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  table: {
    borderWidth: 1,
    borderColor: '#dfe7ef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3c424d',
    color: '#ffffff',
    fontWeight: 'bold',
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#eef2f6',
    alignItems: 'flex-start',
  },
  tableRowMuted: {
    color: '#52606d',
    fontSize: 8,
  },
  cellQty: {
    width: '10%',
    paddingRight: 6,
    textAlign: 'center',
  },
  cellCode: {
    width: '16%',
    paddingRight: 6,
  },
  cellDescription: {
    width: '34%',
    paddingRight: 8,
  },
  cellMoney: {
    width: '13.333%',
    textAlign: 'right',
  },
  summaryBlock: {
    marginBottom: 10,
  },
  summaryBlockTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryListItem: {
    marginBottom: 3,
  },
  bulletMarker: {
    marginRight: 4,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#1f2933',
    width: 130,
    marginBottom: 6,
  },
  signatureLabel: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  signatureBlock: {
    marginBottom: 8,
  },
  signatureColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  signatureColumnLeft: {
    width: '30%',
  },
  signatureColumnCenter: {
    width: '30%',
  },
  signatureColumnRight: {
    width: '35%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalRowStrong: {
    fontWeight: 'bold',
    fontSize: 10,
    marginTop: 2,
  },
  notes: {
    marginTop: 10,
    lineHeight: 1.35,
    color: '#364152',
  },
  emptyState: {
    padding: 12,
    color: '#52606d',
  },
});

const formatDate = (value: unknown): string => {
  const millis = toMillis(value as Parameters<typeof toMillis>[0]);
  if (!millis) return '-';

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(millis);
};

const resolveQuantity = (product: InvoicePdfProduct): number => {
  const rawQuantity = product?.amountToBuy;

  if (typeof rawQuantity === 'number') {
    return rawQuantity;
  }

  if (rawQuantity && typeof rawQuantity === 'object') {
    const candidate = Number(rawQuantity.total ?? rawQuantity.unit ?? 0);
    return Number.isFinite(candidate) ? candidate : 0;
  }

  const fallback = Number(rawQuantity ?? 0);
  return Number.isFinite(fallback) ? fallback : 0;
};

const resolveUnitPrice = (product: InvoicePdfProduct): number => {
  const candidate =
    Number(product?.selectedSaleUnit?.pricing?.price) ||
    Number(product?.pricing?.price) ||
    Number(product?.price?.unit) ||
    0;

  return Number.isFinite(candidate) ? candidate : 0;
};

const resolveTaxRate = (product: InvoicePdfProduct): number => {
  const rate = Number(product?.pricing?.tax ?? 0);
  return Number.isFinite(rate) ? rate : 0;
};

const buildDescriptionLines = (
  product: InvoicePdfProduct,
  currency: 'DOP' | 'USD',
): string[] => {
  const lines = [
    product?.name || product?.productName || 'Producto sin nombre',
  ];

  if (product?.brand && product.brand !== 'Sin marca') {
    lines.push(`Marca: ${product.brand}`);
  }

  if (product?.comment) {
    lines.push(`Nota: ${product.comment}`);
  }

  const individualDiscount = getProductIndividualDiscount(product);
  if (individualDiscount > 0) {
    lines.push(`Descuento aplicado: -${money(individualDiscount, currency)}`);
  }

  return lines;
};

const buildPreviewProducts = (
  sourceProducts: InvoicePdfProduct[],
): InvoicePdfProduct[] => {
  if (PRODUCT_PREVIEW_MULTIPLIER <= 1 || sourceProducts.length === 0) {
    return sourceProducts;
  }

  return Array.from({ length: PRODUCT_PREVIEW_MULTIPLIER }, (_, copyIndex) =>
    sourceProducts.map((product, productIndex) => ({
      ...product,
      previewDuplicateKey: `${product?.id || product?.barcode || product?.sku || 'preview-product'}-${copyIndex}-${productIndex}`,
    })),
  ).flat();
};

type InvoiceHeaderProps = {
  business: InvoicePdfBusiness;
  data: InvoicePdfData;
  identity: ReturnType<typeof resolveDocumentIdentity>;
  layout: ReturnType<typeof estimateInvoicePageLayout>;
};

const InvoiceHeader = ({
  business,
  data,
  identity,
  layout,
}: InvoiceHeaderProps): React.JSX.Element => (
  <View style={styles.header} wrap={false}>
    <View style={styles.headerRow}>
      {business?.logoUrl ? (
        <View style={styles.headerBrand}>
          <Image cache={false} src={business.logoUrl} style={styles.logo} />
        </View>
      ) : null}

      <View style={styles.headerLeft}>
        <Text style={styles.businessName}>{business?.name || 'Empresa'}</Text>
        {business?.address ? (
          <Text style={styles.headerText}>{business.address}</Text>
        ) : null}
        {business?.tel ? (
          <Text style={styles.headerText}>Tel: {business.tel}</Text>
        ) : null}
        {business?.email ? (
          <Text style={styles.headerText}>{business.email}</Text>
        ) : null}
        {business?.rnc ? (
          <Text style={[styles.headerText, { fontWeight: 'bold' }]}>
            RNC: {business.rnc}
          </Text>
        ) : null}
      </View>

      <View style={styles.headerRight}>
        <Text style={styles.headerTitle}>{identity.title || 'Factura'}</Text>
        <Text style={styles.headerText}>Fecha: {formatDate(data?.date)}</Text>
        {identity.label &&
        identity.type !== 'preorder' &&
        identity.type !== 'receipt' ? (
          <Text style={styles.headerText}>
            {identity.label}: {identity.value || '-'}
          </Text>
        ) : null}
        <Text style={[styles.headerText, { fontWeight: 'bold' }]}>
          {identity.type === 'preorder'
            ? `${identity.title || 'Factura'} # ${identity.value || data?.preorderDetails?.numberID || data?.numberID || '-'}`
            : identity.type === 'receipt'
              ? `Recibo # ${identity.value || data?.numberID || '-'}`
              : `${identity.title || 'Factura'} # ${data?.numberID || '-'} `}
        </Text>
        {data?.dueDate ? (
          <Text style={styles.headerText}>
            Vence: {formatDate(data.dueDate)}
          </Text>
        ) : null}
      </View>
    </View>

    {layout.hasClientBlock ? (
      <>
        <View style={styles.headerSeparator} />

        <View style={styles.headerClientRow}>
          <View style={styles.clientCard}>
            <View style={styles.clientColumnLeft}>
              <Text style={[styles.headerText, { fontWeight: 'bold' }]}>
                Cliente: {data?.client?.name || 'Cliente generico'}
              </Text>
              {data?.client?.address ? (
                <Text style={styles.headerText}>
                  Direccion: {data.client.address}
                </Text>
              ) : null}
              {data?.client?.tel ? (
                <Text style={styles.headerText}>Tel: {data.client.tel}</Text>
              ) : null}
            </View>

            <View style={styles.clientColumnRight}>
              {data?.client?.rnc ? (
                <Text style={styles.headerText}>
                  RNC/Cedula: {data.client.rnc}
                </Text>
              ) : data?.client?.personalID ? (
                <Text style={styles.headerText}>
                  RNC/Cedula: {data.client.personalID}
                </Text>
              ) : null}
              {data?.seller?.name ? (
                <Text style={styles.headerText}>
                  Vendedor: {data.seller.name}
                </Text>
              ) : null}
              {data?.NCF ? (
                <Text style={styles.headerText}>NCF: {data.NCF}</Text>
              ) : null}
              {data?.preorderDetails?.date ? (
                <Text style={styles.headerText}>
                  Fecha pedido: {formatDate(data.preorderDetails.date)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </>
    ) : null}
  </View>
);

const InvoiceFooter = ({
  copyType,
  paymentLines,
  creditNoteLines,
  totals,
  notes,
}: {
  copyType?: string | null;
  paymentLines: string[];
  creditNoteLines: string[];
  totals: Array<[string, string]>;
  notes: string;
}): React.JSX.Element => (
  <View style={styles.footer} wrap={false}>
    <View style={styles.footerDivider}>
      <View style={styles.footerRow}>
        <Text>{copyType || 'COPIA'}</Text>
        <Text
          render={({ pageNumber, totalPages }) =>
            `Pagina ${pageNumber} de ${totalPages}`
          }
        />
      </View>

      <View style={styles.footerContent}>
        <View style={styles.signatureColumns}>
          <View style={styles.signatureColumnLeft}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Despachado Por:</Text>
            </View>
            {paymentLines.length ? (
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryBlockTitle}>Metodos de Pago:</Text>
                {paymentLines.map((line, index) => (
                  <Text key={`payment-${index}`} style={styles.summaryListItem}>
                    • {line}
                  </Text>
                ))}
              </View>
            ) : null}
            {creditNoteLines.length ? (
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryBlockTitle}>
                  Notas de Credito Aplicadas:
                </Text>
                {creditNoteLines.map((line, index) => (
                  <Text
                    key={`credit-note-${index}`}
                    style={styles.summaryListItem}
                  >
                    • {line}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.signatureColumnCenter}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Recibido Conforme:</Text>
              <Text>{copyType || 'COPIA'}</Text>
            </View>
          </View>

          <View style={styles.signatureColumnRight}>
            {totals.map(([label, value], index) => {
              const isTotalRow = index === totals.length - 1;

              return (
                <View key={`${label}-${index}`} style={styles.totalRow}>
                  <Text style={isTotalRow ? styles.totalRowStrong : undefined}>
                    {label}:
                  </Text>
                  <Text style={isTotalRow ? styles.totalRowStrong : undefined}>
                    {value}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {notes ? <Text style={styles.notes}>{notes}</Text> : null}
      </View>
    </View>
  </View>
);

const ProductTable = ({
  products,
  currency,
}: {
  products: InvoicePdfProduct[];
  currency: 'DOP' | 'USD';
}): React.JSX.Element => (
  <View style={styles.table} wrap={false}>
    <View style={styles.tableHeader}>
      <Text style={styles.cellQty}>CANT</Text>
      <Text style={styles.cellCode}>CODIGO</Text>
      <Text style={styles.cellDescription}>DESCRIPCION</Text>
      <Text style={styles.cellMoney}>PRECIO</Text>
      <Text style={styles.cellMoney}>ITBIS</Text>
      <Text style={styles.cellMoney}>TOTAL</Text>
    </View>

    {products.length ? (
      products.map((product, index) => {
        const quantity = resolveQuantity(product);
        const unitPrice = resolveUnitPrice(product);
        const taxPerUnit = unitPrice * (resolveTaxRate(product) / 100);
        const rowTotal = (unitPrice + taxPerUnit) * quantity;
        const descriptionLines = buildDescriptionLines(product, currency);

        return (
          <View
            key={String(
              product?.previewDuplicateKey ||
                `${product?.id || product?.barcode || product?.cid || 'product'}-${index}`,
            )}
            style={styles.tableRow}
          >
            <Text style={styles.cellQty}>{quantity}</Text>
            <Text style={styles.cellCode}>
              {product?.barcode || product?.sku || '-'}
            </Text>
            <View style={styles.cellDescription}>
              {descriptionLines.map((line, lineIndex) => (
                <Text
                  key={`${product?.id || 'product'}-line-${lineIndex}`}
                  style={lineIndex === 0 ? undefined : styles.tableRowMuted}
                >
                  {line}
                </Text>
              ))}
            </View>
            <Text style={styles.cellMoney}>{money(unitPrice, currency)}</Text>
            <Text style={styles.cellMoney}>{money(taxPerUnit, currency)}</Text>
            <Text style={styles.cellMoney}>{money(rowTotal, currency)}</Text>
          </View>
        );
      })
    ) : (
      <Text style={styles.emptyState}>
        No hay productos disponibles para renderizar este PDF.
      </Text>
    )}
  </View>
);

type InvoiceLetterDocumentProps = {
  business: InvoicePdfBusiness;
  data: InvoicePdfData;
};

export const InvoiceLetterDocument = ({
  business,
  data,
}: InvoiceLetterDocumentProps): React.JSX.Element => {
  const currency = resolvePdfCurrency(data);
  const identity = resolveDocumentIdentity(data);
  const layout = estimateInvoicePageLayout({
    business,
    data,
    identity,
  });
  const sourceProducts = Array.isArray(data?.products) ? data.products : [];
  const products = buildPreviewProducts(sourceProducts);
  const productPages = paginateInvoiceProducts(
    products,
    (product) => buildDescriptionLines(product).length,
    PAGE_PRODUCT_CAPACITY,
  );
  const paymentLines = (data?.paymentMethod || [])
    .filter((method) => method?.status)
    .map((method) => {
      const key = method?.method?.toLowerCase() || '';
      const label =
        PAYMENT_METHODS[key] || method?.name || method?.method || 'Pago';
      const reference = method?.reference ? `, ref. ${method.reference}` : '';
      return `${label}: ${money(method?.value || 0, currency)}${reference}`;
    });
  const creditNoteLines = (data?.creditNotePayment || []).map(
    (note) => `NCF ${note?.ncf || '-'}: ${money(note?.amountUsed || 0, currency)}`,
  );
  const notes = [data?.invoiceComment, business?.invoice?.invoiceMessage]
    .filter(Boolean)
    .join('\n\n');
  const individualDiscounts = getProductsIndividualDiscounts(sourceProducts);
  const hasIndividualDisc = hasIndividualDiscounts(sourceProducts);
  const generalDiscount = hasIndividualDisc ? 0 : getDiscount(data);
  const totals = [
    ['Sub-total', money(data?.totalPurchaseWithoutTaxes?.value ?? 0, currency)],
    ['ITBIS', money(data?.totalTaxes?.value ?? 0, currency)],
    ...(hasIndividualDisc
      ? [['Descuentos productos', `-${money(individualDiscounts, currency)}`]]
      : Number(data?.discount?.value)
        ? [['Descuento general', `-${money(generalDiscount, currency)}`]]
        : []),
    ...(data?.delivery?.status
      ? [['Delivery', money(data?.delivery?.value ?? 0, currency)]]
      : []),
    ['Total', money(data?.totalPurchase?.value ?? 0, currency)],
  ] as Array<[string, string]>;

  return (
    <Document
      title={`${business?.name || 'Empresa'} - ${identity.title || 'Factura'}`}
      author={business?.name || 'VentaMas'}
      creator="VentaMas"
      producer="VentaMas"
    >
      {productPages.map((productPage, pageIndex) => (
        <Page
          key={`products-page-${pageIndex}`}
          size="A4"
          style={styles.page}
          wrap={false}
        >
          <InvoiceHeader
            business={business}
            data={data}
            identity={identity}
            layout={layout}
          />

          <View style={styles.section} wrap={false}>
            <ProductTable products={productPage} currency={currency} />
          </View>

          <View style={styles.footerSpacer} wrap={false} />

          <InvoiceFooter
            copyType={data?.copyType}
            paymentLines={paymentLines}
            creditNoteLines={creditNoteLines}
            totals={totals}
            notes={notes}
          />
        </Page>
      ))}
    </Document>
  );
};
