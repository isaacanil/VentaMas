import { beforeEach, describe, expect, it, vi } from 'vitest';

const workbookRegistry = vi.hoisted(() => ({
  instances: [] as Array<{
    creator?: string;
    created?: Date;
    worksheets: Array<{
      name: string;
      rows: Array<Record<string, unknown>>;
    }>;
  }>,
}));

const saveXlsxFileMock = vi.hoisted(() => vi.fn());

vi.mock('@/utils/export/xlsx', () => ({
  saveXlsxFile: saveXlsxFileMock,
}));

vi.mock('exceljs', () => {
  class MockCell {
    alignment?: unknown;
    border?: unknown;
    font?: unknown;
    value?: unknown;

    get text() {
      return this.value == null ? '' : String(this.value);
    }
  }

  class MockRow {
    alignment?: unknown;
    fill?: unknown;
    font?: unknown;
    height?: number;
    private cells = new Map<number, MockCell>();

    getCell(index: number) {
      const existingCell = this.cells.get(index);
      if (existingCell) return existingCell;

      const cell = new MockCell();
      this.cells.set(index, cell);
      return cell;
    }

    eachCell(callback: (cell: MockCell) => void) {
      this.cells.forEach((cell) => callback(cell));
    }
  }

  class Worksheet {
    autoFilter?: unknown;
    columns: Array<{
      alignment?: unknown;
      eachCell?: (
        options: { includeEmpty?: boolean },
        callback: (cell: { text: string }) => void,
      ) => void;
      header?: string;
      key?: string;
      numFmt?: string;
      width?: number;
    }> = [];
    rows: Array<Record<string, unknown>> = [];
    views?: unknown;
    private rowMap = new Map<number, MockRow>();

    constructor(public name: string) {}

    addRow(row: Record<string, unknown>) {
      this.rows.push(row);
      const mockRow = this.getRow(this.rows.length);
      this.columns.forEach((column, index) => {
        const key = column.key ?? column.header ?? '';
        mockRow.getCell(index + 1).value = row[key];
      });
      return mockRow;
    }

    getColumn(index: number) {
      const column = this.columns[index - 1] ?? {};
      this.columns[index - 1] = column;
      column.eachCell = (_options, callback) => {
        const key = column.key ?? column.header ?? '';
        const values = [
          column.header,
          ...this.rows.map((row) => (key ? row[key] : undefined)),
        ];

        values.forEach((value) => {
          if (value == null || value === '') return;
          callback({ text: String(value) });
        });
      };
      return column;
    }

    getRow(index: number) {
      const existingRow = this.rowMap.get(index);
      if (existingRow) return existingRow;

      const row = new MockRow();
      this.rowMap.set(index, row);
      return row;
    }

    mergeCells() {}

    spliceRows() {}
  }

  class Workbook {
    created?: Date;
    creator?: string;
    worksheets: Worksheet[] = [];
    xlsx = {
      writeBuffer: vi.fn(async () => new ArrayBuffer(8)),
    };

    constructor() {
      workbookRegistry.instances.push(this);
    }

    addWorksheet(name: string) {
      const worksheet = new Worksheet(name);
      this.worksheets.push(worksheet);
      return worksheet;
    }
  }

  return {
    Workbook,
    default: { Workbook },
  };
});

import type { Purchase } from '@/utils/purchase/types';
import type { VendorBill } from '@/domain/accountsPayable/vendorBills/types';

import {
  buildAccountsPayableRow,
  buildAccountsPayableSummary,
} from './accountsPayableDashboard';
import {
  buildAccountsPayableAgingExportRows,
  buildAccountsPayableCurrencyExportRows,
  buildAccountsPayableExportFileName,
  buildAccountsPayableExportRows,
  exportAccountsPayableWorkbook,
} from './accountsPayableExport';

const buildVendorBill = ({
  id = 'purchase-1',
  paymentState,
  purchase,
  vendorBill,
}: {
  id?: string;
  paymentState?: Record<string, unknown>;
  purchase?: Partial<Purchase>;
  vendorBill?: Partial<VendorBill>;
} = {}): VendorBill => {
  const resolvedPaymentState = (paymentState ?? {
    status: 'partial',
    total: 1180,
    paid: 180,
    balance: 1000,
    paymentCount: 1,
    nextPaymentAt: new Date('2026-04-15T10:00:00.000Z'),
  }) as VendorBill['paymentState'];

  return {
    id: `purchase:${id}`,
    reference: `PO-${id}`,
    status: 'partially_paid',
    approvalStatus: 'approved',
    sourceDocumentType: 'purchase',
    sourceDocumentId: id,
    supplierId: 'provider-1',
    supplierName: 'Proveedor Export',
    attachmentUrls: [{ id: 'file-1' }],
    accountingDate: new Date('2026-04-01T10:00:00.000Z'),
    dueAt: resolvedPaymentState?.nextPaymentAt ?? null,
    documentNature: 'expense',
    paymentTerms: {
      condition: 'thirty_days',
      expectedPaymentAt: resolvedPaymentState?.nextPaymentAt ?? null,
      nextPaymentAt: resolvedPaymentState?.nextPaymentAt ?? null,
    },
    paymentState: resolvedPaymentState,
    postedAt: new Date('2026-04-01T10:00:00.000Z'),
    settlementTiming: 'deferred',
    vendorReference: 'FAC-900',
    monetary: {
      documentCurrency: { code: 'USD' },
      fiscalTotals: {
        subtotal: 1000,
        taxAmount: 180,
        withholdingITBISAmount: 18,
        withholdingISRAmount: 10,
        netPayableAmount: 1152,
      },
      functionalCurrency: { code: 'DOP' },
      exchangeRateSnapshot: {
        rate: 58.5,
      },
    },
    ...vendorBill,
    purchase: {
      id,
      numberId: `PO-${id}`,
      workflowStatus: 'completed',
      completedAt: new Date('2026-04-01T10:00:00.000Z'),
      documentType: 'valid_fiscal_credit',
      taxReceipt: {
        ncf: 'B0100009999',
      },
      classification: {
        dgii606ExpenseType: '02',
      },
      ...purchase,
      ...vendorBill?.purchase,
    } as Purchase,
  };
};

describe('accountsPayableExport', () => {
  beforeEach(() => {
    workbookRegistry.instances.length = 0;
    saveXlsxFileMock.mockClear();
  });

  it('builds a stable workbook filename from generation time', () => {
    expect(
      buildAccountsPayableExportFileName(new Date('2026-04-05T13:45:00.000Z')),
    ).toBe('cuentas_por_pagar_20260405_1345.xlsx');
  });

  it('maps visible accounts payable rows into export-ready fiscal rows', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill(),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(buildAccountsPayableExportRows([row])).toEqual([
      expect.objectContaining({
        Compra: 'PO-purchase-1',
        Proveedor: 'Proveedor Export',
        Condicion: '30 días',
        Vencimiento: '15/04/2026',
        Control: 'Aprobada',
        Total: 1180,
        Pagado: 180,
        Balance: 1000,
        'Moneda documento': 'USD',
        'Moneda funcional': 'DOP',
        'Contexto moneda': 'USD -> DOP',
        'Tasa cambio': 58.5,
        Pagos: 1,
        Evidencias: 1,
        NCF: 'B0100009999',
        'Factura proveedor': 'FAC-900',
        'Tipo documento': 'valid_fiscal_credit',
        'Tipo gasto DGII': '02',
        'Fecha factura': '01/04/2026',
        'Estado contable': 'Contabilizada',
        'Fecha contable': '01/04/2026',
        'Posteo operativo': '01/04/2026',
        'Naturaleza contable': 'Gasto',
        'Liquidacion contable': 'Diferida',
        Subtotal: 1000,
        ITBIS: 180,
        'Retencion ITBIS': 18,
        'Retencion ISR': 10,
        'Neto fiscal': 1152,
      }),
    ]);
  });

  it('builds aging summary export rows with a total row', () => {
    const rows = [
      buildAccountsPayableRow(
        buildVendorBill({ id: 'current' }),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
      buildAccountsPayableRow(
        buildVendorBill({
          id: 'overdue',
          paymentState: {
            status: 'partial',
            total: 500,
            paid: 0,
            balance: 500,
            nextPaymentAt: new Date('2026-03-15T10:00:00.000Z'),
          },
        }),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
    ];
    const summary = buildAccountsPayableSummary(rows);

    expect(buildAccountsPayableAgingExportRows(summary)).toEqual([
      { Bucket: 'Al día', Cuentas: 1, Balance: 1000 },
      { Bucket: 'Vencido 1-30', Cuentas: 1, Balance: 500 },
      { Bucket: 'Vencido 31-60', Cuentas: 0, Balance: 0 },
      { Bucket: 'Vencido 61+', Cuentas: 0, Balance: 0 },
      { Bucket: 'Sin fecha', Cuentas: 0, Balance: 0 },
      { Bucket: 'Total', Cuentas: 2, Balance: 1500 },
    ]);
  });

  it('builds currency summary rows without mixing document currencies', () => {
    const rows = buildAccountsPayableExportRows([
      buildAccountsPayableRow(
        buildVendorBill(),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
      buildAccountsPayableRow(
        buildVendorBill({
          id: 'dop',
          vendorBill: {
            monetary: {
              documentCurrency: { code: 'DOP' },
              fiscalTotals: {
                netPayableAmount: 500,
              },
              functionalCurrency: { code: 'DOP' },
            },
            paymentState: {
              status: 'partial',
              total: 500,
              paid: 100,
              balance: 400,
            },
          },
        }),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
    ]);

    expect(buildAccountsPayableCurrencyExportRows(rows)).toEqual([
      {
        'Moneda documento': 'USD',
        'Moneda funcional': 'DOP',
        Cuentas: 1,
        Total: 1180,
        Pagado: 180,
        Balance: 1000,
        'Neto fiscal': 1152,
      },
      {
        'Moneda documento': 'DOP',
        'Moneda funcional': 'DOP',
        Cuentas: 1,
        Total: 500,
        Pagado: 100,
        Balance: 400,
        'Neto fiscal': 500,
      },
    ]);
  });

  it('keeps mixed-currency detail totals out of the main totals row', async () => {
    const generatedAt = new Date('2026-04-05T13:45:00.000Z');
    const rows = [
      buildAccountsPayableRow(
        buildVendorBill(),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
      buildAccountsPayableRow(
        buildVendorBill({
          id: 'dop',
          vendorBill: {
            monetary: {
              documentCurrency: { code: 'DOP' },
              fiscalTotals: {
                netPayableAmount: 500,
              },
              functionalCurrency: { code: 'DOP' },
            },
            paymentState: {
              status: 'partial',
              total: 500,
              paid: 100,
              balance: 400,
            },
          },
        }),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
    ];

    await exportAccountsPayableWorkbook({ generatedAt, rows });

    const workbook = workbookRegistry.instances[0];
    const detailsSheet = workbook.worksheets.find(
      (worksheet) => worksheet.name === 'CxP visible',
    );
    const totalsRow = detailsSheet?.rows.at(-1);

    expect(totalsRow).toMatchObject({
      Compra: 'TOTALES',
      Total: '',
      Pagado: '',
      Balance: '',
      'Contexto moneda': 'Totales por moneda en hoja separada',
      'Neto fiscal': '',
    });
  });

  it('adds export scope metadata to the generated workbook', async () => {
    const generatedAt = new Date('2026-04-05T13:45:00.000Z');
    const row = buildAccountsPayableRow(
      buildVendorBill(),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    await exportAccountsPayableWorkbook({
      generatedAt,
      rows: [row],
      scope: {
        description:
          '1 cuenta visible con los filtros actuales. Consulta acotada.',
        isClientFilteredQuery: true,
        isQueryLimitReached: true,
        label: 'Lote visible',
        queryLimit: 500,
        queryLimitMax: 1500,
        rawDocCount: 500,
      },
    });

    const workbook = workbookRegistry.instances[0];
    const scopeSheet = workbook.worksheets.find(
      (worksheet) => worksheet.name === 'Alcance CxP',
    );
    const scopeValues = Object.fromEntries(
      (scopeSheet?.rows ?? []).map((scopeRow) => [
        scopeRow.Campo,
        scopeRow.Valor,
      ]),
    );

    expect(workbook.worksheets.map((worksheet) => worksheet.name)).toEqual([
      'Alcance CxP',
      'CxP visible',
      'Resumen moneda',
      'Resumen aging',
    ]);
    expect(
      workbook.worksheets.find((worksheet) => worksheet.name === 'Resumen moneda')
        ?.rows,
    ).toEqual([
      expect.objectContaining({
        'Moneda documento': 'USD',
        'Moneda funcional': 'DOP',
        Balance: 1000,
        Cuentas: 1,
      }),
    ]);
    expect(scopeValues).toMatchObject({
      Alcance: 'Lote visible',
      'Consulta acotada': 'Si',
      Descripcion:
        '1 cuenta visible con los filtros actuales. Consulta acotada.',
      Generado: expect.stringContaining('2026'),
      'Limite de consulta': 500,
      'Maximo operativo': 1500,
      'Modo compatibilidad': 'Si',
      'Registros exportados': 1,
      'Registros leidos': 500,
    });
    expect(saveXlsxFileMock).toHaveBeenCalledWith({
      content: expect.any(ArrayBuffer),
      fileName: 'cuentas_por_pagar_20260405_1345.xlsx',
    });
  });
});
