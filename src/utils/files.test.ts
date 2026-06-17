import { describe, expect, it } from 'vitest';

import {
  getFileExtension,
  getFileTypeFromUrl,
  isImageFile,
  isPdfFile,
} from './files';

describe('file utilities', () => {
  it('resolves file extensions from names, optional values and Firebase URLs', () => {
    expect(getFileExtension('products.CSV')).toBe('csv');
    expect(getFileExtension('invoice.PDF', { includeDot: true })).toBe('.pdf');
    expect(getFileExtension(null)).toBe('');
    expect(getFileExtension(null, { includeDot: true })).toBe('');
    expect(getFileExtension(undefined)).toBe('');
    expect(
      getFileExtension(
        'https://firebasestorage.googleapis.com/v0/b/demo/o/uploads%2Ffactura.PDF?alt=media',
      ),
    ).toBe('pdf');
    expect(
      getFileExtension(
        'https://firebasestorage.googleapis.com/v0/b/demo/o/uploads%2Ffactura.PDF?alt=media',
        { includeDot: true },
      ),
    ).toBe('.pdf');
  });

  it('classifies common image and pdf file names', () => {
    expect(isImageFile('avatar.PNG')).toBe(true);
    expect(isImageFile('document.pdf')).toBe(false);
    expect(isPdfFile('document.PDF')).toBe(true);
    expect(getFileTypeFromUrl('document.pdf')).toBe('pdf');
    expect(getFileTypeFromUrl('avatar.jpg')).toBe('image');
    expect(getFileTypeFromUrl('archive.zip')).toBe('other');
  });
});
