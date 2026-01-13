import type { TreeNodeData, TreeNodeId } from '../types';

export const expandMatchingNodes = (
  term: string,
  data: TreeNodeData[],
  traverse: (
    node: TreeNodeData | null | undefined,
    term: string,
    path: TreeNodeId[],
    found: boolean,
    newExpandedKeys: Set<TreeNodeId>,
  ) => boolean,
  setSearchExpandedNodes: (value: Record<string, boolean>) => void,
) => {
  const newExpandedKeys = new Set<TreeNodeId>();
  if (term) {
    data.forEach((node) => traverse(node, term, [], false, newExpandedKeys));
  }

  const newSearchExpandedNodes = {};
  newExpandedKeys.forEach((key) => {
    newSearchExpandedNodes[key] = true;
  });
  setSearchExpandedNodes(newSearchExpandedNodes);
};
