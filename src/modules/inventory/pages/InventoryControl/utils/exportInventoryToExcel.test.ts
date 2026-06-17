import { beforeEach, describe, expect, it, vi } from 'vitest';

const workbookRegistry = vi.hoisted(() => ({
  instances: [] as Array<{
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
  class Worksheet {
    columns: unknown[] = [];
    rows: Array<Record<string, unknown>> = [];

    constructor(public name: string) {}

    addRow(row: Record<string, unknown>) {
      this.rows.push(row);
      return row;
    }

    getRow() {
      return {};
    }
  }

  class Workbook {
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

  return { Workbook };
});

import { exportInventoryToExcel } from './exportInventoryToExcel';

describe('exportInventoryToExcel', () => {
  beforeEach(() => {
    workbookRegistry.instances.length = 0;
    saveXlsxFileMock.mockClear();
  });

  it('builds summary metrics from exported inventory rows', async () => {
    await exportInventoryToExcel(
      [
        {
          productName: 'Producto A',
          _children: [
            {
              key: 'lot-1',
              type: 'batch',
              batchNumberId: 'L-1',
              expirationDate: '2026-06-30',
              stock: 10,
              locations: [{ locationLabel: 'Almacen', quantity: 10 }],
            },
            {
              key: 'lot-2',
              type: 'batch',
              batchNumberId: 'L-2',
              expirationDate: { seconds: 1_782_864_000 },
              stock: 5,
              real: 5,
              locations: [],
            },
            {
              key: 'total-row',
              type: 'batch',
              rowType: 'total',
              stock: 99,
              real: 99,
              locations: [],
            },
          ],
        },
      ],
      { filename: 'conteo', addSummarySheet: true },
      {
        'lot-1': {
          manualExpirationDate: '2026-07-01',
          updatedAt: '2026-06-15T10:30:00.000Z',
          updatedByName: 'Ana',
        },
      },
      { 'lot-1': 8 },
      { id: 'session-1', name: 'Conteo Junio' },
    );

    const workbook = workbookRegistry.instances[0];
    const detail = workbook.worksheets.find(
      (worksheet) => worksheet.name === 'Inventario',
    );
    const summary = workbook.worksheets.find(
      (worksheet) => worksheet.name === 'Resumen',
    );
    const summaryValues = Object.fromEntries(
      (summary?.rows ?? []).map((row) => [row.metric, row.value]),
    );

    expect(detail?.rows).toEqual([
      expect.objectContaining({
        productName: 'Producto A',
        batchNumberId: 'L-1',
        expirationDate: '2026-06-30',
        stockSistema: 10,
        conteoReal: 8,
        diferencia: -2,
        manualExpirationDate: '2026-07-01',
        updatedByName: 'Ana',
        updatedAt: '2026-06-15 06:30',
      }),
      expect.objectContaining({
        productName: 'Producto A',
        batchNumberId: 'L-2',
        stockSistema: 5,
        conteoReal: 5,
        diferencia: 0,
        hasManualExp: 'No',
      }),
    ]);
    expect(summaryValues).toMatchObject({
      'Productos con filas': 1,
      'Filas (detalle)': 2,
      'Filas con diferencia': 1,
      'Stock Sistema (suma)': 15,
      'Conteo Real (suma)': 13,
      'Diferencia Total': -2,
      'Filas con fecha manual': 1,
      'Dif. Positivas (filas)': 0,
      'Dif. Negativas (filas)': 1,
      'Session ID': 'session-1',
    });
    expect(saveXlsxFileMock).toHaveBeenCalledWith({
      content: expect.any(ArrayBuffer),
      fileName: expect.stringMatching(
        /^conteo_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.xlsx$/,
      ),
    });
  });
});
