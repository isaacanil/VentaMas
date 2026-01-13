import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { TreeNodeData, TreeNodeId } from '../types';

import { findPathToNode } from '../utils/nodeUtils';

type ExpandedMap = Record<string, boolean>;

const useSelectedNode = (
  data: TreeNodeData[],
  selectedId: TreeNodeId | null | undefined,
  manuallyClosedNodes: ExpandedMap,
  setManualExpandedNodes: Dispatch<SetStateAction<ExpandedMap>>,
) => {
  const [internalSelectedNode, setInternalSelectedNode] = useState<TreeNodeId | null>(
    selectedId ?? null,
  );
  const prevSelectedId = useRef<TreeNodeId | null | undefined>(selectedId);

  useEffect(() => {
    if (selectedId && selectedId !== prevSelectedId.current) {
      prevSelectedId.current = selectedId;
      const path = findPathToNode(data, selectedId);
      if (path) {
        setManualExpandedNodes((prev) => {
          const newExpanded = { ...prev };
          // Solo expandir los nodos padre que no están manualmente cerrados
          path.forEach((id) => {
            if (!manuallyClosedNodes[id]) {
              newExpanded[id] = true;
            }
          });
          return newExpanded;
        });
      }
    }
  }, [selectedId, data, manuallyClosedNodes, setManualExpandedNodes]);

  const selectedNode = selectedId ?? internalSelectedNode;

  return { selectedNode, setSelectedNode: setInternalSelectedNode };
};

export default useSelectedNode;
