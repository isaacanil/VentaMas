import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { InvoiceTemplate2V3_1 } from '@/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3_1/InvoiceTemplate2V3_1';
import type { InvoiceBusinessInfo, InvoiceData } from '@/types/invoice';

import { FiscalDocumentPagination } from '../FiscalDocumentPagination/FiscalDocumentPagination';

const fixtures = vi.hoisted(() => ({
  business: {
    address: 'Av. Independencia 45',
    email: 'facturacion@ventamas.test',
    fiscal: {
      branchName: 'Sucursal Central',
      countryCode: 'DO',
      municipalityName: 'Santo Domingo',
      provinceName: 'Distrito Nacional',
      sectorName: 'Piantini',
    },
    invoice: {
      signatureAssets: {
        enabled: true,
        signatureUrl: 'data:image/png;base64,signature',
        stampUrl: 'data:image/png;base64,stamp',
      },
    },
    logoUrl: 'data:image/png;base64,logo',
    name: 'VentaMas Demo SRL',
    rnc: '132000001',
    tel: '809-555-0101',
  } as InvoiceBusinessInfo,
}));

vi.mock('react-redux', () => ({
  useSelector: () => fixtures.business,
}));

const invoiceData = {
  id: 'invoice-legacy-parity',
  numberID: 1042,
  NCF: 'E310000000123',
  date: '2026-06-21',
  dueDate: '2026-07-21',
  copyType: 'ORIGINAL',
  client: {
    address: 'Calle Principal 2',
    countryCode: 'DO',
    municipalityName: 'Santo Domingo Este',
    name: 'GI SYS SRL',
    provinceName: 'Santo Domingo',
    rnc: '132619201',
    sectorName: 'Alma Rosa',
    tel: '809-555-2222',
    tel2: '809-555-3333',
  },
  seller: { name: 'Ana Ventas' },
  preorderDetails: { date: '2026-06-20' },
  products: [
    {
      id: 'product-1',
      name: 'Producto gravado',
      amountToBuy: 2,
      barcode: 'P001',
      pricing: { price: 100, tax: { tax: 18 } },
    },
    {
      id: 'product-2',
      name: 'Producto exento',
      amountToBuy: 1,
      barcode: 'P002',
      pricing: { price: 50, tax: { tax: 0 } },
    },
  ],
  paymentMethod: [{ method: 'cash', status: true, value: 274 }],
  creditNotePayment: [
    { id: 'credit-payment-1', ncf: 'E340000000555', amountUsed: 12 },
  ],
  totalPurchaseWithoutTaxes: { value: 250 },
  totalTaxes: { value: 36 },
  totalPurchase: { value: 286 },
  electronicTaxReceipt: {
    documentType: 'E31',
    eNcf: 'E310000000123',
    qr: { url: 'https://ecf.dgii.gov.do/testecf/consulta?id=1' },
    securityCode: 'ABC123',
    signedAt: '2026-06-21',
    sequenceExpirationDate: '2026-12-31',
    dgiiValidationStatus: 'accepted',
  },
} as InvoiceData;

const normalizeText = (container: HTMLElement): string =>
  (container.textContent ?? '').replace(/\s+/g, ' ').trim();

const expectBothDocumentsContain = ({
  facts,
  legacyText,
  paginatedText,
}: {
  facts: string[];
  legacyText: string;
  paginatedText: string;
}) => {
  facts.forEach((fact) => {
    expect(legacyText).toContain(fact);
    expect(paginatedText).toContain(fact);
  });
};

describe('invoice print pagination legacy parity', () => {
  it('preserves the core fiscal facts rendered by InvoiceTemplate2V3_1', () => {
    const legacy = render(
      <InvoiceTemplate2V3_1 data={invoiceData} ignoreHidden />,
    );
    const paginated = render(
      <FiscalDocumentPagination
        business={fixtures.business}
        data={invoiceData}
      />,
    );
    const legacyText = normalizeText(legacy.container);
    const paginatedText = normalizeText(paginated.container);

    expectBothDocumentsContain({
      legacyText,
      paginatedText,
      facts: [
        'FACTURA DE CRÉDITO FISCAL ELECTRÓNICA',
        'VentaMas Demo SRL',
        'Sucursal: Sucursal Central',
        'Sector: Piantini',
        'Municipio/Provincia: Santo Domingo, Distrito Nacional',
        '132000001',
        'Factura #1042',
        'E310000000123',
        'ORIGINAL',
        'GI SYS SRL',
        'Vendedor: Ana Ventas',
        'Fecha pedido: 20/06/2026',
        'Sector: Alma Rosa',
        'Municipio/Provincia: Santo Domingo Este, Santo Domingo',
        '132619201',
        'Producto gravado',
        'Producto exento',
        'P001',
        'P002',
        '236.00',
        '50.00',
        'Monto gravado',
        'RD$200.00',
        'Monto exento',
        'ITBIS 18%',
        'RD$36.00',
        'Efectivo: RD$274.00',
        'NCF E340000000555: RD$12.00',
        'Total',
        'RD$286.00',
        'Fecha venc. e-NCF: 31/12/2026',
        'Fecha Firma Digital',
        '21/06/2026',
        'ABC123',
      ],
    });

    expect(
      paginated.container.querySelectorAll(
        '[data-print-pagination-pages] [data-print-block-role="product-line"]',
      ),
    ).toHaveLength(invoiceData.products?.length ?? 0);
    expect(
      paginated.container.querySelector('[data-print-section="ecf"]'),
    ).toBeInTheDocument();
    expect(paginatedText).toContain('Tel 2: 809-555-3333');
    expect(
      legacy.container.querySelector('img[alt="Logo del negocio"]'),
    ).toHaveAttribute('src', 'data:image/png;base64,logo');
    expect(
      paginated.container.querySelector('img[alt="Logo del negocio"]'),
    ).toHaveAttribute('src', 'data:image/png;base64,logo');
    expect(
      legacy.container.querySelector('img[alt="Firma del negocio"]'),
    ).toHaveAttribute('src', 'data:image/png;base64,signature');
    expect(
      paginated.container.querySelector('img[alt="Firma del negocio"]'),
    ).toHaveAttribute('src', 'data:image/png;base64,signature');
    expect(
      legacy.container.querySelector('img[alt="Sello del negocio"]'),
    ).toHaveAttribute('src', 'data:image/png;base64,stamp');
    expect(
      paginated.container.querySelector('img[alt="Sello del negocio"]'),
    ).toHaveAttribute('src', 'data:image/png;base64,stamp');
  }, 15_000);
});
