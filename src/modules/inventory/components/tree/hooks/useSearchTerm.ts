import { useState, useEffect } from 'react';
import type { TreeNodeData } from '../types';

import { expandMatchingNodes } from '../utils/expandUtils';
import { traverse } from '../utils/traverseUtils';

type ExpandedMap = Record<string, boolean>;

const useSearchTerm = (
  data: TreeNodeData[],
  manuallyClosedNodes: ExpandedMap,
  setSearchExpandedNodes: (value: ExpandedMap) => void,
) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!searchTerm) {
      setSearchExpandedNodes({});
      return;
    }

    const timeoutId = setTimeout(() => {
      expandMatchingNodes(searchTerm, data, traverse, (expandedResult) => {
        const filtered = Object.keys(expandedResult).reduce<ExpandedMap>(
          (acc, nodeId) => {
            if (!manuallyClosedNodes[nodeId]) {
              acc[nodeId] = true;
            }
            return acc;
          },
          {},
        );

        setSearchExpandedNodes({ ...filtered });
      });
    }, 300); // Debounce para evitar múltiples actualizaciones

    return () => clearTimeout(timeoutId);
  }, [searchTerm, data, manuallyClosedNodes, setSearchExpandedNodes]);

  return { searchTerm, setSearchTerm };
};

export default useSearchTerm;
