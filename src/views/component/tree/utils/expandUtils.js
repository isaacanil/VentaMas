export const expandMatchingNodes = (
  term,
  data,
  traverse,
  setSearchExpandedNodes,
) => {
  const newExpandedKeys = new Set();
  if (term) {
    data.forEach((node) => traverse(node, term, [], false, newExpandedKeys));
  }

  const newSearchExpandedNodes = {};
  newExpandedKeys.forEach((key) => {
    newSearchExpandedNodes[key] = true;
  });
  setSearchExpandedNodes(newSearchExpandedNodes);
};
