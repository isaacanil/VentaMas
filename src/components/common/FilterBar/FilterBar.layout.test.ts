import { describe, expect, it } from 'vitest';

import {
  getFilterBarItemSlots,
  getFilterBarOverflowSlots,
  normalizeFilterBarItems,
} from './FilterBar.layout';
import type { FilterBarItem } from './FilterBar';

const createItem = (
  key: string,
  overrides: Partial<FilterBarItem> = {},
): FilterBarItem => ({
  key,
  type: 'input',
  ...overrides,
});

const keysOf = (items: FilterBarItem[]) => items.map(({ key }) => key);

describe('FilterBar layout helpers', () => {
  it('normalizes item defaults without overriding explicit values', () => {
    const [defaultItem, overriddenItem] = normalizeFilterBarItems([
      createItem('default'),
      createItem('overridden', {
        section: 'additional',
        visibleOnDesktop: false,
        visibleOnMobile: false,
        collapsible: false,
      }),
    ]);

    expect(defaultItem).toMatchObject({
      key: 'default',
      section: 'main',
      visibleOnDesktop: true,
      visibleOnMobile: true,
      collapsible: true,
    });
    expect(overriddenItem).toMatchObject({
      key: 'overridden',
      section: 'additional',
      visibleOnDesktop: false,
      visibleOnMobile: false,
      collapsible: false,
    });
  });

  it('partitions desktop, pinned, additional, and mobile slots', () => {
    const slots = getFilterBarItemSlots([
      createItem('search'),
      createItem('pinned', { collapsible: false }),
      createItem('additional', { section: 'additional' }),
      createItem('desktop-hidden', { visibleOnDesktop: false }),
      createItem('mobile-hidden', { visibleOnMobile: false }),
      createItem('additional-desktop-hidden', {
        section: 'additional',
        visibleOnDesktop: false,
      }),
    ]);

    expect(keysOf(slots.mainItems)).toEqual([
      'search',
      'pinned',
      'mobile-hidden',
    ]);
    expect(keysOf(slots.collapsibleMainItems)).toEqual([
      'search',
      'mobile-hidden',
    ]);
    expect(keysOf(slots.pinnedMainItems)).toEqual(['pinned']);
    expect(keysOf(slots.additionalItems)).toEqual(['additional']);
    expect(keysOf(slots.mobileItems)).toEqual([
      'search',
      'pinned',
      'additional',
      'desktop-hidden',
      'additional-desktop-hidden',
    ]);
  });

  it('builds overflow slots while preserving modal item order', () => {
    const slots = getFilterBarItemSlots([
      createItem('search'),
      createItem('status'),
      createItem('date'),
      createItem('additional-a', { section: 'additional' }),
      createItem('additional-b', { section: 'additional' }),
    ]);

    const overflowSlots = getFilterBarOverflowSlots(slots, 2);

    expect(keysOf(overflowSlots.visibleMainItems)).toEqual([
      'search',
      'status',
    ]);
    expect(keysOf(overflowSlots.collapsedMainItems)).toEqual(['date']);
    expect(keysOf(overflowSlots.modalItems)).toEqual([
      'date',
      'additional-a',
      'additional-b',
    ]);
  });

  it('keeps all collapsible main items visible when visibleCount is not finite', () => {
    const slots = getFilterBarItemSlots([
      createItem('search'),
      createItem('status'),
      createItem('additional', { section: 'additional' }),
    ]);

    const overflowSlots = getFilterBarOverflowSlots(slots, Number.NaN);

    expect(keysOf(overflowSlots.visibleMainItems)).toEqual([
      'search',
      'status',
    ]);
    expect(keysOf(overflowSlots.collapsedMainItems)).toEqual([]);
    expect(keysOf(overflowSlots.modalItems)).toEqual(['additional']);
  });
});
