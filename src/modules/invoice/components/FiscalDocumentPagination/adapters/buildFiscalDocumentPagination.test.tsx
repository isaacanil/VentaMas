import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  buildCreditNotePrintDocumentModel,
  buildDebitNotePrintDocumentModel,
  buildInvoicePrintDocumentModel,
} from '@/modules/invoice/printPagination';

import { buildFiscalDocumentPagination } from './buildFiscalDocumentPagination';

const business = {
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
      signature: { offsetX: 4, offsetY: -3, scale: 1.1 },
      signatureUrl: 'data:image/png;base64,signature',
      stamp: { offsetX: -5, offsetY: 2, opacity: 0.75, scale: 0.9 },
      stampUrl: 'data:image/png;base64,stamp',
    },
  },
  logoUrl: 'data:image/png;base64,logo',
  name: 'VentaMas Demo SRL',
  rnc: '132000001',
  tel: '809-555-0101',
};

const buildInvoiceModel = () =>
  buildInvoicePrintDocumentModel({
    business,
    data: {
      id: 'invoice-1',
      numberID: 1042,
      NCF: 'E310000000123',
      date: '2026-06-21',
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
      invoiceComment: 'Gracias por su compra, vuelva pronto.',
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
        dgiiTrackId: 'TRACK-123',
        officialVerifyUrl: 'https://ecf.dgii.gov.do/testecf/consulta?id=1',
        dgiiValidationStatus: 'accepted',
      },
    },
  });

describe('buildFiscalDocumentPagination', () => {
  it('turns the document model into stable atomic page blocks', () => {
    const adapter = buildFiscalDocumentPagination(buildInvoiceModel());

    expect(adapter.blocks.map((block) => block.id)).toEqual([
      'product-line-1-product-1',
      'product-line-2-product-2',
    ]);

    render(<>{adapter.blocks[0].content}</>);

    const firstLine = document.querySelector(
      '[data-print-block-id="product-line-1-product-1"]',
    );
    expect(firstLine).toBeInTheDocument();

    const row = within(firstLine as HTMLElement);
    expect(row.getByText('2')).toBeInTheDocument();
    expect(row.getByText('P001')).toBeInTheDocument();
    expect(row.getByText('Producto gravado')).toBeInTheDocument();
    expect(row.queryByText('Indicador: Exento')).not.toBeInTheDocument();
    expect(row.getByText('100.00')).toBeInTheDocument();
    expect(row.getByText('-')).toBeInTheDocument();
    expect(row.getByText('18.00')).toBeInTheDocument();
    expect(row.getByText('236.00')).toBeInTheDocument();
    expect(row.queryByText(/RD\$/)).not.toBeInTheDocument();
  });

  it('omits the generic fiscal indicator column and marks only exempt lines', () => {
    const adapter = buildFiscalDocumentPagination(buildInvoiceModel());

    render(
      <>
        {adapter.renderHeader({
          isFirstPage: true,
          isLastPage: true,
          pageBlockCount: 2,
          pageNumber: 1,
          totalPages: 1,
        })}
        {adapter.blocks.map((block) => block.content)}
      </>,
    );

    expect(screen.queryByText('Ind.')).not.toBeInTheDocument();

    const rows = document.querySelectorAll('[data-print-block-role="product-line"]');
    expect(rows).toHaveLength(2);
    expect(
      within(rows[0] as HTMLElement).queryByText('Indicador: Exento'),
    ).not.toBeInTheDocument();
    expect(
      within(rows[1] as HTMLElement).getByText('Indicador: Exento'),
    ).toBeInTheDocument();
  });

  it('repeats the client chrome on continuation pages', () => {
    const adapter = buildFiscalDocumentPagination(buildInvoiceModel());

    const firstHeader = adapter.renderHeader({
      isFirstPage: true,
      isLastPage: false,
      pageBlockCount: 2,
      pageNumber: 1,
      totalPages: 2,
    });
    const { rerender } = render(firstHeader);

    expect(screen.getByText('VentaMas Demo SRL')).toBeInTheDocument();
    expect(screen.getByAltText('Logo del negocio')).toHaveAttribute(
      'src',
      'data:image/png;base64,logo',
    );
    expect(screen.getByAltText('Logo del negocio')).toHaveAttribute(
      'data-print-optional-image',
      'true',
    );
    expect(screen.getByText('Sucursal: Sucursal Central')).toBeInTheDocument();
    expect(screen.getByText('Sector: Piantini')).toBeInTheDocument();
    expect(
      screen.getByText('Municipio/Provincia: Santo Domingo, Distrito Nacional'),
    ).toBeInTheDocument();
    expect(screen.getByText('Cliente: GI SYS SRL')).toBeInTheDocument();
    expect(screen.getByText('Tel 2: 809-555-3333')).toBeInTheDocument();
    expect(screen.getByText('Vendedor: Ana Ventas')).toBeInTheDocument();
    expect(screen.getByText('Fecha pedido: 20/06/2026')).toBeInTheDocument();
    expect(screen.getByText('Sector: Alma Rosa')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Municipio/Provincia: Santo Domingo Este, Santo Domingo',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Pagina 1 de 2')).toBeInTheDocument();
    expect(
      screen.getByText('Fecha venc. e-NCF: 31/12/2026'),
    ).toBeInTheDocument();
    expect(screen.getByText('Descripcion')).toBeInTheDocument();
    expect(screen.queryByText('Ind.')).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-print-section="header-divider"]'),
    ).toBeInTheDocument();
    expect(screen.getByText('Montos expresados en RD$')).toBeInTheDocument();

    rerender(
      adapter.renderHeader({
        isFirstPage: false,
        isLastPage: true,
        pageBlockCount: 1,
        pageNumber: 2,
        totalPages: 2,
      }),
    );

    expect(screen.getByText('Cliente: GI SYS SRL')).toBeInTheDocument();
    expect(
      screen.getByText('Direccion: Calle Principal 2'),
    ).toBeInTheDocument();
    expect(screen.getByText('Tel 2: 809-555-3333')).toBeInTheDocument();
    expect(screen.getByText('RNC/Cedula: 132619201')).toBeInTheDocument();
    expect(screen.getByText('Vendedor: Ana Ventas')).toBeInTheDocument();
    expect(screen.getByText('Fecha pedido: 20/06/2026')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Municipio/Provincia: Santo Domingo Este, Santo Domingo',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Continuacion de Factura #1042'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Pagina 2 de 2')).toBeInTheDocument();
  });

  it('repeats the full dynamic footer on every page', () => {
    const adapter = buildFiscalDocumentPagination(buildInvoiceModel());

    const middleFooter = adapter.renderFooter({
      isFirstPage: true,
      isLastPage: false,
      pageBlockCount: 2,
      pageNumber: 1,
      totalPages: 2,
    });
    const { rerender } = render(middleFooter);

    expect(
      screen.queryByText('Este documento continua en la pagina siguiente.'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('ORIGINAL')).toBeInTheDocument();
    expect(screen.getByText('Pagina 1 de 2')).toBeInTheDocument();
    expect(screen.getByText('Despachado Por:')).toBeInTheDocument();
    expect(screen.getByText('Recibido Conforme:')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'QR e-CF' })).toHaveAttribute(
      'width',
      '90',
    );
    expect(screen.getByText('Total')).toBeInTheDocument();

    rerender(
      adapter.renderFooter({
        isFirstPage: false,
        isLastPage: true,
        pageBlockCount: 1,
        pageNumber: 2,
        totalPages: 2,
      }),
    );

    expect(screen.getByText('Despachado Por:')).toBeInTheDocument();
    expect(screen.getByText('Recibido Conforme:')).toBeInTheDocument();
    expect(screen.getByAltText('Firma del negocio')).toHaveAttribute(
      'src',
      'data:image/png;base64,signature',
    );
    expect(screen.getByAltText('Firma del negocio')).toHaveAttribute(
      'data-print-optional-image',
      'true',
    );
    expect(screen.getByAltText('Sello del negocio')).toHaveAttribute(
      'src',
      'data:image/png;base64,stamp',
    );
    expect(screen.getByAltText('Sello del negocio')).toHaveAttribute(
      'data-print-optional-image',
      'true',
    );
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('21/06/2026')).toBeInTheDocument();
    expect(screen.queryByText('E310000000123')).not.toBeInTheDocument();
    expect(screen.queryByText('TRACK-123')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'QR e-CF' })).toHaveAttribute(
      'width',
      '90',
    );
    const ecfBlock = screen
      .getByRole('img', { name: 'QR e-CF' })
      .closest('[data-print-section="ecf"]');
    expect(ecfBlock).toBeInTheDocument();
    expect(
      ecfBlock?.previousElementSibling?.getAttribute('data-print-section'),
    ).toBe('summary');
    expect(screen.queryByText('Resumen final')).not.toBeInTheDocument();
    expect(screen.getByText('Pagos aplicados')).toBeInTheDocument();
    expect(screen.getByText('Efectivo: RD$274.00')).toBeInTheDocument();
    expect(screen.getByText('NCF E340000000555: RD$12.00')).toBeInTheDocument();
    const paymentsBlock = screen
      .getByText('Pagos aplicados')
      .closest('[data-print-section="payments"]');
    expect(paymentsBlock).toBeInTheDocument();
    expect(
      paymentsBlock?.previousElementSibling?.getAttribute('data-print-section'),
    ).toBe('signatures');
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Notas')).toBeInTheDocument();
    const notesText = screen.getByText('Gracias por su compra, vuelva pronto.');
    expect(notesText).toBeInTheDocument();
    const notesBlock = notesText.closest('[data-print-section="notes"]');
    expect(notesBlock).toBeInTheDocument();
    expect(notesText.closest('[data-print-section="summary"]')).toBeNull();
    expect(
      notesBlock?.previousElementSibling?.getAttribute('data-print-section'),
    ).toBe('payments');
    expect(
      screen.queryByText('https://ecf.dgii.gov.do/testecf/consulta?id=1'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Consulte la validez fiscal escaneando el QR.'),
    ).not.toBeInTheDocument();
  });

  it('supports credit-note models without depending on the legacy PDF path', () => {
    const adapter = buildFiscalDocumentPagination(
      buildCreditNotePrintDocumentModel({
        business,
        note: {
          id: 'credit-1',
          numberID: 12,
          eNcf: 'E340000000001',
          client: { name: 'GI SYS SRL', rnc: '132619201' },
          invoiceNcf: 'E310000000001',
          modificationCode: '3',
          reason: 'Devolucion parcial',
          totalAmount: 118,
          items: [
            {
              id: 'line-1',
              name: 'Producto devuelto',
              amountToBuy: 1,
              pricing: { price: 100, tax: 18 },
            },
          ],
        },
      }),
    );

    expect(adapter.blocks.map((block) => block.id)).toEqual([
      'product-line-1-line-1',
    ]);

    render(
      adapter.renderHeader({
        isFirstPage: true,
        isLastPage: true,
        pageBlockCount: 3,
        pageNumber: 1,
        totalPages: 1,
      }),
    );

    expect(screen.getByText('NOTA DE CRÉDITO ELECTRÓNICA')).toBeInTheDocument();
    expect(
      screen.getByText('Documento afectado: E310000000001'),
    ).toBeInTheDocument();
  });

  it('supports debit-note models with synthetic printable lines', () => {
    const adapter = buildFiscalDocumentPagination(
      buildDebitNotePrintDocumentModel({
        business,
        note: {
          id: 'debit-1',
          numberID: 15,
          invoiceNumber: 720,
          reason: 'Ajuste de precio',
          taxAmount: 18,
          totalAmount: 118,
          electronicTaxReceipt: {
            documentType: 'E33',
            eNcf: 'E330000000001',
          },
          items: [],
        },
      }),
    );

    expect(adapter.blocks.map((block) => block.id)).toEqual([
      'product-line-1-debitnote-debit-1',
    ]);

    render(<>{adapter.blocks[0].content}</>);

    expect(
      screen.getByText('Nota de débito: Ajuste de precio'),
    ).toBeInTheDocument();
    expect(screen.getByText('118.00')).toBeInTheDocument();
  });
});
