import { saveAs } from 'file-saver';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createXlsxBlob, saveXlsxFile } from './xlsx';

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

describe('xlsx export helpers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates workbook blobs with the shared xlsx mime type', () => {
    const blob = createXlsxBlob(new ArrayBuffer(0));

    expect(blob.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('saves workbook content with the requested file name', () => {
    const content = new Uint8Array([1, 2, 3]).buffer;

    saveXlsxFile({
      content,
      fileName: 'reporte.xlsx',
    });

    const saveAsMock = vi.mocked(saveAs);
    expect(saveAsMock).toHaveBeenCalledTimes(1);

    const [blob, fileName] = saveAsMock.mock.calls[0] as [Blob, string];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(fileName).toBe('reporte.xlsx');
  });
});
