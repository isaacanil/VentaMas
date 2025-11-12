import { useState, useEffect } from "react";

import { findPathToNode } from "../utils/nodeUtils";

const useSelectedNode = (data, selectedId, manuallyClosedNodes, setManualExpandedNodes) => {
  const [selectedNode, setSelectedNode] = useState(selectedId);

  useEffect(() => {
    if (selectedId && selectedId !== selectedNode) {  // Solo ejecutar si el ID seleccionado cambia
      const path = findPathToNode(data, selectedId);
      if (path) {
        setManualExpandedNodes((prev) => {
          const newExpanded = { ...prev };
          // Solo expandir los nodos padre que no están manualmente cerrados
          path.forEach(id => {
            if (!manuallyClosedNodes[id]) {
              newExpanded[id] = true;
            }
          });
          return newExpanded;
        });
      }
      setSelectedNode(selectedId);
    }
  }, [selectedId, data]);

  return { selectedNode, setSelectedNode };
};

export default useSelectedNode;
