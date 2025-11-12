import { useState, useCallback, useMemo } from 'react';

const useExpandedNodes = (data) => {
  const [manualExpandedNodes, setManualExpandedNodes] = useState({});
  const [searchExpandedNodes, setSearchExpandedNodes] = useState({});
  const [manuallyClosedNodes, setManuallyClosedNodes] = useState({});
  const [explicitlyClosedNodes, setExplicitlyClosedNodes] = useState(new Set());

  const expandedNodes = useMemo(
    () => ({
      ...manualExpandedNodes,
      ...Object.keys(searchExpandedNodes).reduce((acc, key) => {
        if (!manuallyClosedNodes[key]) {
          acc[key] = true;
        }
        return acc;
      }, {}),
    }),
    [manualExpandedNodes, searchExpandedNodes, manuallyClosedNodes],
  );

  const findNodeById = useCallback((nodes, id) => {
    for (const node of nodes || []) {
      if (node.id === id) {
        return node;
      }
      if (node.children?.length) {
        const found = findNodeById(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }, []);

  const findAllChildrenIds = useCallback(
    (nodeId) => {
      const target = findNodeById(data, nodeId);
      if (!target?.children?.length) {
        return [];
      }

      const stack = [...target.children];
      const childrenIds = [];

      while (stack.length) {
        const current = stack.pop();
        if (!current) continue;
        childrenIds.push(current.id);
        if (current.children?.length) {
          stack.push(...current.children);
        }
      }

      return childrenIds;
    },
    [data, findNodeById],
  );

  const handleToggleNode = useCallback(
    (nodeId) => {
      setManualExpandedNodes((prev) => {
        const newExpanded = { ...prev };
        if (prev[nodeId]) {
          delete newExpanded[nodeId];
          const childrenIds = findAllChildrenIds(nodeId);
          childrenIds.forEach((childId) => {
            delete newExpanded[childId];
          });
        } else {
          newExpanded[nodeId] = true;
        }
        return newExpanded;
      });

      setExplicitlyClosedNodes((prev) => {
        const newSet = new Set(prev);
        if (manualExpandedNodes[nodeId]) {
          newSet.add(nodeId);
          findAllChildrenIds(nodeId).forEach((id) => newSet.add(id));
        } else {
          newSet.delete(nodeId);
        }
        return newSet;
      });
    },
    [findAllChildrenIds, manualExpandedNodes],
  );

  const handleToggleAll = useCallback(() => {
    if (Object.keys(manualExpandedNodes).length > 0) {
      setManualExpandedNodes({});
      setSearchExpandedNodes({});
      setManuallyClosedNodes({});
      setExplicitlyClosedNodes(new Set());
    } else {
      const allNodeIds = new Set();
      const collectNodeIds = (nodes) => {
        nodes.forEach((node) => {
          allNodeIds.add(node.id);
          if (node.children) collectNodeIds(node.children);
        });
      };
      collectNodeIds(data);
      setManualExpandedNodes(
        Object.fromEntries([...allNodeIds].map((id) => [id, true])),
      );
      setManuallyClosedNodes({});
    }
  }, [data, manualExpandedNodes]);

  return {
    expandedNodes,
    handleToggleNode,
    handleToggleAll,
    manualExpandedNodes,
    searchExpandedNodes,
    manuallyClosedNodes,
    setManualExpandedNodes,
    setSearchExpandedNodes,
    setManuallyClosedNodes,
    explicitlyClosedNodes,
  };
};

export default useExpandedNodes;
