// @ts-nocheck
/**
 * Traverses tree nodes to find matches and expand relevant nodes
 * @param {Object} node - Current tree node
 * @param {string} term - Search term
 * @param {Array} path - Current path in tree
 * @param {boolean} found - Whether match was found
 * @param {Set} newExpandedKeys - Set of node IDs to expand
 * @returns {boolean} - Whether match was found in this branch
 */
export const traverse = (
  node,
  term,
  path = [],
  found = false,
  newExpandedKeys,
) => {
  if (!node) return false;

  const nodeName = String(node.name || '').toLowerCase();
  const lowerTerm = String(term || '').toLowerCase();
  let hasMatch = false;

  // Check current node
  if (nodeName.includes(lowerTerm)) {
    // Add current node and all parents to expanded keys
    path.forEach((parentId) => newExpandedKeys.add(parentId));
    newExpandedKeys.add(node.id);
    hasMatch = true;
  } else {
    // Remove current node from expanded keys if no match
    newExpandedKeys.delete(node.id);
  }

  // Check children
  if (node.children) {
    node.children.forEach((child) => {
      // If child matches, add current node to expanded keys
      const childMatch = traverse(
        child,
        term,
        [...path, node.id],
        found,
        newExpandedKeys,
      );
      if (childMatch) {
        path.forEach((parentId) => newExpandedKeys.add(parentId));
        newExpandedKeys.add(node.id);
        hasMatch = true;
      } else {
        // Remove child node from expanded keys if no match
        newExpandedKeys.delete(child.id);
      }
    });
  }

  return hasMatch;
};

/**
 * Finds the path to a node with a given ID
 * @param {Array} nodes - Array of tree nodes
 * @param {string} targetId - ID of the target node
 * @param {Array} path - Current path in tree
 * @returns {Array|null} - Path to the target node or null if not found
 */
export const findPathToNode = (nodes, targetId, path = []) => {
  for (let node of nodes) {
    const newPath = [...path, { id: node.id, name: node.name }];
    if (node.id === targetId) {
      return newPath;
    }
    if (node.children) {
      const result = findPathToNode(node.children, targetId, newPath);
      if (result) {
        return result;
      }
    }
  }
  return null;
};
