import { faSpinner, faCircle } from '@fortawesome/free-solid-svg-icons';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { selectNode } from '../helpers/nodeHelper';

import ActionButtons from './ActionButtons';
import LevelGroup from './LevelGroup';
import { LoadingIndicator } from './LoadingIndicator';
import { NavigationButton } from './NavigationButton';
import NodeName from './NodeName';
import { formatLots } from './nodeName.helpers';
import type { TreeConfig, TreeNodeData, TreeNodeId, TreeNodeTheme } from '../types';

// Estilos con styled-components
const NodeContainer = styled.div`
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  align-items: center;
  margin: 0;
  padding: ${({ $hasLabel }) => ($hasLabel ? '6px 0.2em' : '0 0.2em')};
  border-radius: 6px;
  background-color: ${(props) =>
    props.isSelected ? '#e9e9e9' : 'transparent'};
  cursor: pointer; /* Replace the 'not-allowed' logic */
  opacity: 1; /* Remove the disabled opacity */
  min-height: ${({ $hasLabel }) => ($hasLabel ? '48px' : '40px')};
  height: auto;
  position: relative;
  width: 100%;
  overflow: hidden;

  &:hover {
    background-color: ${(props) =>
      !props.disabled && (props.isSelected ? '#f0f0f0' : '#f0f0f0')};
  }
`;

const CountPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  background-color: ${({ $empty }) =>
    $empty ? 'rgba(148, 163, 184, 0.18)' : 'rgba(22, 119, 255, 0.15)'};
  color: ${({ $empty }) => ($empty ? '#6b7280' : '#1677ff')};
`;

const ActionsSlot = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

type ExpandedMap = Record<string, boolean>;

type TreeNodeProps = {
  node: TreeNodeData;
  level: number;
  expandedNodes: ExpandedMap;
  setExpandedNodes: React.Dispatch<React.SetStateAction<ExpandedMap>>;
  searchTerm: string;
  selectedNode: TreeNodeId | null;
  setSelectedNode: (id: TreeNodeId | null) => void;
  config: TreeConfig<TreeNodeData>;
  traverse: (
    node: TreeNodeData | null | undefined,
    term: string,
    path: TreeNodeId[],
    found: boolean,
    newExpandedKeys: Set<TreeNodeId>,
  ) => boolean;
  renderHighlightedText: (text: string, highlight: string) => React.ReactNode;
  path?: TreeNodeId[];
  onToggleNode: (nodeId: TreeNodeId) => void;
};

const TreeNode = ({
  node,
  level,
  expandedNodes,
  setExpandedNodes,
  searchTerm,
  selectedNode,
  setSelectedNode,
  config,
  traverse,
  renderHighlightedText,
  path, // Agregar 'path' como prop
  onToggleNode, // Add onToggleNode prop
}: TreeNodeProps) => {
  const isExpanded = expandedNodes[node.id] || false;
  const hasChildren = !!node.children?.length;
  const isSelected = selectedNode === node.id;
  const themeStyles = useMemo<TreeNodeTheme | null>(() => {
    if (node?.theme) return node.theme;
    if (typeof config?.resolveNodeTheme === 'function') {
      return config.resolveNodeTheme(node, { level, isSelected, isExpanded });
    }
    return null;
  }, [config, node, level, isSelected, isExpanded]);

  const match = useMemo(() => {
    const nameMatch = node.name
      ? node.name.toLowerCase().includes(searchTerm.toLowerCase())
      : false;
    const productMatch =
      node.productStock &&
      node.productStock.some((stock) =>
        (stock.productName || '').toLowerCase().includes(searchTerm.toLowerCase()),
      );
    return Boolean(nameMatch || productMatch);
  }, [node.name, node.productStock, searchTerm]);

  const getNodeIcon = useCallback(() => {
    if (node.isLoading) return faSpinner;
    if (!hasChildren) return faCircle;
    return null;
  }, [node.isLoading, hasChildren]);

  const handleToggle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (hasChildren && !node.isLoading) {
        onToggleNode(node.id);
      }
    },
    [hasChildren, node.id, node.isLoading, onToggleNode],
  );

  const currentPath = useMemo<TreeNodeId[]>(
    () => [...(path || []), node.id],
    [path, node.id],
  );

  const showSummary = Boolean(config?.showLocationStockSummary);
  const safeStockSummary =
    node.stockSummary && typeof node.stockSummary === 'object'
      ? node.stockSummary
      : null;
  const directLots = safeStockSummary?.directLots;
  const hasDirectInfo = Number.isFinite(directLots);
  let pillLabel = null;
  let pillEmpty = false;

  if (showSummary) {
    if (node.stockSummaryLoading) {
      pillLabel = '...';
      pillEmpty = false;
    } else if (hasDirectInfo) {
      pillLabel = formatLots(directLots);
      pillEmpty = (directLots ?? 0) <= 0;
    }
  }

  return (
    <div>
      <NodeContainer
        isSelected={isSelected}
        $hasLabel={Boolean(themeStyles?.label)}
        onClick={() =>
          selectNode({
            nodeId: node.id,
            node,
            level,
            config,
            selectedNode,
            setSelectedNode,
            setExpandedNodes,
            onNodeClick: config.onNodeClick,
          })
        }
      >
        <LevelGroup level={level} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
            gap: 6,
          }}
        >
          <NavigationButton
            getNodeIcon={getNodeIcon}
            isExpanded={isExpanded}
            isSelected={isSelected}
            hasChildren={hasChildren}
            isLoading={node.isLoading}
            node={node}
            onClick={handleToggle}
          />
          <NodeName
            title={node.name}
            isMatch={match}
            isLoading={node.isLoading}
            searchTerm={searchTerm}
            config={config}
            matchedStockCount={node.matchedStockCount}
            stockSummary={safeStockSummary}
            stockSummaryLoading={node.stockSummaryLoading}
            renderHighlightedText={renderHighlightedText}
            themeStyles={themeStyles}
            extraDetails={node.extraDetails}
            tooltipDetails={node.tooltipDetails}
          />
          <LoadingIndicator isLoading={node.isLoading} />
        </div>
        <ActionsSlot>
          {pillLabel && <CountPill $empty={pillEmpty}>{pillLabel}</CountPill>}
          <ActionButtons
            node={node}
            actions={config.actions}
            level={level}
            path={currentPath}
          />
        </ActionsSlot>{' '}
        {/* Usar 'path' prop */}
      </NodeContainer>

      {isExpanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            level={level + 1}
            expandedNodes={expandedNodes}
            setExpandedNodes={setExpandedNodes}
            searchTerm={searchTerm}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            config={config}
            traverse={traverse}
            renderHighlightedText={renderHighlightedText}
            path={currentPath}
            onToggleNode={onToggleNode} // Ensure onToggleNode is passed to children
          />
        ))}
    </div>
  );
};

export default TreeNode;
