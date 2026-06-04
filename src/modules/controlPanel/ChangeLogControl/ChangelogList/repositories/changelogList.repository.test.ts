import { describe, expect, it } from 'vitest';

import { normalizeChangelogDocument } from './changelogList.repository';

describe('normalizeChangelogDocument', () => {
  it('normaliza createdAt basado en segundos de Firestore', () => {
    const result = normalizeChangelogDocument({
      changelog: {
        content: 'Release notes',
        createdAt: { seconds: 1_700_000_000 },
        id: 'release-1',
      },
    });

    expect(result.changelog.createdAt.getTime()).toBe(1_700_000_000_000);
    expect(result.changelog.content).toBe('Release notes');
    expect(result.changelog.id).toBe('release-1');
  });

  it('usa epoch cuando la fecha no tiene segundos validos', () => {
    const result = normalizeChangelogDocument({
      changelog: {
        content: 'Sin fecha',
      },
    });

    expect(result.changelog.createdAt.getTime()).toBe(0);
  });
});
