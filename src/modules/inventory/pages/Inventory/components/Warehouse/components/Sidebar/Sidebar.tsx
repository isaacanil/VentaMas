import { LoadingOutlined } from '@/constants/icons/antd';
import {
  faPlus,
  faEdit,
  faTrash,
  faEllipsisH,
} from '@fortawesome/free-solid-svg-icons';
import { Modal, message } from 'antd';
import { useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { openRowShelfForm } from '@/features/warehouse/rowShelfModalSlice';
import { openSegmentForm } from '@/features/warehouse/segmentModalSlice';
import { openShelfForm } from '@/features/warehouse/shelfModalSlice';
import { openWarehouseForm } from '@/features/warehouse/warehouseModalSlice';
import { selectWarehouse } from '@/features/warehouse/warehouseSlice';
import { getStockAggregatesByLocationPaths } from '@/firebase/warehouse/productStockService';
import { deleteRowShelf } from '@/firebase/warehouse/RowShelfService';
import { deleteSegment } from '@/firebase/warehouse/segmentService';
import { deleteShelf } from '@/firebase/warehouse/shelfService';
import { deleteWarehouse, useDefaultWarehouse } from '@/firebase/warehouse/warehouseService';
import { replacePathParams } from '@/router/routes/replacePathParams';
import ROUTES_PATH from '@/router/routes/routesName';
import Tree from '@/modules/inventory/components/tree/Tree';
import type { InventoryUser } from '@/utils/inventory/types';

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  border-right: 1px solid #eee;
`;

const TreeWrapper = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 0;
  padding: 10px 0;
`;

const SidebarSummaryFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 16px;
  font-size: 0.8rem;
  color: #f8fafc;
  background: rgb(15 23 42 / 92%);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgb(15 23 42 / 20%);
`;

const SummaryPrimary = styled.span`
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;
  color: #f8fafc;
`;

const SummaryHeader = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
`;

const SummaryStatus = styled.span<{ $loading: boolean }>`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 0.72rem;
  color: ${({ $loading }: { $loading: boolean }) => ($loading ? '#bfdbfe' : '#bef264')};
`;

type StockSummary = {
  totalUnits?: number;
  totalLots?: number;
  directUnits?: number;
  directLots?: number;
};

type StockSummaryMap = Record<string, StockSummary>;

type SidebarNodeRecord = {
  id: string;
  name?: string;
  type?: string;
  record?: Record<string, unknown> & { defaultWarehouse?: boolean };
  children?: SidebarNodeRecord[];
  stockSummary?: StockSummary;
  stockSummaryLoading?: boolean;
  parentId?: string | null;
  grandParentId?: string | null;
  greatGrandParentId?: string | null;
} & Record<string, unknown>;

type SidebarProps = {
  onSelectNode?: (node: SidebarNodeRecord) => void;
  items?: SidebarNodeRecord[];
};

type LevelActions = {
  create?: string;
  edit?: string;
  delete?: string;
};

const getLevelActions = (level: number): LevelActions => {
  const actionsByLevel: Record<number, LevelActions> = {
    0: {
      create: 'Crear Estante',
      edit: 'Editar Almacén',
      delete: 'Eliminar Almacén',
    },
    1: {
      create: 'Crear Fila',
      edit: 'Editar Estante',
      delete: 'Eliminar Estante',
    },
    2: {
      create: 'Crear Segmento',
      edit: 'Editar Fila',
      delete: 'Eliminar Fila',
    },
    3: {
      edit: 'Editar Segmento',
      delete: 'Eliminar Segmento',
    },
  };
  return actionsByLevel[level] || actionsByLevel[0];
};

const findPathToNode = (
  nodes: SidebarNodeRecord[],
  targetId: string,
  path: SidebarNodeRecord[] = [],
): SidebarNodeRecord[] | null => {
  for (const node of nodes) {
    const newPath = [...path, node];
    if (node.id === targetId) {
      return newPath;
    }
    if (node.children) {
      const result = findPathToNode(node.children, targetId, newPath);
      if (result) {
        return result;
      }
    }
  }
  return null;
};

const addParentIds = (
  nodes: SidebarNodeRecord[],
  parentId: string | null = null,
  grandParentId: string | null = null,
  greatGrandParentId: string | null = null,
): SidebarNodeRecord[] =>
  nodes.map((node) => {
    const newNode: SidebarNodeRecord = {
      ...node,
      parentId,
      grandParentId,
      greatGrandParentId,
    };
    if (node.children) {
      newNode.children = addParentIds(
        node.children,
        node.id,
        parentId,
        grandParentId,
      );
    }
    return newNode;
  });

const nodeGenderMap: Record<string, 'masculino' | 'femenino'> = {
  Almacén: 'masculino',
  Estante: 'masculino',
  Fila: 'femenino',
  Segmento: 'masculino',
};

const collectLocationPaths = (
  nodes: SidebarNodeRecord[] = [],
  parentPath: string[] = [],
): string[] => {
  const paths: string[] = [];
  nodes.forEach((node) => {
    const currentPath = [...parentPath, node.id];
    if (currentPath.length > 0) {
      paths.push(currentPath.join('/'));
    }
    if (node.children?.length) {
      paths.push(...collectLocationPaths(node.children, currentPath));
    }
  });
  return paths;
};

const Sidebar = ({ onSelectNode: _onSelectNode, items = [] }: SidebarProps) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as InventoryUser | null;
  const {
    currentView,
    selectedWarehouse,
    selectedShelf,
    selectedRowShelf,
    selectedSegment,
  } = useSelector(selectWarehouse);
  const navigate = useNavigate();
  const location = useLocation();
  const { defaultWarehouse, loading: loadingDefault } = useDefaultWarehouse();
  const [internalStockSummaries, setInternalStockSummaries] =
    useState<StockSummaryMap>({});
  const [loadingStockSummaries, setLoadingStockSummaries] = useState(false);

  const itemsWithParentIds = useMemo(
    () => addParentIds(items),
    [items],
  );
  const locationPaths = useMemo(() => {
    if (!items.length) return [];
    return Array.from(new Set(collectLocationPaths(items)));
  }, [items]);

  const stockSummaries = useMemo(() => {
    if (!user?.businessID || !locationPaths.length) {
      return {} as StockSummaryMap;
    }
    return internalStockSummaries;
  }, [user?.businessID, locationPaths.length, internalStockSummaries]);

  const itemsWithStockSummaries = useMemo(() => {
    const mergeSummaries = (
      nodes: SidebarNodeRecord[] = [],
      parentPath: string[] = [],
    ): SidebarNodeRecord[] =>
      nodes.map((node) => {
        const currentPath = [...parentPath, node.id];
        const locationKey = currentPath.join('/');
        const summary = stockSummaries[locationKey];
        const enrichedNode: SidebarNodeRecord = {
          ...node,
          stockSummary: summary,
          stockSummaryLoading: loadingStockSummaries && summary === undefined,
        };
        if (node.children) {
          enrichedNode.children = mergeSummaries(node.children, currentPath);
        }
        return enrichedNode;
      });

    return mergeSummaries(itemsWithParentIds);
  }, [itemsWithParentIds, stockSummaries, loadingStockSummaries]);

  const { WAREHOUSE, SHELF, ROW, SEGMENT } = ROUTES_PATH.INVENTORY_TERM;

  const handleWarehouseNodeClick = (node: SidebarNodeRecord, level: number) => {
    const path = findPathToNode(items, node.id);

    if (node && path) {
      switch (level) {
        case 0:
          navigate(replacePathParams(WAREHOUSE, node.id));
          break;
        case 1:
          navigate(replacePathParams(SHELF, [path[0].id, node.id]));
          break;
        case 2:
          navigate(replacePathParams(ROW, [path[0].id, path[1].id, node.id]));
          break;
        case 3:
          navigate(
            replacePathParams(SEGMENT, [
              path[0].id,
              path[1].id,
              path[2].id,
              node.id,
            ]),
          );
          break;
        default:
          message.error('Nivel de nodo desconocido');
      }
    }
  };

  const getDefaultWarehouseId = useCallback(() => {
    if (defaultWarehouse && typeof defaultWarehouse === 'object') {
      const defaultId = (defaultWarehouse as { id?: string }).id;
      if (defaultId) return defaultId;
    }
    if (!items.length) return 'default';
    const defaultFromItems = items.find(
      (warehouse) => warehouse.record?.defaultWarehouse === true,
    );
    return defaultFromItems?.id || items[0]?.id || 'default';
  }, [defaultWarehouse, items]);

  const handleAddWarehouse = () => {
    dispatch(openWarehouseForm() as any);
  };

  const handleUpdateWarehouse = (node: SidebarNodeRecord) => {
    const warehouseData = node?.record || null;
    dispatch(openWarehouseForm(warehouseData as any));
  };

  const handleAddShelf = (clickedNode: SidebarNodeRecord) => {
    const path = findPathToNode(items, clickedNode.id);
    if (!path) return;
    dispatch(
      openShelfForm({
        data: null,
        path: path.map((pathNode) => ({
          id: pathNode.id,
          name: pathNode.name,
        })),
      }),
    );
  };

  const handleAddRowShelf = (parentNode: SidebarNodeRecord) => {
    const path = findPathToNode(items, parentNode.id);
    if (!path) return;
    dispatch(
      openRowShelfForm({
        data: null,
        path: path.map((pathNode) => ({
          id: pathNode.id,
          name: pathNode.name,
        })),
      }),
    );
  };

  const handleAddSegment = (parentNode: SidebarNodeRecord) => {
    const path = findPathToNode(items, parentNode.id);
    if (!path) return;
    dispatch(
      openSegmentForm({
        data: null,
        path: path.map((pathNode) => ({
          id: pathNode.id,
          name: pathNode.name,
        })),
      }),
    );
  };

  const handleUpdateShelf = (node: SidebarNodeRecord) => {
    const path = findPathToNode(items, node.id);
    if (!path) return;
    dispatch(
      openShelfForm({
        data: node?.record as any,
        path: path.map((pathNode) => ({
          id: pathNode.id,
          name: pathNode.name,
        })),
      }),
    );
  };

  const handleUpdateRowShelf = (node: SidebarNodeRecord) => {
    const path = findPathToNode(items, node.id);
    if (!path) return;
    dispatch(
      openRowShelfForm({
        data: node?.record as any,
        path: path.map((pathNode) => ({
          id: pathNode.id,
          name: pathNode.name,
        })),
      }),
    );
  };

  const handleUpdateSegment = (node: SidebarNodeRecord) => {
    const path = findPathToNode(items, node.id);
    if (!path) return;
    dispatch(
      openSegmentForm({
        data: node?.record as any,
        path: path.map((pathNode) => ({
          id: pathNode.id,
          name: pathNode.name,
        })),
      }),
    );
  };

  const deleteConfig: Record<
    string,
    {
      deleteFn: (path: SidebarNodeRecord[], node: SidebarNodeRecord) => Promise<void>;
    }
  > = {
    Almacén: {
      deleteFn: async (_path, node) => {
        if (!user) return;
        const warehouseId = node.id;
        await deleteWarehouse(user, warehouseId);
      },
    },
    Estante: {
      deleteFn: async (path, node) => {
        if (!user) return;
        const warehouseId = path[0].id;
        const shelfId = node.id;
        await deleteShelf(user, shelfId);
      },
    },
    Fila: {
      deleteFn: async (path, node) => {
        if (!user) return;
        const warehouseId = path[0].id;
        const shelfId = path[1].id;
        const rowShelfId = node.id;
        await deleteRowShelf(user, warehouseId, shelfId, rowShelfId);
      },
    },
    Segmento: {
      deleteFn: async (path, node) => {
        if (!user) return;
        const warehouseId = path[0].id;
        const shelfId = path[1].id;
        const rowShelfId = path[2].id;
        const segmentId = node.id;
        await deleteSegment(user, warehouseId, shelfId, rowShelfId, segmentId);
      },
    },
  };

  const handleDelete = (node: SidebarNodeRecord, level: number) => {
    const nodeTypeMap: Record<number, string> = {
      0: 'Almacén',
      1: 'Estante',
      2: 'Fila',
      3: 'Segmento',
    };

    const nodeType = nodeTypeMap[level];
    if (!nodeType) {
      message.error('Tipo de nodo no soportado para eliminación');
      return;
    }

    const path = findPathToNode(items, node.id);

    if (!path) {
      message.error('Camino al nodo no encontrado');
      return;
    }

    const gender = nodeGenderMap[nodeType] || 'masculino';
    const article = gender === 'femenino' ? 'esta' : 'este';

    Modal.confirm({
      title: `Eliminar ${node.name}`,
      content: `¿Estás seguro de que deseas eliminar ${article} ${nodeType}?`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await deleteConfig[nodeType].deleteFn(path, node);
          message.success(`${node.name} eliminado correctamente`);
        } catch (error) {
          console.error(`Error al eliminar ${node.name}: `, error);
          message.error(`Error al eliminar ${node.name}`);
        }
      },
    });
  };

  const isDefaultWarehouse = (node: SidebarNodeRecord) => {
    return node?.record?.defaultWarehouse === true;
  };

  const defaultWarehouseTheme = {
    background: 'rgba(22, 119, 255, 0.12)',
    hoverBackground: 'rgba(22, 119, 255, 0.18)',
    selectedBackground: 'rgba(22, 119, 255, 0.24)',
    color: '#102a44',
    accentColor: '#1677ff',
    boxShadow: 'inset 0 0 0 1px rgba(22, 119, 255, 0.14)',
    label: 'Predeterminado',
    labelBackground: 'rgba(22, 119, 255, 0.22)',
    labelColor: '#0f172a',
  };

  const levelCounts = useMemo(() => {
    const counters: number[] = [];
    const traverse = (nodes: SidebarNodeRecord[] = [], depth = 0) => {
      nodes.forEach((node) => {
        counters[depth] = (counters[depth] || 0) + 1;
        if (node.children?.length) {
          traverse(node.children, depth + 1);
        }
      });
    };
    traverse(items, 0);
    return counters;
  }, [items]);

  const summaryData = useMemo(() => {
    const levelMetadata = [
      { singular: 'almacén', plural: 'almacenes' },
      { singular: 'estante', plural: 'estantes' },
      { singular: 'fila', plural: 'filas' },
      { singular: 'segmento', plural: 'segmentos' },
    ];

    const pluralize = (
      count: number,
      { singular, plural }: { singular: string; plural: string },
    ) => {
      if (count === 1) return `${count} ${singular}`;
      return `${count} ${plural}`;
    };

    const warehouseCount = levelCounts[0] || 0;
    const totalNodes = levelCounts.reduce((sum, count = 0) => sum + count, 0);
    const subLevelCounts = levelCounts.slice(1);

    const primaryText = warehouseCount
      ? pluralize(warehouseCount, levelMetadata[0])
      : 'Sin almacenes configurados';

    const subLevelParts = subLevelCounts
      .map((count = 0, index) => ({
        count,
        labelMeta:
          levelMetadata[index + 1] ||
          ({
            singular: `nivel ${index + 2}`,
            plural: `niveles ${index + 2}`,
          } as { singular: string; plural: string }),
      }))
      .filter(({ count }) => count > 0)
      .map(({ count, labelMeta }) => pluralize(count, labelMeta));

    const extraLocations = Math.max(totalNodes - warehouseCount, 0);

    const secondaryText = subLevelParts.length
      ? subLevelParts.join(' · ')
      : extraLocations > 0
        ? pluralize(extraLocations, {
          singular: 'ubicación adicional',
          plural: 'ubicaciones adicionales',
        })
        : '';

    return {
      primaryText,
      secondaryText,
      hasWarehouses: warehouseCount > 0,
      hasDetails: Boolean(secondaryText),
    };
  }, [levelCounts]);

  const sidebarSummaryFooter = useMemo<ReactNode | null>(() => {
    if (!summaryData.primaryText && !loadingStockSummaries) {
      return null;
    }

    return (
      <SidebarSummaryFooter>
        <SummaryHeader>
          {summaryData.primaryText && (
            <SummaryPrimary>{summaryData.primaryText}</SummaryPrimary>
          )}
        </SummaryHeader>
        {loadingStockSummaries && (
          <SummaryStatus $loading={loadingStockSummaries}>
            <LoadingOutlined spin />
            Sincronizando stock…
          </SummaryStatus>
        )}
      </SidebarSummaryFooter>
    );
  }, [summaryData, loadingStockSummaries]);

  const config: Record<string, unknown> = {
    showLocationStockSummary: true,
    actions: [
      {
        name: 'More',
        icon: faEllipsisH,
        type: 'dropdown',
        items: (node: SidebarNodeRecord, level: number) => {
          const actions = getLevelActions(level);
          const menuItems: Array<Record<string, unknown>> = [];
          const isDefault = level === 0 && isDefaultWarehouse(node);

          if (actions.create) {
            menuItems.push({
              name: actions.create,
              icon: faPlus,
              handler: (currentNode: SidebarNodeRecord, nodeLevel: number) => {
                if (nodeLevel === 0 && actions.create === 'Crear Estante') {
                  handleAddShelf(currentNode);
                } else if (nodeLevel === 1 && actions.create === 'Crear Fila') {
                  handleAddRowShelf(currentNode);
                } else if (
                  nodeLevel === 2 &&
                  actions.create === 'Crear Segmento'
                ) {
                  handleAddSegment(currentNode);
                } else if (
                  nodeLevel === 0 &&
                  actions.create === 'Crear Almacén'
                ) {
                  handleAddWarehouse();
                } else {
                  alert(`${actions.create} en: ${currentNode.name}`);
                }
              },
            });
          }

          menuItems.push(
            {
              name: actions.edit,
              icon: faEdit,
              handler: (currentNode: SidebarNodeRecord, nodeLevel: number) => {
                if (nodeLevel === 0 && actions.edit === 'Editar Almacén') {
                  handleUpdateWarehouse(currentNode);
                } else if (nodeLevel === 1 && actions.edit === 'Editar Estante') {
                  handleUpdateShelf(currentNode);
                } else if (nodeLevel === 2 && actions.edit === 'Editar Fila') {
                  handleUpdateRowShelf(currentNode);
                } else if (
                  nodeLevel === 3 &&
                  actions.edit === 'Editar Segmento'
                ) {
                  handleUpdateSegment(currentNode);
                }
              },
            },
            actions.delete && !isDefault
              ? {
                name: actions.delete,
                icon: faTrash,
                handler: (currentNode: SidebarNodeRecord, nodeLevel: number) =>
                  handleDelete(currentNode, nodeLevel),
                danger: true,
              }
              : null,
          );
          return menuItems.filter(Boolean) as any[];
        },
      },
    ],
    onNodeClick: handleWarehouseNodeClick,
    showMatchedStockCount: true,
    resolveNodeTheme: (node: SidebarNodeRecord, { level }: { level: number }) => {
      if (level === 0) {
        const isDefault =
          node?.record?.defaultWarehouse === true ||
          (defaultWarehouse as { id?: string } | null)?.id === node.id;
        if (isDefault) {
          return defaultWarehouseTheme;
        }
      }
      return null;
    },
    searchPlaceholder: 'Buscar almacén o ubicación...',
    footer: sidebarSummaryFooter,
    footerPlacement: 'sticky',
  };

  const getSelectedId = () => {
    switch (currentView) {
      case 'warehouse':
        return selectedWarehouse?.id;
      case 'shelf':
        return selectedShelf?.id;
      case 'rowShelf':
        return selectedRowShelf?.id;
      case 'segment':
        return selectedSegment?.id;
      default:
        return null;
    }
  };

  useEffect(() => {
    const path = location.pathname;
    if (
      path === '/inventory/warehouses' ||
      path === '/inventory/warehouses/warehouse/:warehouseId'
    ) {
      const defaultId = getDefaultWarehouseId();
      if (!loadingDefault) {
        navigate(`/inventory/warehouses/warehouse/${defaultId}`);
      }
    }
  }, [location.pathname, navigate, getDefaultWarehouseId, loadingDefault]);

  const fetchStockSummaries = useCallback(async () => {
    if (!user?.businessID || !locationPaths.length) {
      return;
    }

    setLoadingStockSummaries(true);

    try {
      if (!user) return;
      const summaries = (await getStockAggregatesByLocationPaths(
        user,
        locationPaths,
      )) as StockSummaryMap;
      setInternalStockSummaries(summaries);
    } catch (error) {
      console.error(
        'Error al obtener los agregados de stock para el sidebar:',
        error,
      );
      setInternalStockSummaries({});
    } finally {
      setLoadingStockSummaries(false);
    }
  }, [user, locationPaths]);

  useEffect(() => {
    fetchStockSummaries();
  }, [fetchStockSummaries]);

  return (
    <SidebarContainer>
      <TreeWrapper>
        <Tree
          data={itemsWithStockSummaries}
          config={config}
          selectedId={getSelectedId()}
        />
      </TreeWrapper>
    </SidebarContainer>
  );
};

export default Sidebar;

