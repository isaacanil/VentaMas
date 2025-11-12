export function findPathToNode(nodes, nodeId, path = []) {
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
