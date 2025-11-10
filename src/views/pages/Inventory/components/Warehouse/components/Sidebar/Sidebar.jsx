import { LoadingOutlined } from "@ant-design/icons";
import { faPlus, faEdit, faTrash, faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import { Modal, message } from "antd";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom';
import styled from "styled-components";

import { selectUser } from "../../../../../../../features/auth/userSlice";
import { openRowShelfForm } from "../../../../../../../features/warehouse/rowShelfModalSlice";
import { openSegmentForm } from "../../../../../../../features/warehouse/segmentModalSlice";
import { openShelfForm } from "../../../../../../../features/warehouse/shelfModalSlice";
import {
  openWarehouseForm
} from "../../../../../../../features/warehouse/warehouseModalSlice";
import {
  selectWarehouse,
} from "../../../../../../../features/warehouse/warehouseSlice";
import { getStockAggregatesByLocationPaths } from '../../../../../../../firebase/warehouse/productStockService';
import { deleteRowShelf } from "../../../../../../../firebase/warehouse/RowShelfService";
import { deleteSegment } from "../../../../../../../firebase/warehouse/segmentService";
import { deleteShelf } from "../../../../../../../firebase/warehouse/shelfService";
import { deleteWarehouse } from "../../../../../../../firebase/warehouse/warehouseService";
import { useDefaultWarehouse } from '../../../../../../../firebase/warehouse/warehouseService';
import { replacePathParams } from '../../../../../../../routes/replacePathParams';
import ROUTES_PATH from '../../../../../../../routes/routesName';
import Tree from "../../../../../../component/tree/Tree";
import { WarehouseForm } from "../../forms/WarehouseForm/WarehouseForm";

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid #eee;
  min-width: 0;
`;

const TreeWrapper = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  padding: 10px 0;
  display: flex;
`;

const SidebarSummaryFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 16px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.92);
  color: #f8fafc;
  font-size: 0.8rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
`;

const SummaryPrimary = styled.span`
  font-weight: 600;
  color: #f8fafc;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const SummarySecondary = styled.span`
  color: #e2e8f0;
  font-size: 0.75rem;
`;

const SummaryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const SummaryStatus = styled.span`
  color: ${({ $loading }) => ($loading ? '#bfdbfe' : '#bef264')};
  font-size: 0.72rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const SummaryToggleButton = styled.button`
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #f1f5f9;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

// Function to get level actions (no change needed here)
const getLevelActions = (level) => {
    const actionsByLevel = {
        0: { // Warehouse Level
            create: "Crear Estante",
            edit: "Editar Almacén",
            delete: "Eliminar Almacén"
        },
        1: { // Shelf Level
            create: "Crear Fila",
            edit: "Editar Estante",
            delete: "Eliminar Estante"
        },
        2: { // Row Level
            create: "Crear Segmento",
            edit: "Editar Fila",
            delete: "Eliminar Fila"
        },
        3: { // Segment Level
            edit: "Editar Segmento",
            delete: "Eliminar Segmento"
        }
    };
    return actionsByLevel[level] || actionsByLevel[0];
};

// Function to find the full path to the selected node (no change needed)
const findPathToNode = (nodes, targetId, path = []) => {
  for (let node of nodes) {
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

const addParentIds = (nodes, parentId = null, grandParentId = null, greatGrandParentId = null) => {
  return nodes.map(node => {
    const newNode = {
      ...node,
      parentId,
      grandParentId,
      greatGrandParentId,
    };
    if (node.children) {
      newNode.children = addParentIds(node.children, node.id, parentId, grandParentId);
    }
    return newNode;
  });
};

const nodeGenderMap = {
  'Almacén': 'masculino',
  'Estante': 'masculino',
  'Fila': 'femenino',
  'Segmento': 'masculino',
};

const collectLocationPaths = (nodes = [], parentPath = []) => {
  const paths = [];
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

const Sidebar = ({ onSelectNode: _onSelectNode, items = [] }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { currentView, selectedWarehouse, selectedShelf, selectedRowShelf, selectedSegment } = useSelector(selectWarehouse);
  const navigate = useNavigate();
  const location = useLocation();
  const { defaultWarehouse, loading: loadingDefault } = useDefaultWarehouse();
  const [stockSummaries, setStockSummaries] = useState({});
  const [loadingStockSummaries, setLoadingStockSummaries] = useState(false);
  const [isSummaryExpanded, setSummaryExpanded] = useState(false);

  const itemsWithParentIds = useMemo(() => addParentIds(items), [items]);
  const locationPaths = useMemo(() => {
    if (!items?.length) return [];
    return Array.from(new Set(collectLocationPaths(items)));
  }, [items]);
  const itemsWithStockSummaries = useMemo(() => {
    const mergeSummaries = (nodes = [], parentPath = []) => {
      return nodes.map((node) => {
        const currentPath = [...parentPath, node.id];
        const locationKey = currentPath.join('/');
        const summary = stockSummaries[locationKey];
        const enrichedNode = {
          ...node,
          stockSummary: summary,
          stockSummaryLoading: loadingStockSummaries && summary === undefined,
        };
        if (node.children) {
          enrichedNode.children = mergeSummaries(node.children, currentPath);
        }
        return enrichedNode;
      });
    };
    return mergeSummaries(itemsWithParentIds);
  }, [itemsWithParentIds, stockSummaries, loadingStockSummaries]);

  const { WAREHOUSE, SHELF, ROW, SEGMENT } = ROUTES_PATH.INVENTORY_TERM;

  const handleWarehouseNodeClick = (node, level) => {
      const path = findPathToNode(items, node.id);

      if (node && path) {
          switch (level) {
              case 0: // Warehouse level
                  navigate(replacePathParams(WAREHOUSE, node.id));
                  break;
              case 1: // Shelf level
                  navigate(replacePathParams(SHELF, [path[0].id, node.id]));
                  break;
              case 2: // Row level
                  navigate(replacePathParams(ROW, [path[0].id, path[1].id, node.id]));
                  break;
              case 3: // Segment level
                  navigate(replacePathParams(SEGMENT, [
                      path[0].id,
                      path[1].id,
                      path[2].id,
                      node.id
                  ]));
                  break;
              default:
                  message.error("Nivel de nodo desconocido");
          }
      }
  };

  const getDefaultWarehouseId = useCallback(() => {
    if (defaultWarehouse) {
      return defaultWarehouse.id;
    }
    if (!items || items.length === 0) return 'default';
    const defaultFromItems = items.find(warehouse => warehouse.record?.defaultWarehouse === true);
    return defaultFromItems?.id || items[0]?.id || 'default';
  }, [defaultWarehouse, items]);


    // --- Action Handlers (No changes needed) ---
    const handleAddWarehouse = () => {
        dispatch(openWarehouseForm());
    };

    const handleUpdateWarehouse = (node) => {
        const warehouseData = node?.record || null;
        dispatch(openWarehouseForm(warehouseData));
    };

    const handleAddShelf = (clickedNode) => {
        const path = findPathToNode(items, clickedNode.id);
        dispatch(openShelfForm({
            data: null,
            path: path.map(pathNode => ({ id: pathNode.id, name: pathNode.name })),
        }));
    };

    const handleAddRowShelf = (parentNode) => {
        const path = findPathToNode(items, parentNode.id);
        dispatch(openRowShelfForm({
            data: null,
            path: path.map(pathNode => ({ id: pathNode.id, name: pathNode.name })),
        }));
    };

    const handleAddSegment = (parentNode) => {
        const path = findPathToNode(items, parentNode.id);
        dispatch(openSegmentForm({
            data: null,
            path: path.map(pathNode => ({ id: pathNode.id, name: pathNode.name })),
        }));
    };

    const handleUpdateShelf = (node) => {
        const path = findPathToNode(items, node.id);
        dispatch(openShelfForm({
            data: node?.record || null,
            path: path.map(pathNode => ({ id: pathNode.id, name: pathNode.name })),
        }));
    };
      const handleUpdateRowShelf = (node) => {
        const path = findPathToNode(items, node.id);
        dispatch(openRowShelfForm({
            data: node?.record || null,
            path: path.map(pathNode => ({ id: pathNode.id, name: pathNode.name })),
        }));
    };

    const handleUpdateSegment = (node) => {
        const path = findPathToNode(items, node.id);
        dispatch(openSegmentForm({
            data: node?.record || null,
            path: path.map(pathNode => ({ id: pathNode.id, name: pathNode.name })),
        }));
    };

    const deleteConfig = {
        Almacén: {
            deleteFn: async (path, node) => {
                const warehouseId = node.id;
                await deleteWarehouse(user, warehouseId);
            },
        },
        Estante: {
            deleteFn: async (path, node) => {
                const warehouseId = path[0].id;
                const shelfId = node.id;
                await deleteShelf(user, warehouseId, shelfId);
            },
        },
        Fila: {
            deleteFn: async (path, node) => {
                const warehouseId = path[0].id;
                const shelfId = path[1].id;
                const rowShelfId = node.id;
                await deleteRowShelf(user, warehouseId, shelfId, rowShelfId);
            },
        },
        Segmento: {
            deleteFn: async (path, node) => {
                const warehouseId = path[0].id;
                const shelfId = path[1].id;
                const rowShelfId = path[2].id;
                const segmentId = node.id;
                await deleteSegment(user, warehouseId, shelfId, rowShelfId, segmentId);
            },
        },
    };

    const handleDelete = (node, level) => {
        const nodeTypeMap = {
            0: 'Almacén',
            1: 'Estante',
            2: 'Fila',
            3: 'Segmento',
        };

        const nodeType = nodeTypeMap[level];
        if (!nodeType) {
            message.error("Tipo de nodo no soportado para eliminación");
            return;
        }

        const path = findPathToNode(items, node.id);

        if (!path) {
            message.error("Camino al nodo no encontrado");
            return;
        }

        const gender = nodeGenderMap[nodeType] || 'masculino';
        const article = gender === 'femenino' ? 'esta' : 'este';

        Modal.confirm({
            title: `Eliminar ${node.name}`,
            content: `¿Estás seguro de que deseas eliminar ${article} ${nodeType}?`,
            okText: "Eliminar",
            okType: "danger",
            cancelText: "Cancelar",
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

    const isDefaultWarehouse = (node) => {
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
        const counters = [];
        const traverse = (nodes = [], depth = 0) => {
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

        const pluralize = (count, { singular, plural }) => {
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
                labelMeta: levelMetadata[index + 1] || {
                    singular: `nivel ${index + 2}`,
                    plural: `niveles ${index + 2}`,
                },
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

    useEffect(() => {
        if (!summaryData.hasDetails) {
            setSummaryExpanded(false);
        }
    }, [summaryData.hasDetails]);

    const sidebarSummaryFooter = useMemo(() => {
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

    const config = {
        showLocationStockSummary: true,
        actions: [
            {
                name: "More",
                icon: faEllipsisH,
                type: 'dropdown',
                items: (node, level) => {
                    const actions = getLevelActions(level);
                    const menuItems = [];
                    const isDefault = level === 0 && isDefaultWarehouse(node);

                    if (actions.create) {
                        menuItems.push({
                            name: actions.create,
                            icon: faPlus,
                            handler: (node, level) => {
                                if (level === 0 && actions.create === "Crear Estante") {
                                    handleAddShelf(node);
                                } else if (level === 1 && actions.create === "Crear Fila") {
                                    handleAddRowShelf(node);
                                } else if (level === 2 && actions.create === "Crear Segmento") {
                                    handleAddSegment(node);
                                } else if (level === 0 && actions.create === "Crear Almacén") {
                                    handleAddWarehouse();
                                } else {
                                    alert(`${actions.create} en: ${node.name}`);
                                }
                            },
                        });
                    }

                    menuItems.push(
                        {
                            name: actions.edit,
                            icon: faEdit,
                            handler: (node, level) => {
                                if (level === 0 && actions.edit === "Editar Almacén") {
                                    handleUpdateWarehouse(node);
                                } else if (level === 1 && actions.edit === "Editar Estante") {
                                    handleUpdateShelf(node);
                                } else if (level === 2 && actions.edit === "Editar Fila") {
                                    handleUpdateRowShelf(node);
                                } else if (level === 3 && actions.edit === "Editar Segmento") {
                                    handleUpdateSegment(node);
                                }
                            },
                        },
                        actions.delete && !isDefault
                            ? {
                                name: actions.delete,
                                icon: faTrash,
                                handler: (node, level) => handleDelete(node, level),
                                danger: true
                              }
                            : null
                    );
                    return menuItems.filter(Boolean);
                }
            },
        ],
        onNodeClick: handleWarehouseNodeClick,
        showMatchedStockCount: true,
        resolveNodeTheme: (node, { level }) => {
            if (level === 0) {
                const isDefault = node?.record?.defaultWarehouse === true || defaultWarehouse?.id === node.id;
                if (isDefault) {
                    return defaultWarehouseTheme;
                }
            }
            return null;
        },
        searchPlaceholder: "Buscar almacén o ubicación...",
        footer: sidebarSummaryFooter,
        footerPlacement: "sticky",
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
    if (path === '/inventory/warehouses' || path === '/inventory/warehouses/warehouse/:warehouseId') {
      const defaultId = getDefaultWarehouseId();
      if (!loadingDefault) {
        navigate(`/inventory/warehouses/warehouse/${defaultId}`);
      }
    }
  }, [location.pathname, navigate, getDefaultWarehouseId, loadingDefault]);

  useEffect(() => {
    if (!user?.businessID) {
      setStockSummaries({});
      setLoadingStockSummaries(false);
      return;
    }

    if (!locationPaths.length) {
      setStockSummaries({});
      setLoadingStockSummaries(false);
      return;
    }

    let isActive = true;
    setLoadingStockSummaries(true);

    getStockAggregatesByLocationPaths(user, locationPaths)
      .then((summaries) => {
        if (!isActive) return;
        setStockSummaries(summaries);
      })
      .catch((error) => {
        console.error('Error al obtener los agregados de stock para el sidebar:', error);
        if (!isActive) return;
        setStockSummaries({});
      })
      .finally(() => {
        if (!isActive) return;
        setLoadingStockSummaries(false);
      });

    return () => {
      isActive = false;
    };
  }, [user, locationPaths]);

  return (
    <SidebarContainer>
      <TreeWrapper>
        <Tree
          data={itemsWithStockSummaries}
          config={config}
          selectedId={getSelectedId()}
        />
      </TreeWrapper>
      <WarehouseForm />
    </SidebarContainer>
  );
};

export default Sidebar;
