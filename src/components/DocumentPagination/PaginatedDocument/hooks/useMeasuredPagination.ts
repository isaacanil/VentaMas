import { useCallback, useMemo, useState } from 'react';

import type {
  PageGeometry,
  PaginatedBlock,
  PaginationMeasurements,
} from '../types';
import {
  createEmptyChromeMeasurements,
  paginateMeasuredBlocks,
} from './paginationEngine';

const EMPTY_MEASUREMENTS: PaginationMeasurements = {
  blockHeights: {},
  chromeHeights: createEmptyChromeMeasurements(),
  footerHeight: 0,
  headerHeight: 0,
  measured: false,
};

const areMeasurementsEqual = (
  current: PaginationMeasurements,
  next: PaginationMeasurements,
) => {
  if (
    current.headerHeight !== next.headerHeight ||
    current.footerHeight !== next.footerHeight ||
    current.measured !== next.measured
  ) {
    return false;
  }

  const currentChromeKeys = Object.keys(current.chromeHeights);
  const nextChromeKeys = Object.keys(next.chromeHeights);
  const hasEqualChromeHeights =
    currentChromeKeys.length === nextChromeKeys.length &&
    nextChromeKeys.every((key) => {
      const typedKey = key as keyof PaginationMeasurements['chromeHeights'];
      const currentChrome = current.chromeHeights[typedKey];
      const nextChrome = next.chromeHeights[typedKey];

      return (
        currentChrome.footerHeight === nextChrome.footerHeight &&
        currentChrome.headerHeight === nextChrome.headerHeight
      );
    });

  if (!hasEqualChromeHeights) {
    return false;
  }

  const currentKeys = Object.keys(current.blockHeights);
  const nextKeys = Object.keys(next.blockHeights);

  return (
    currentKeys.length === nextKeys.length &&
    nextKeys.every((key) => current.blockHeights[key] === next.blockHeights[key])
  );
};

export const useMeasuredPagination = ({
  blocks,
  geometry,
}: {
  blocks: PaginatedBlock[];
  geometry: PageGeometry;
}) => {
  const [measurements, setMeasurements] =
    useState<PaginationMeasurements>(EMPTY_MEASUREMENTS);

  const handleMeasure = useCallback((nextMeasurements: PaginationMeasurements) => {
    setMeasurements((currentMeasurements) =>
      areMeasurementsEqual(currentMeasurements, nextMeasurements)
        ? currentMeasurements
        : nextMeasurements,
    );
  }, []);

  const layout = useMemo(
    () => paginateMeasuredBlocks({ blocks, geometry, measurements }),
    [blocks, geometry, measurements],
  );

  return {
    layout,
    measurements,
    onMeasure: handleMeasure,
  };
};
