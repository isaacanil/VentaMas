import React, { useMemo, useCallback, memo, type ReactNode } from 'react';
import styled from 'styled-components';

import TreeContent from './components/TreeContent';
import TreeHeader from './components/TreeHeader';
import TreeNode from './components/TreeNode';
import useExpandedNodes from './hooks/useExpandedNodes';
import useSearchTerm from './hooks/useSearchTerm';
import useSelectedNode from './hooks/useSelectedNode';
import { defaultFilterNodes } from './utils/filterUtils';
import { findPathToNode } from './utils/nodeUtils';
import { renderHighlightedText } from './utils/textUtils';
import { traverse } from './utils/traverseUtils';

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 250px;
  max-width: 400px;
  height: 100%;
  padding: 8px;
`;

const ContentWrapper = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

const InfoMessage = styled.div`
  padding: 8px 16px;
  font-size: 0.9em;
  color: #666;
  text-align: center;
`;

const FooterContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
`;

const FooterOverlay = styled.div`
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: inline-flex;
  max-width: calc(100% - 24px);
  pointer-events: none;
`;

export type TreeFooterPlacement = 'static' | 'sticky' | 'overlay';

export type TreeConfig = {
  showAllOnSearch?: boolean;
  initialVisibleCount?: number;
  showToggleAllButton?: boolean;
  headerActions?: any[];
  footer?: ReactNode;
  renderFooter?: (context: any) => ReactNode;
  searchPlaceholder?: string;
  showInitialVisibleInfoMessage?: boolean;
  footerPlacement?: TreeFooterPlacement;
  filterNodes?: (data: any[], searchTerm: string, config: TreeConfig) => any[];
  onNodeClick?: (node: any, level?: number) => void;
  resolveNodeTheme?: (node: any, context: any) => unknown;
  [key: string]: unknown;
};

type TreeProps = {
  data?: any[];
  config?: TreeConfig;
  selectedId?: string | number | null;
  loading?: boolean;
  loadingText?: string;
};

const Tree = memo<TreeProps>(
  ({
    data = [],
    config = {},
    selectedId,
    loading = false,
    loadingText = 'Cargando...',
  }: TreeProps) => {
    // Establecer valores por defecto para la configuración
    const resolvedConfig = useMemo<TreeConfig>(
      () => ({
        showAllOnSearch: true,
        initialVisibleCount: undefined,
        showToggleAllButton: true,
        headerActions: [],
        footer: null,
        renderFooter: undefined,
        searchPlaceholder: 'Buscar por nombre o producto...',
        showInitialVisibleInfoMessage: true,
        footerPlacement: 'static',
        ...config,
      }),
      [config],
    );

    const {
      expandedNodes,
      handleToggleNode,
      handleToggleAll,
      manualExpandedNodes,
      manuallyClosedNodes,
      setManualExpandedNodes,
      setSearchExpandedNodes,
    } = useExpandedNodes(data);

    const { searchTerm, setSearchTerm } = useSearchTerm(
      data,
      manuallyClosedNodes,
      setSearchExpandedNodes,
    );

    const { selectedNode, setSelectedNode } = useSelectedNode(
      data,
      selectedId,
      manuallyClosedNodes,
      setManualExpandedNodes,
    );

    const filteredData = useMemo(
      () =>
        (resolvedConfig.filterNodes || defaultFilterNodes)(
          data,
          searchTerm,
          resolvedConfig,
        ),
      [data, searchTerm, resolvedConfig],
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
        nodes?.forEach((n) => {
          map.set(n.id, acc);
          if (n.children?.length) dfs(n.children, [...acc, n.id]);
        });
      };
      dfs(data, []);
      return map;
    }, [data]);

    const footerContext = useMemo(
      () => ({
        data,
        filteredData,
        visibleData,
        searchTerm,
        selectedNode,
        loading,
        config: resolvedConfig,
      }),
      [
        data,
        filteredData,
        visibleData,
        searchTerm,
        selectedNode,
        loading,
        resolvedConfig,
      ],
    );

    const footerContent = useMemo(() => {
      if (typeof resolvedConfig.renderFooter === 'function') {
        return resolvedConfig.renderFooter(footerContext);
      }
      return resolvedConfig.footer ?? null;
    }, [resolvedConfig, footerContext]);

    const footerPlacement = resolvedConfig.footerPlacement;
    const staticFooter = footerPlacement === 'static' ? footerContent : null;
    const stickyFooter = footerPlacement === 'sticky' ? footerContent : null;
    const overlayFooter = footerPlacement === 'overlay' ? footerContent : null;

    return (
      <Container>
        <TreeHeader
          handleToggleAll={handleToggleAll}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          allExpanded={Object.keys(manualExpandedNodes || {}).length > 0}
          headerActions={resolvedConfig.headerActions}
          showToggleAllButton={resolvedConfig.showToggleAllButton}
          searchPlaceholder={resolvedConfig.searchPlaceholder}
        />
        <ContentWrapper>
          <TreeContent
            filteredData={filteredData}
            selectedId={selectedId}
            loading={loading}
            loadingText={loadingText}
            footerPlacement={footerPlacement}
            footerContent={stickyFooter}
          >
            {visibleData.map((node) => {
              const path =
                idToPath.get(node.id) ??
                (() => {
                  const fullPath = findPathToNode(data, node.id) || [];
                  return fullPath.slice(0, Math.max(fullPath.length - 1, 0));
                })();
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
                  onToggleNode={handleToggleNode}
                />
              );
            })}
            {!searchTerm &&
              resolvedConfig.initialVisibleCount &&
              resolvedConfig.showInitialVisibleInfoMessage &&
              filteredData.length > resolvedConfig.initialVisibleCount && (
                <InfoMessage>
                  Mostrando {resolvedConfig.initialVisibleCount} de{' '}
                  {filteredData.length} elementos. Use la búsqueda para ver más.
                </InfoMessage>
              )}
          </TreeContent>
        </ContentWrapper>
        {staticFooter ? (
          <FooterContainer>{staticFooter}</FooterContainer>
        ) : null}
        {overlayFooter ? <FooterOverlay>{overlayFooter}</FooterOverlay> : null}
      </Container>
    );
  },
);

Tree.displayName = 'Tree';

export default Tree;
