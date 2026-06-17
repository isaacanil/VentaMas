import { describe, expect, it } from 'vitest';

import { escapeHtml, sanitizeMailHeader } from './emailContent.util.js';

describe('emailContent.util', () => {
  it('escapes HTML-sensitive characters', () => {
    expect(escapeHtml('<span title="Ana & Luis">Plan premium\'s</span>')).toBe(
      '&lt;span title=&quot;Ana &amp; Luis&quot;&gt;Plan premium&#39;s&lt;/span&gt;',
    );
  });

  it('returns an empty string for nullish HTML values', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('removes CRLF sequences from mail headers', () => {
    expect(sanitizeMailHeader('  Alerta\r\nBajo\nInventario\rProducto  ')).toBe(
      'Alerta Bajo Inventario Producto',
    );
  });

  it('preserves non-nullish falsy values in mail headers', () => {
    expect(sanitizeMailHeader(0)).toBe('0');
    expect(sanitizeMailHeader(false)).toBe('false');
  });
});
