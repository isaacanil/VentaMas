import type { TreeConfig, TreeNodeData } from '../types';

export const getMatchingProductStock = (
  node: TreeNodeData,
  searchTerm: string,
) => {
  const lowerTerm = searchTerm.toLowerCase();
  return (node.productStock || []).filter((stock) =>
    stock.productName?.toLowerCase().includes(lowerTerm),
  );
};

export const defaultFilterNodes = (
  nodes: TreeNodeData[],
  term: string,
  config: TreeConfig<TreeNodeData>,
): TreeNodeData[] => {
  if (!term) return nodes;
  const lowerTerm = term.toLowerCase();
  return nodes.reduce<TreeNodeData[]>((acc, node) => {
    const nodeNameMatch = node.name?.toLowerCase().includes(lowerTerm);
    const matchingStock = getMatchingProductStock(node, term);
    const childrenFiltered = defaultFilterNodes(
      node.children || [],
      term,
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
