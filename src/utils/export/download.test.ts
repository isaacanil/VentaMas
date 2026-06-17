import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TEXT_MIME_TYPE, downloadBlobFile, downloadTextFile } from './download';

const readBlobText = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      resolve(String(reader.result ?? ''));
    });
    reader.addEventListener('error', () => {
      reject(reader.error ?? new Error('No se pudo leer el Blob.'));
    });
    reader.readAsText(blob);
  });

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

const restoreUrlFunction = (
  name: 'createObjectURL' | 'revokeObjectURL',
  value: unknown,
) => {
  if (typeof value === 'function') {
    Object.defineProperty(URL, name, {
      configurable: true,
      value,
    });
    return;
  }

  Reflect.deleteProperty(URL, name);
};

describe('download helpers', () => {
  const createObjectURLMock = vi.fn();
  const revokeObjectURLMock = vi.fn();
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURLMock.mockReturnValue('blob:ventamas-export');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURLMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURLMock,
    });
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreUrlFunction('createObjectURL', originalCreateObjectURL);
    restoreUrlFunction('revokeObjectURL', originalRevokeObjectURL);
    createObjectURLMock.mockReset();
    revokeObjectURLMock.mockReset();
    document.body.innerHTML = '';
  });

  it('downloads a blob through an object URL and revokes it', () => {
    const blob = new Blob(['id,name'], { type: 'text/csv;charset=utf-8;' });

    downloadBlobFile({ blob, fileName: 'export.csv' });

    expect(createObjectURLMock).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:ventamas-export');
    expect(document.body.querySelector('a')).toBeNull();
  });

  it('downloads text as a UTF-8 plain text blob', async () => {
    downloadTextFile({
      text: 'linea 1',
      fileName: 'dgii.txt',
    });

    const [blob] = createObjectURLMock.mock.calls[0] as [Blob];
    expect(blob.type).toBe(TEXT_MIME_TYPE);
    await expect(readBlobText(blob)).resolves.toBe('linea 1');
  });
});
