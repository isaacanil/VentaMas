import React, { useMemo, useCallback, memo } from "react";
import styled from "styled-components";
import { traverse } from "./utils/traverseUtils";
import { defaultFilterNodes } from "./utils/filterUtils";
import TreeHeader from "./components/TreeHeader";
import TreeContent from "./components/TreeContent";
import TreeNode from "./components/TreeNode";
import { renderHighlightedText } from "./utils/textUtils";
import useExpandedNodes from "./hooks/useExpandedNodes";
import useSearchTerm from "./hooks/useSearchTerm";
import useSelectedNode from "./hooks/useSelectedNode";
import { findPathToNode } from "./utils/nodeUtils";

const Container = styled.div`
  height: 100%;
  display: grid;
  grid-template-rows: min-content 1fr;
  overflow: hidden;
  min-width: 250px;
  max-width: 400px;
  padding: 8px;
`;

const InfoMessage = styled.div`
  padding: 8px 16px;
  color: #666;
  font-size: 0.9em;
  text-align: center;
`;

const Tree = memo(({ data = [], config = {}, selectedId }) => {
  // Establecer valores por defecto para la configuración
  const resolvedConfig = useMemo(() => ({
    showAllOnSearch: true,
    initialVisibleCount: undefined,
    ...config,
  }), [config]);

  const {
    expandedNodes,
    handleToggleNode,
    handleToggleAll,
    manualExpandedNodes,
    searchExpandedNodes,
    manuallyClosedNodes,
    setManualExpandedNodes,
    setSearchExpandedNodes,
    setManuallyClosedNodes,
  } = useExpandedNodes(data);

  const { searchTerm, setSearchTerm } = useSearchTerm(data, manuallyClosedNodes, setSearchExpandedNodes);

  const { selectedNode, setSelectedNode } = useSelectedNode(data, selectedId, manuallyClosedNodes, setManualExpandedNodes);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);

  const filteredData = useMemo(() =>
    (resolvedConfig.filterNodes || defaultFilterNodes)(data, searchTerm, resolvedConfig),
    [data, searchTerm, resolvedConfig]
  );

  const visibleData = useMemo(() => {
    if (searchTerm) return filteredData;
    if (!searchTerm && resolvedConfig.initialVisibleCount) {
      return filteredData.slice(0, resolvedConfig.initialVisibleCount);
    }
    return filteredData;
  }, [filteredData, searchTerm, resolvedConfig]);

  // Precalcular mapa de path por id para evitar recomputes costosos
  const idToPath = useMemo(() => {
    const map = new Map();
    const dfs = (nodes, acc = []) => {
      nodes?.forEach(n => {
        const current = [...acc, n.id];
        map.set(n.id, current);
        if (n.children?.length) dfs(n.children, current);
      });
    };
    dfs(data, []);
    return map;
  }, [data]);

  return (
    <Container>
      <TreeHeader
        handleToggleAll={handleToggleAll}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        allExpanded={Object.keys(manualExpandedNodes || {}).length > 0}
      />
      <TreeContent filteredData={filteredData} selectedId={selectedId}>
        {visibleData.map((node) => {
          const path = idToPath.get(node.id) || findPathToNode(data, node.id) || [node.id];
          return (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              expandedNodes={expandedNodes}
              setExpandedNodes={setManualExpandedNodes}
              searchTerm={searchTerm}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              config={resolvedConfig}
              traverse={traverse}
              renderHighlightedText={renderHighlightedText}
              path={path}
              onNodeClick={handleNodeClick}
              onToggleNode={handleToggleNode}
            />
          );
        })}
        {!searchTerm && resolvedConfig.initialVisibleCount && filteredData.length > resolvedConfig.initialVisibleCount && (
          <InfoMessage>
            Mostrando {resolvedConfig.initialVisibleCount} de {filteredData.length} elementos. Use la búsqueda para ver más.
          </InfoMessage>
        )}
      </TreeContent>
    </Container>
  );
});

export default Tree;
