export const selectNode = ({
  nodeId,
  node,
  level,
  config,
  selectedNode,
  setSelectedNode,
  setExpandedNodes,
  onNodeClick,
}) => {
  if (config.disabledNodes?.includes(nodeId)) {
    return;
  }

  const isCurrentlySelected = selectedNode === nodeId;

  if (isCurrentlySelected) {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  } else {
    setSelectedNode(nodeId);
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: true,
    }));
  }

  if (onNodeClick) {
    onNodeClick(node, level);
  }
};
