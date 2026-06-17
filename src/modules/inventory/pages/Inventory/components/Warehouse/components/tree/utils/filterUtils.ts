import {
  normalizedIncludes,
  normalizeTrimmedSearchText,
} from '@/utils/searchText';

import type { TreeConfig, TreeNodeData } from '../types';

export const getMatchingProductStock = (
  node: TreeNodeData,
  searchTerm: string,
) => {
  const term = normalizeTrimmedSearchText(searchTerm);

  return (node.productStock || []).filter((stock) =>
    normalizedIncludes(stock.productName ?? '', term),
  );
};

export const defaultFilterNodes = (
  nodes: TreeNodeData[],
  term: string,
  config: TreeConfig<TreeNodeData>,
): TreeNodeData[] => {
  const normalizedTerm = normalizeTrimmedSearchText(term);
  if (!normalizedTerm) return nodes;

  return nodes.reduce<TreeNodeData[]>((acc, node) => {
    const nodeNameMatch = normalizedIncludes(node.name ?? '', normalizedTerm);
    const matchingStock = getMatchingProductStock(node, normalizedTerm);
    const childrenFiltered = defaultFilterNodes(
      node.children || [],
      normalizedTerm,
      config,
    );

    if (
      nodeNameMatch ||
      matchingStock.length > 0 ||
      childrenFiltered.length > 0
    ) {
      acc.push({
        ...node,
        ...(nodeNameMatch &&
          config.showMatchedStockCount && {
            matchedStockCount: matchingStock.length,
          }),
        children: childrenFiltered,
      });
    }
    return acc;
  }, []);
};
