import { describe, expect, it, vi } from 'vitest';

import {
  createImageLightboxSlides,
  createRemoteAttachmentId,
  getFilePreviewSource,
  getImageLightboxIndex,
  isFirebaseStorageUrl,
  normalizeFirebaseRemoteAttachments,
  revokeLocalPreviewUrls,
} from './previewUtils';

const FIREBASE_PDF_URL =
  'https://firebasestorage.googleapis.com/v0/b/app/o/factura.pdf?alt=media';
const FIREBASE_IMAGE_URL =
  'https://firebasestorage.googleapis.com/v0/b/app/o/evidencias%2Ffoto.png?alt=media';

describe('file upload preview utils', () => {
  it('normalizes remote Firebase attachments and preview sources', () => {
    expect(
      isFirebaseStorageUrl(
        'https://firebasestorage.googleapis.com/v0/b/app/o/file.pdf',
      ),
    ).toBe(true);
    expect(isFirebaseStorageUrl('https://example.com/file.pdf')).toBe(false);
    expect(
      createRemoteAttachmentId(
        { name: 'factura.pdf', url: 'https://example.com/factura.pdf' },
        2,
      ),
    ).toBe('https://example.com/factura.pdf');
    expect(createRemoteAttachmentId({ name: 'factura.pdf' }, 2)).toBe(
      'factura.pdf-2',
    );
    expect(
      getFilePreviewSource({
        name: 'imagen.png',
        preview: 'blob:local-preview',
        url: 'https://remote/image.png',
      }),
    ).toBe('blob:local-preview');
  });

  it('normalizes remote Firebase attachments for preview lists', () => {
    const remoteFiles = normalizeFirebaseRemoteAttachments(
      [
        {
          id: 'remote-id',
          name: 'factura.pdf',
          type: 'invoice',
          url: FIREBASE_PDF_URL,
        },
        { url: FIREBASE_IMAGE_URL },
        {
          name: 'externo.pdf',
          type: 'document',
          url: 'https://example.com/externo.pdf',
        },
      ],
      {
        fallbackName: 'Archivo sin nombre',
        fallbackType: 'document',
      },
    );

    expect(remoteFiles).toEqual([
      {
        id: 'remote-id',
        name: 'factura.pdf',
        type: 'invoice',
        url: FIREBASE_PDF_URL,
        isLocal: false,
        preview: null,
      },
      {
        id: FIREBASE_IMAGE_URL,
        name: 'Archivo sin nombre',
        type: 'document',
        url: FIREBASE_IMAGE_URL,
        isLocal: false,
        preview: null,
      },
    ]);
  });

  it('supports fallback URLs for Firebase remote attachments', () => {
    expect(
      normalizeFirebaseRemoteAttachments(
        [{ name: 'archivo-fallback.pdf' }],
        {
          fallbackType: 'invoice',
          fallbackUrl: FIREBASE_PDF_URL,
        },
      ),
    ).toEqual([
      {
        id: FIREBASE_PDF_URL,
        name: 'archivo-fallback.pdf',
        type: 'invoice',
        url: FIREBASE_PDF_URL,
        isLocal: false,
        preview: null,
      },
    ]);
  });

  it('builds image lightbox slides and finds the matching index', () => {
    const slides = createImageLightboxSlides([
      { name: 'factura.pdf', url: 'https://example.com/factura.pdf' },
      { name: 'foto.png', preview: 'blob:foto', type: 'receipts' },
      { name: 'logo.jpg', url: 'https://example.com/logo.jpg', type: 'image' },
    ]);

    expect(slides).toEqual([
      {
        src: 'blob:foto',
        title: 'foto.png',
        description: 'Tipo: receipts',
      },
      {
        src: 'https://example.com/logo.jpg',
        title: 'logo.jpg',
        description: 'Tipo: image',
      },
    ]);
    expect(
      getImageLightboxIndex(slides, {
        name: 'logo.jpg',
        url: 'https://example.com/logo.jpg',
      }),
    ).toBe(1);
    expect(getImageLightboxIndex(slides, { name: 'missing.png' })).toBe(0);
  });

  it('revokes only local preview urls', () => {
    const revokeUrl = vi.fn();

    revokeLocalPreviewUrls(
      [
        { name: 'local.png', isLocal: true, preview: 'blob:local' },
        { name: 'remote.png', isLocal: false, preview: 'blob:remote' },
        { name: 'empty.png', isLocal: true, preview: null },
      ],
      revokeUrl,
    );

    expect(revokeUrl).toHaveBeenCalledTimes(1);
    expect(revokeUrl).toHaveBeenCalledWith('blob:local');
  });
});
