import { describe, expect, it } from 'vitest';

import { createLazyLoader } from './createLazyLoader';

import type { ToolbarComponentProps } from '../types';

const DefaultToolbar = (_props: ToolbarComponentProps) => null;

describe('createLazyLoader', () => {
  it('wraps a default export as a lazy component module', async () => {
    const loader = createLazyLoader(() =>
      Promise.resolve({ default: DefaultToolbar }),
    );

    await expect(loader()).resolves.toEqual({ default: DefaultToolbar });
  });

  it('rejects when a named export is missing', async () => {
    const loader = createLazyLoader(
      () => Promise.resolve({ default: DefaultToolbar }),
      'MissingToolbar',
    );

    await expect(loader()).rejects.toThrow(
      'Toolbar component "MissingToolbar" not found. Available exports: default',
    );
  });
});
