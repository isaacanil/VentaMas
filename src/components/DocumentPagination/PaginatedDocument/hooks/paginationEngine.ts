import type {
  PageGeometry,
  PaginatedBlock,
  PaginationLayout,
  PaginationMeasurements,
  PaginationPageRole,
} from '../types';

const CSS_PX_PER_INCH = 96;
const MM_PER_INCH = 25.4;
const PAGE_ROLES: PaginationPageRole[] = [
  'single',
  'first',
  'middle',
  'last',
];

export const mmToPx = (value: number) =>
  (value * CSS_PX_PER_INCH) / MM_PER_INCH;

export const createEmptyChromeMeasurements = (
  height = 0,
): PaginationMeasurements['chromeHeights'] => ({
  first: {
    footerHeight: height,
    headerHeight: height,
  },
  last: {
    footerHeight: height,
    headerHeight: height,
  },
  middle: {
    footerHeight: height,
    headerHeight: height,
  },
  single: {
    footerHeight: height,
    headerHeight: height,
  },
});

export const resolvePageRole = (
  pageNumber: number,
  totalPages: number,
): PaginationPageRole => {
  if (totalPages <= 1) {
    return 'single';
  }

  if (pageNumber === 1) {
    return 'first';
  }

  if (pageNumber === totalPages) {
    return 'last';
  }

  return 'middle';
};

const resolveChromeHeight = (
  measurements: PaginationMeasurements,
  role: PaginationPageRole,
) => {
  const roleChrome = measurements.chromeHeights?.[role];

  return {
    footerHeight: roleChrome?.footerHeight ?? measurements.footerHeight,
    headerHeight: roleChrome?.headerHeight ?? measurements.headerHeight,
  };
};

const resolveRawBodyCapacity = (
  measurements: PaginationMeasurements,
  geometry: PageGeometry,
  role: PaginationPageRole,
) => {
  const chromeHeight = resolveChromeHeight(measurements, role);

  return (
    mmToPx(geometry.heightMm) -
    mmToPx(geometry.paddingBlockMm) * 2 -
    mmToPx(geometry.chromeGapMm) * 2 -
    chromeHeight.headerHeight -
    chromeHeight.footerHeight
  );
};

export const resolveBodyCapacity = (
  measurements: PaginationMeasurements,
  geometry: PageGeometry,
  role: PaginationPageRole = 'single',
) => Math.max(0, Math.floor(resolveRawBodyCapacity(measurements, geometry, role)));

const resolvePageCapacity = ({
  geometry,
  measurements,
  pageNumber,
  totalPages,
}: {
  geometry: PageGeometry;
  measurements: PaginationMeasurements;
  pageNumber: number;
  totalPages: number;
}) =>
  resolveBodyCapacity(
    measurements,
    geometry,
    resolvePageRole(pageNumber, totalPages),
  );

const paginateForTotalPages = ({
  blocks,
  geometry,
  measurements,
  totalPages,
}: {
  blocks: PaginatedBlock[];
  geometry: PageGeometry;
  measurements: PaginationMeasurements;
  totalPages: number;
}) => {
  const pages: PaginatedBlock[][] = [];
  let currentPage: PaginatedBlock[] = [];
  let currentHeight = 0;
  let pageNumber = 1;

  blocks.forEach((block) => {
    const measuredHeight = Math.ceil(measurements.blockHeights[block.id] ?? 0);
    const gapHeight = currentPage.length > 0 ? geometry.bodyGapPx : 0;
    const nextHeight = gapHeight + measuredHeight;
    const pageCapacity = resolvePageCapacity({
      geometry,
      measurements,
      pageNumber,
      totalPages,
    });

    if (currentPage.length > 0 && currentHeight + nextHeight > pageCapacity) {
      pages.push(currentPage);
      pageNumber += 1;
      currentPage = [block];
      currentHeight = measuredHeight;
      return;
    }

    currentPage = [...currentPage, block];
    currentHeight += nextHeight;
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length ? pages : [[]];
};

const paginateForFixedCapacity = ({
  blocks,
  geometry,
  measurements,
  pageCapacity,
}: {
  blocks: PaginatedBlock[];
  geometry: PageGeometry;
  measurements: PaginationMeasurements;
  pageCapacity: number;
}) => {
  const pages: PaginatedBlock[][] = [];
  let currentPage: PaginatedBlock[] = [];
  let currentHeight = 0;

  blocks.forEach((block) => {
    const measuredHeight = Math.ceil(measurements.blockHeights[block.id] ?? 0);
    const gapHeight = currentPage.length > 0 ? geometry.bodyGapPx : 0;
    const nextHeight = gapHeight + measuredHeight;

    if (currentPage.length > 0 && currentHeight + nextHeight > pageCapacity) {
      pages.push(currentPage);
      currentPage = [block];
      currentHeight = measuredHeight;
      return;
    }

    currentPage = [...currentPage, block];
    currentHeight += nextHeight;
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length ? pages : [[]];
};

const resolvePageCapacities = ({
  geometry,
  measurements,
  totalPages,
}: {
  geometry: PageGeometry;
  measurements: PaginationMeasurements;
  totalPages: number;
}) =>
  Array.from({ length: totalPages }, (_, index) =>
    resolvePageCapacity({
      geometry,
      measurements,
      pageNumber: index + 1,
      totalPages,
    }),
  );

const resolveOverflowBlockIds = ({
  measurements,
  pageCapacitiesPx,
  pages,
}: {
  measurements: PaginationMeasurements;
  pageCapacitiesPx: number[];
  pages: PaginatedBlock[][];
}) =>
  pages.flatMap((pageBlocks, pageIndex) => {
    const pageCapacity = pageCapacitiesPx[pageIndex] ?? 0;

    return pageBlocks
      .filter((block) => {
        const measuredHeight = Math.ceil(
          measurements.blockHeights[block.id] ?? 0,
        );

        return measuredHeight > pageCapacity;
      })
      .map((block) => block.id);
  });

const resolveDuplicateBlockIds = (blocks: PaginatedBlock[]) => {
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();

  blocks.forEach((block) => {
    if (seenIds.has(block.id)) {
      duplicateIds.add(block.id);
      return;
    }

    seenIds.add(block.id);
  });

  return [...duplicateIds].sort();
};

const resolveUnmeasuredBlockIds = (
  blocks: PaginatedBlock[],
  measurements: PaginationMeasurements,
) => {
  const seenIds = new Set<string>();

  return blocks
    .filter((block) => {
      if (seenIds.has(block.id)) {
        return false;
      }

      seenIds.add(block.id);

      return (
        !Object.prototype.hasOwnProperty.call(measurements.blockHeights, block.id) ||
        !Number.isFinite(measurements.blockHeights[block.id])
      );
    })
    .map((block) => block.id);
};

const resolveChromeOverflowRoles = (
  measurements: PaginationMeasurements,
  geometry: PageGeometry,
  roles: PaginationPageRole[] = PAGE_ROLES,
) =>
  roles.filter(
    (role) => resolveRawBodyCapacity(measurements, geometry, role) < 0,
  );

const resolveUsedPageRoles = (pageCount: number) =>
  Array.from(
    new Set(
      Array.from({ length: pageCount }, (_, index) =>
        resolvePageRole(index + 1, pageCount),
      ),
    ),
  );

export const paginateMeasuredBlocks = ({
  blocks,
  geometry,
  measurements,
}: {
  blocks: PaginatedBlock[];
  geometry: PageGeometry;
  measurements: PaginationMeasurements;
}): PaginationLayout => {
  const unmeasuredCapacity = resolveBodyCapacity(measurements, geometry);
  const duplicateBlockIds = resolveDuplicateBlockIds(blocks);
  const unmeasuredBlockIds = measurements.measured
    ? resolveUnmeasuredBlockIds(blocks, measurements)
    : [];

  if (!blocks.length) {
    const chromeOverflowRoles = measurements.measured
      ? resolveChromeOverflowRoles(measurements, geometry, ['single'])
      : [];

    return {
      bodyCapacityPx: unmeasuredCapacity,
      chromeOverflowRoles,
      duplicateBlockIds,
      overflowBlockIds: [],
      pageCapacitiesPx: [unmeasuredCapacity],
      pages: [[]],
      stable: chromeOverflowRoles.length === 0,
      unmeasuredBlockIds,
    };
  }

  if (!measurements.measured) {
    return {
      bodyCapacityPx: unmeasuredCapacity,
      chromeOverflowRoles: [],
      duplicateBlockIds,
      overflowBlockIds: [],
      pageCapacitiesPx: [unmeasuredCapacity],
      pages: [blocks],
      stable: false,
      unmeasuredBlockIds,
    };
  }

  if (unmeasuredBlockIds.length > 0) {
    return {
      bodyCapacityPx: unmeasuredCapacity,
      chromeOverflowRoles: [],
      duplicateBlockIds,
      overflowBlockIds: [],
      pageCapacitiesPx: [unmeasuredCapacity],
      pages: [blocks],
      stable: false,
      unmeasuredBlockIds,
    };
  }

  let totalPages = 1;
  let stable = false;
  const seenTotalPages = new Set([totalPages]);
  let pages = paginateForTotalPages({
    blocks,
    geometry,
    measurements,
    totalPages,
  });

  for (
    let attempt = 0;
    attempt < blocks.length + PAGE_ROLES.length;
    attempt += 1
  ) {
    if (pages.length === totalPages) {
      stable = true;
      break;
    }

    if (seenTotalPages.has(pages.length)) {
      break;
    }

    seenTotalPages.add(pages.length);
    totalPages = pages.length;
    pages = paginateForTotalPages({
      blocks,
      geometry,
      measurements,
      totalPages,
    });
  }

  const measuredRoleCapacities = PAGE_ROLES.map((role) =>
    resolveBodyCapacity(measurements, geometry, role),
  );
  const conservativeCapacity = Math.min(...measuredRoleCapacities);
  const stablePages = stable
    ? pages
    : paginateForFixedCapacity({
        blocks,
        geometry,
        measurements,
        pageCapacity: conservativeCapacity,
      });
  const pageCapacitiesPx = stable
    ? resolvePageCapacities({
        geometry,
        measurements,
        totalPages: stablePages.length,
      })
    : Array.from({ length: stablePages.length }, () => conservativeCapacity);
  const chromeOverflowRoles = resolveChromeOverflowRoles(
    measurements,
    geometry,
    resolveUsedPageRoles(stablePages.length),
  );

  return {
    bodyCapacityPx: Math.min(...pageCapacitiesPx),
    chromeOverflowRoles,
    duplicateBlockIds,
    overflowBlockIds: resolveOverflowBlockIds({
      measurements,
      pageCapacitiesPx,
      pages: stablePages,
    }),
    pageCapacitiesPx,
    pages: stablePages,
    stable: stable && chromeOverflowRoles.length === 0,
    unmeasuredBlockIds,
  };
};
