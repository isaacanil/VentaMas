import type { TreeNodeData, TreeNodeId } from '../types';

export function findPathToNode(
  nodes: TreeNodeData[],
  nodeId: TreeNodeId,
  path: TreeNodeId[] = [],
): TreeNodeId[] | null {
  for (const node of nodes) {
    const currentPath = [...path, node.id];
    if (node.id === nodeId) {
      return currentPath;
    }
    if (node.children) {
      const result = findPathToNode(node.children, nodeId, currentPath);
      if (result) return result;
    }
  }
  return null;
}
