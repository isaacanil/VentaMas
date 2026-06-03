import { describe, expect, it } from 'vitest';

import { buildPinDetailsPrintContent } from './printPinDetails';

describe('buildPinDetailsPrintContent', () => {
  it('escapes dynamic text before writing printable HTML', () => {
    const html = buildPinDetailsPrintContent({
      displayName: '<img src=x onerror="alert(1)">',
      pinEntries: [
        {
          module: 'custom',
          moduleName: '<script>alert("module")</script>',
          pin: `12'34<56>`,
          createdAt: null,
          expiresAt: null,
        },
      ],
    });

    expect(html).toContain(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
    );
    expect(html).toContain(
      '&lt;script&gt;alert(&quot;module&quot;)&lt;/script&gt;',
    );
    expect(html).toContain('12&#39;34&lt;56&gt;');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>alert');
  });
});
