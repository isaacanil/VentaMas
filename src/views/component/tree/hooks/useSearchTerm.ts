// @ts-nocheck
import { useState, useEffect } from 'react';

import { expandMatchingNodes } from '../utils/expandUtils';
import { traverse } from '../utils/traverseUtils';

const useSearchTerm = (data, manuallyClosedNodes, setSearchExpandedNodes) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!searchTerm) {
      setSearchExpandedNodes({});
      return;
    }

    const timeoutId = setTimeout(() => {
      expandMatchingNodes(searchTerm, data, traverse, (expandedResult) => {
        const filtered = Object.keys(expandedResult).reduce((acc, nodeId) => {
          if (!manuallyClosedNodes[nodeId]) {
            acc[nodeId] = true;
          }
          return acc;
        }, {});

        setSearchExpandedNodes({ ...filtered });
      });
    }, 300); // Debounce para evitar múltiples actualizaciones

    return () => clearTimeout(timeoutId);
  }, [searchTerm, data, manuallyClosedNodes, setSearchExpandedNodes]);

  return { searchTerm, setSearchTerm };
};

export default useSearchTerm;
