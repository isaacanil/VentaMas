import { describe, expect, it } from 'vitest';

import {
  createEmptyChromeMeasurements,
  paginateMeasuredBlocks,
  resolveBodyCapacity,
  resolvePageRole,
} from './paginationEngine';
import type {
  PageGeometry,
  PaginatedBlock,
  PaginationMeasurements,
} from '../types';

const geometry: PageGeometry = {
  bodyGapPx: 10,
  chromeGapMm: 0,
  heightMm: 100,
  paddingBlockMm: 0,
  paddingInlineMm: 0,
  widthMm: 100,
};

const blocks = ['a', 'b', 'c', 'd'].map(
  (id) =>
    ({
      id,
      content: id,
    }) satisfies PaginatedBlock,
);

const makeMeasurements = (
  blockHeights: Record<string, number>,
  chromeHeight = 0,
): PaginationMeasurements => ({
  blockHeights,
  chromeHeights: createEmptyChromeMeasurements(chromeHeight),
  footerHeight: chromeHeight,
  headerHeight: chromeHeight,
  measured: true,
});

const makeRoleMeasurements = ({
  blockHeights,
  firstChrome = 0,
  firstFooter = firstChrome,
  firstHeader = firstChrome,
  lastChrome = 0,
  lastFooter = lastChrome,
  lastHeader = lastChrome,
  middleChrome = 0,
  middleFooter = middleChrome,
  middleHeader = middleChrome,
  singleChrome = 0,
  singleFooter = singleChrome,
  singleHeader = singleChrome,
}: {
  blockHeights: Record<string, number>;
  firstChrome?: number;
  firstFooter?: number;
  firstHeader?: number;
  lastChrome?: number;
  lastFooter?: number;
  lastHeader?: number;
  middleChrome?: number;
  middleFooter?: number;
  middleHeader?: number;
  singleChrome?: number;
  singleFooter?: number;
  singleHeader?: number;
}): PaginationMeasurements => ({
  blockHeights,
  chromeHeights: {
    first: {
      footerHeight: firstFooter,
      headerHeight: firstHeader,
    },
    last: {
      footerHeight: lastFooter,
      headerHeight: lastHeader,
    },
    middle: {
      footerHeight: middleFooter,
      headerHeight: middleHeader,
    },
    single: {
      footerHeight: singleFooter,
      headerHeight: singleHeader,
    },
  },
  footerHeight: Math.max(firstFooter, lastFooter, middleFooter, singleFooter),
  headerHeight: Math.max(firstHeader, lastHeader, middleHeader, singleHeader),
  measured: true,
});

describe('resolvePageRole', () => {
  it('identifies single, first, middle and last page roles', () => {
    expect(resolvePageRole(1, 1)).toBe('single');
    expect(resolvePageRole(1, 3)).toBe('first');
    expect(resolvePageRole(2, 3)).toBe('middle');
    expect(resolvePageRole(3, 3)).toBe('last');
  });
});

describe('paginateMeasuredBlocks', () => {
  it('keeps blocks atomic while distributing them across pages', () => {
    const layout = paginateMeasuredBlocks({
      blocks,
      geometry,
      measurements: makeMeasurements({
        a: 140,
        b: 140,
        c: 140,
        d: 140,
      }),
    });

    expect(layout.pages.map((page) => page.map((block) => block.id))).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
    expect(layout.overflowBlockIds).toEqual([]);
    expect(layout.stable).toBe(true);
  });

  it('reserves measured header and footer height before paginating body blocks', () => {
    const measurements = makeMeasurements(
      {
        a: 120,
        b: 120,
        c: 120,
      },
      70,
    );

    expect(resolveBodyCapacity(measurements, geometry)).toBe(237);

    const layout = paginateMeasuredBlocks({
      blocks: blocks.slice(0, 3),
      geometry,
      measurements,
    });

    expect(layout.pages.map((page) => page.map((block) => block.id))).toEqual([
      ['a'],
      ['b'],
      ['c'],
    ]);
    expect(layout.pageCapacitiesPx).toEqual([237, 237, 237]);
    expect(layout.bodyCapacityPx).toBe(237);
  });

  it('reports blocks taller than the available body area', () => {
    const layout = paginateMeasuredBlocks({
      blocks: blocks.slice(0, 2),
      geometry,
      measurements: makeMeasurements({
        a: 500,
        b: 80,
      }),
    });

    expect(layout.overflowBlockIds).toEqual(['a']);
  });

  it('reports duplicate block ids before measuring page heights', () => {
    const layout = paginateMeasuredBlocks({
      blocks: [
        {
          id: 'a',
          content: 'first',
        },
        {
          id: 'a',
          content: 'second',
        },
      ],
      geometry,
      measurements: makeMeasurements({
        a: 80,
      }),
    });

    expect(layout.duplicateBlockIds).toEqual(['a']);
  });

  it('fails closed when a measured layout is missing a block height', () => {
    const layout = paginateMeasuredBlocks({
      blocks: blocks.slice(0, 2),
      geometry,
      measurements: makeMeasurements({
        a: 80,
      }),
    });

    expect(layout.unmeasuredBlockIds).toEqual(['b']);
    expect(layout.stable).toBe(false);
    expect(layout.pages.map((page) => page.map((block) => block.id))).toEqual([
      ['a', 'b'],
    ]);
  });

  it('reports chrome roles that exceed the page height', () => {
    const layout = paginateMeasuredBlocks({
      blocks: [],
      geometry,
      measurements: makeRoleMeasurements({
        blockHeights: {},
        firstFooter: 30,
        firstHeader: 30,
        lastFooter: 20,
        lastHeader: 20,
        middleFooter: 20,
        middleHeader: 20,
        singleFooter: 220,
        singleHeader: 220,
      }),
    });

    expect(layout.chromeOverflowRoles).toEqual(['single']);
    expect(layout.stable).toBe(false);
    expect(layout.pageCapacitiesPx).toEqual([0]);
  });

  it('ignores chrome overflow from roles that are not used by the final pages', () => {
    const layout = paginateMeasuredBlocks({
      blocks: blocks.slice(0, 2),
      geometry,
      measurements: makeRoleMeasurements({
        blockHeights: {
          a: 250,
          b: 250,
        },
        firstChrome: 0,
        lastChrome: 0,
        middleChrome: 0,
        singleFooter: 220,
        singleHeader: 220,
      }),
    });

    expect(layout.pages.map((page) => page.map((block) => block.id))).toEqual([
      ['a'],
      ['b'],
    ]);
    expect(layout.chromeOverflowRoles).toEqual([]);
    expect(layout.stable).toBe(true);
  });

  it('uses single page chrome when every block fits on one page', () => {
    const layout = paginateMeasuredBlocks({
      blocks: blocks.slice(0, 2),
      geometry,
      measurements: makeRoleMeasurements({
        blockHeights: {
          a: 120,
          b: 120,
        },
        firstChrome: 140,
        lastChrome: 140,
        middleChrome: 140,
        singleChrome: 0,
      }),
    });

    expect(layout.pages.map((page) => page.map((block) => block.id))).toEqual([
      ['a', 'b'],
    ]);
    expect(layout.pageCapacitiesPx).toEqual([377]);
    expect(layout.stable).toBe(true);
  });

  it('repaginates with first, middle and last capacities until stable', () => {
    const layout = paginateMeasuredBlocks({
      blocks: blocks.slice(0, 3),
      geometry,
      measurements: makeRoleMeasurements({
        blockHeights: {
          a: 120,
          b: 120,
          c: 120,
        },
        firstChrome: 68,
        lastChrome: 118,
        middleChrome: 68,
        singleChrome: 0,
      }),
    });

    expect(layout.pages.map((page) => page.map((block) => block.id))).toEqual([
      ['a'],
      ['b'],
      ['c'],
    ]);
    expect(layout.pageCapacitiesPx).toEqual([241, 241, 141]);
    expect(layout.bodyCapacityPx).toBe(141);
    expect(layout.stable).toBe(true);
  });

  it('uses first and last capacities for exactly two pages', () => {
    const layout = paginateMeasuredBlocks({
      blocks: blocks.slice(0, 3),
      geometry,
      measurements: makeRoleMeasurements({
        blockHeights: {
          a: 170,
          b: 170,
          c: 80,
        },
        firstChrome: 0,
        lastChrome: 90,
        middleChrome: 180,
        singleChrome: 0,
      }),
    });

    expect(layout.pages.map((page) => page.map((block) => block.id))).toEqual([
      ['a', 'b'],
      ['c'],
    ]);
    expect(layout.pageCapacitiesPx).toEqual([377, 197]);
    expect(layout.stable).toBe(true);
  });

  it('calculates capacity with asymmetric header and footer heights', () => {
    const measurements = makeRoleMeasurements({
      blockHeights: {},
      firstFooter: 23,
      firstHeader: 41,
    });

    expect(resolveBodyCapacity(measurements, geometry, 'first')).toBe(313);
  });

  it('keeps a block on the page when its height exactly reaches capacity', () => {
    const layout = paginateMeasuredBlocks({
      blocks: blocks.slice(0, 2),
      geometry,
      measurements: makeMeasurements({
        a: 183,
        b: 184,
      }),
    });

    expect(layout.pages.map((page) => page.map((block) => block.id))).toEqual([
      ['a', 'b'],
    ]);
  });

  it('moves a block when it exceeds capacity by one pixel', () => {
    const layout = paginateMeasuredBlocks({
      blocks: blocks.slice(0, 2),
      geometry,
      measurements: makeMeasurements({
        a: 184,
        b: 184,
      }),
    });

    expect(layout.pages.map((page) => page.map((block) => block.id))).toEqual([
      ['a'],
      ['b'],
    ]);
  });

  it('falls back to conservative capacity when role pagination oscillates', () => {
    const layout = paginateMeasuredBlocks({
      blocks: blocks.slice(0, 2),
      geometry,
      measurements: makeRoleMeasurements({
        blockHeights: {
          a: 170,
          b: 170,
        },
        firstChrome: 0,
        lastChrome: 0,
        middleChrome: 0,
        singleChrome: 20,
      }),
    });

    expect(layout.stable).toBe(false);
    expect(layout.pages.map((page) => page.map((block) => block.id))).toEqual([
      ['a'],
      ['b'],
    ]);
    expect(layout.pageCapacitiesPx).toEqual([337, 337]);
  });
});
