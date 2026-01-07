import { useEffect, useRef, useState } from 'react';

import { findPathToNode } from '../utils/nodeUtils';

const useSelectedNode = (
  data,
  selectedId,
  manuallyClosedNodes,
  setManualExpandedNodes,
) => {
  const [internalSelectedNode, setInternalSelectedNode] = useState(
    selectedId ?? null,
  );
  const prevSelectedId = useRef(selectedId);

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
