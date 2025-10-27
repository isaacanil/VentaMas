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
import { useGetProducts } from '../../../../../../../firebase/products/fbGetProducts';
import { getStockAggregatesByLocationPaths } from '../../../../../../../firebase/warehouse/productStockService';
import { deleteRowShelf } from "../../../../../../../firebase/warehouse/RowShelfService";
import { deleteSegment } from "../../../../../../../firebase/warehouse/segmentService";
import { deleteShelf } from "../../../../../../../firebase/warehouse/shelfService";
import { deleteWarehouse } from "../../../../../../../firebase/warehouse/warehouseService";
import { useDefaultWarehouse } from '../../../../../../../firebase/warehouse/warehouseService';
import { filterData } from '../../../../../../../hooks/search/useSearch';
import { replacePathParams } from '../../../../../../../routes/replacePathParams';
import ROUTES_PATH from '../../../../../../../routes/routesName';
import Tree from "../../../../../../component/tree/Tree";
import { WarehouseForm } from "../../forms/WarehouseForm/WarehouseForm";

const SidebarContainer = styled.div`
  padding: 10px 0em;
  display: grid;
  height: 100%;
  border-right: 1px solid #eee;
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

const Sidebar = ({ onSelectNode: _onSelectNode, items = [], productItems: _productItems = [] }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { currentView, selectedWarehouse, selectedShelf, selectedRowShelf, selectedSegment } = useSelector(selectWarehouse);
  const navigate = useNavigate();
  const location = useLocation();
  const { defaultWarehouse, loading: loadingDefault } = useDefaultWarehouse();
  const [search, _setSearch] = useState('');
  const [stockSummaries, setStockSummaries] = useState({});
  const [loadingStockSummaries, setLoadingStockSummaries] = useState(false);

  const { products } = useGetProducts(true);
  const filteredProducts = search ? filterData(products, search) : products;

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

  const { WAREHOUSE, SHELF, ROW, SEGMENT, PRODUCT_STOCK } = ROUTES_PATH.INVENTORY_TERM;
  const [displayProducts, setDisplayProducts] = useState(false);

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

  const handleProductNodeClick = (node) => {
    navigate(replacePathParams(PRODUCT_STOCK, [node.id]));
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
    };

  const productConfig = {
    actions: [],
    onNodeClick: handleProductNodeClick,
    showMatchedStockCount: true,
    initialVisibleCount: 10,
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

    // Set displayProducts based on the route
    if (path.includes('/products-stock') || path.includes('/product-stock-overview/')) {
      setDisplayProducts(true); // Show products
    } else {
      setDisplayProducts(false); // Show warehouses

      // Navigate to default warehouse if on base or placeholder route
      if (path === '/inventory/warehouses' || path === '/inventory/warehouses/warehouse/:warehouseId') {
        const defaultId = getDefaultWarehouseId();
        if (!loadingDefault) {
          navigate(`/inventory/warehouses/warehouse/${defaultId}`);
        }
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
      {/* Conditionally render the Tree component based on displayProducts */}
      {displayProducts ? (
        <Tree
          data={filteredProducts}
          config={productConfig}
          selectedId={getSelectedId()}
        />
      ) : (
        <Tree
          data={itemsWithStockSummaries}  // Use items enriched with stock summaries
          config={config}
          selectedId={getSelectedId()}
        />
      )}
      <WarehouseForm />
    </SidebarContainer>
  );
};

export default Sidebar;
