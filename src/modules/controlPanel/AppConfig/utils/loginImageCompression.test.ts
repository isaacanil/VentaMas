import { describe, expect, it } from 'vitest';

import { resolveUploadFile } from './loginImageCompression';

const buildFile = (size: number, name: string) =>
  new File([new Uint8Array(size)], name, { type: 'image/png' });

describe('loginImageCompression', () => {
  it('usa el archivo comprimido solo cuando reduce tamano', () => {
    const originalFile = buildFile(100, 'original.png');
    const smallerFile = buildFile(50, 'smaller.png');
    const largerFile = buildFile(120, 'larger.png');

    expect(resolveUploadFile(smallerFile, originalFile)).toBe(smallerFile);
    expect(resolveUploadFile(largerFile, originalFile)).toBe(originalFile);
  });
});
