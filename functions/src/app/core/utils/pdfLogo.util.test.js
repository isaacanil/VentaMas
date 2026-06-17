import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchLogoDataUri, isAllowedLogoUrl } from './pdfLogo.util.js';

const allowedLogoUrl =
  'https://firebasestorage.googleapis.com/v0/b/demo/o/logo.png?alt=media';

const createResponse = ({
  ok = true,
  statusText = 'OK',
  contentType = 'image/png',
  contentLength,
  body = Uint8Array.from([1, 2, 3]).buffer,
} = {}) => {
  const arrayBuffer = vi.fn(async () => body);
  return {
    ok,
    statusText,
    headers: {
      get: (name) => {
        const key = name.toLowerCase();
        if (key === 'content-type') return contentType;
        if (key === 'content-length') return contentLength;
        return null;
      },
    },
    arrayBuffer,
  };
};

describe('pdfLogo.util', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('allows only https Firebase Storage logo URLs', () => {
    expect(isAllowedLogoUrl(allowedLogoUrl)).toBe(true);
    expect(isAllowedLogoUrl('https://storage.googleapis.com/demo/logo.png')).toBe(
      true,
    );
    expect(isAllowedLogoUrl('http://firebasestorage.googleapis.com/logo.png')).toBe(
      false,
    );
    expect(isAllowedLogoUrl('https://example.com/logo.png')).toBe(false);
    expect(isAllowedLogoUrl('not-a-url')).toBe(false);
  });

  it('returns null before fetching disallowed URLs', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchLogoDataUri('https://example.com/logo.png')).resolves.toBe(
      null,
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a base64 data URI for supported image responses', async () => {
    const fetchMock = vi.fn(async () =>
      createResponse({
        contentType: 'image/jpeg; charset=binary',
        body: Uint8Array.from([65, 66, 67]).buffer,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchLogoDataUri(allowedLogoUrl)).resolves.toBe(
      'data:image/jpeg;base64,QUJD',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      allowedLogoUrl,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('rejects unsupported MIME types', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => createResponse({ contentType: 'image/svg+xml' })),
    );

    await expect(fetchLogoDataUri(allowedLogoUrl)).rejects.toThrow(
      /Unsupported logo content type/,
    );
  });

  it('rejects failed HTTP responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => createResponse({ ok: false, statusText: 'Forbidden' })),
    );

    await expect(fetchLogoDataUri(allowedLogoUrl)).rejects.toThrow(
      /Failed to fetch logo: Forbidden/,
    );
  });

  it('rejects logos larger than the allowed size', async () => {
    const tooLargeBody = new Uint8Array(1_000_001).buffer;
    const response = createResponse({ body: tooLargeBody });
    vi.stubGlobal('fetch', vi.fn(async () => response));

    await expect(fetchLogoDataUri(allowedLogoUrl)).rejects.toThrow(
      /maximum allowed size/,
    );
  });

  it('rejects logos whose content-length is already too large', async () => {
    const response = createResponse({ contentLength: '1000001' });
    vi.stubGlobal('fetch', vi.fn(async () => response));

    await expect(fetchLogoDataUri(allowedLogoUrl)).rejects.toThrow(
      /maximum allowed size/,
    );
    expect(response.arrayBuffer).not.toHaveBeenCalled();
  });
});
