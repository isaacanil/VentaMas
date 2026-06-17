import type { TreeConfig, TreeNodeData, TreeNodeId } from '../types';

type ExpandedMap = Record<string, boolean>;

export const selectNode = ({
  nodeId,
  node,
  level,
  config,
  selectedNode,
  setSelectedNode,
  setExpandedNodes,
  onNodeClick,
}: {
  nodeId: TreeNodeId;
  node: TreeNodeData;
  level: number;
  config: TreeConfig<TreeNodeData>;
  selectedNode: TreeNodeId | null;
  setSelectedNode: (value: TreeNodeId | null) => void;
  setExpandedNodes: React.Dispatch<React.SetStateAction<ExpandedMap>>;
  onNodeClick?: (node: TreeNodeData, level?: number) => void;
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
