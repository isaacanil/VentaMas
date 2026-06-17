import { useCallback, useEffect, useState } from 'react';
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
  const updateSearchTerm = useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (!value) {
        setSearchExpandedNodes({});
      }
    },
    [setSearchExpandedNodes],
  );

  useEffect(() => {
    if (!searchTerm) {
      return undefined;
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

  return { searchTerm, setSearchTerm: updateSearchTerm };
};

export default useSearchTerm;
