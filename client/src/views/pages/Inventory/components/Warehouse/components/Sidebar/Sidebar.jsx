import styled from "styled-components";
import { faPlus, faEdit, faTrash, faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import Tree from "../../../../../../component/tree/Tree";
import { useDispatch, useSelector } from "react-redux";
import {
  navigateWarehouse,
  selectWarehouse,
} from "../../../../../../../features/warehouse/warehouseSlice";
import { openShelfForm } from "../../../../../../../features/warehouse/shelfModalSlice"; // Updated import
import { openRowShelfForm } from "../../../../../../../features/warehouse/rowShelfModalSlice"; // Updated import
import { WarehouseForm } from "../../forms/WarehouseForm/WarehouseForm";
import { deleteSegment } from "../../../../../../../firebase/warehouse/segmentService";
import { openSegmentForm } from "../../../../../../../features/warehouse/segmentModalSlice"; // Updated import
import { selectUser } from "../../../../../../../features/auth/userSlice";
import { Modal, message } from "antd";
import { deleteShelf } from "../../../../../../../firebase/warehouse/shelfService";
import { deleteRowShelf } from "../../../../../../../firebase/warehouse/RowShelfService";
import { deleteWarehouse } from "../../../../../../../firebase/warehouse/warehouseService"; // Ensure this function is imported
import {
  openWarehouseForm
} from "../../../../../../../features/warehouse/warehouseModalSlice"; // New import

// Estilo para el sidebar
const SidebarContainer = styled.div`
  padding: 10px;
  display: grid;
  height: 100%;
`;

// Función para obtener las acciones según el nivel
const getLevelActions = (level) => {
  const actionsByLevel = {
    0: { // Nivel Almacén
      create: "Crear Estante",
      edit: "Editar Almacén",
      delete: "Eliminar Almacén"
    },
    1: { // Nivel Estante
      create: "Crear Fila",
      edit: "Editar Estante",
      delete: "Eliminar Estante"
    },
    2: { // Nivel Fila
      create: "Crear Segmento",
      edit: "Editar Fila",
      delete: "Eliminar Fila"
    },
    3: { // Nivel Segmento
      edit: "Editar Segmento",
      delete: "Eliminar Segmento"
    }
  };

  return actionsByLevel[level] || actionsByLevel[0];
};

// Función para encontrar la ruta completa al nodo seleccionado
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

// Paso 1: Agregar un mapa de género para los tipos de nodos
const nodeGenderMap = {
  'Almacén': 'masculino',
  'Estante': 'masculino',
  'Fila': 'femenino',
  'Segmento': 'masculino',
};

const Sidebar = ({ onSelectNode, items }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { currentView, selectedWarehouse, selectedShelf, selectedRowShelf, selectedSegment } = useSelector(selectWarehouse);

  // Removed local state for form visibility and warehouse data

  const handleNodeClick = (node, level) => {
    const viewMap = {
      0: 'warehouse',
      1: 'shelf',
      2: 'rowShelf',
      3: 'segment',
      4: 'product'
    };

    // Encontrar la ruta completa al nodo seleccionado
    const path = findPathToNode(items, node.id);

    if (path) {
      // Iterar desde el primer padre hasta el nodo seleccionado
      path.forEach((currentNode, index) => {
        const selectedView = viewMap[index];
        const currentPath = path.slice(0, index + 1);
        dispatch(navigateWarehouse({
          view: selectedView,
          data: currentNode,
          // path: currentPath 
        }));
      });
    }
  };

  // Funciones para manejar acciones en estantes y filas
  const handleAddWarehouse = () => {
    dispatch(openWarehouseForm()); // Open form without initial data for creation
  };

  const handleUpdateWarehouse = (data) => {
    dispatch(openWarehouseForm(data)); // Open form with initial data for editing
  };

  const handleAddShelf = (parentNode) => dispatch(openShelfForm({ parentNode }));
  const handleUpdateShelf = (shelf) => dispatch(openShelfForm(shelf));

  const handleAddRowShelf = (parentNode) => dispatch(openRowShelfForm({ parentNode }));
  const handleUpdateRowShelf = (data) => dispatch(openRowShelfForm({ data }));

  const handleAddSegment = () => dispatch(openSegmentForm());
  const handleUpdateSegment = (segment) => dispatch(openSegmentForm(segment));

  // Definir la configuración de eliminación dinámica utilizando el camino completo
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

  // Actualizar la función handleDelete para usar deleteConfig con el camino completo
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

    // Obtener el camino completo al nodo
    const path = findPathToNode(items, node.id);

    if (!path) {
      message.error("Camino al nodo no encontrado");
      return;
    }

    // Paso 2: Obtener el género del tipo de nodo y seleccionar el artículo correcto
    const gender = nodeGenderMap[nodeType] || 'masculino'; // Predeterminado a masculino
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
          // Aquí puedes actualizar el estado o recargar los datos si es necesario
        } catch (error) {
          console.error(`Error al eliminar ${node.name}: `, error);
          message.error(`Error al eliminar ${node.name}`);
        }
      },
    });
  };

  // Configuración de acciones personalizada
  const config = {
    actions: [
      {
        name: "More",
        icon: faEllipsisH,
        type: 'dropdown',
        items: (node, level) => {
          const actions = getLevelActions(level);
          const menuItems = [];

          if (actions.create) {
            menuItems.push({
              name: actions.create,
              icon: faPlus,
              handler: (node, level) => {
                if (level === 0 && actions.create === "Crear Estante") {
                  handleAddShelf(node);
                } else if (level === 1 && actions.create === "Crear Fila") {
                  handleAddRowShelf(node);
                } else if (level === 0 && actions.create === "Crear Almacén") { // Changed from -1 to 0
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
                } else {
                  alert(`${actions.edit}: ${node.name}`);
                }
              },
            },
            {
              name: actions.delete,
              icon: faTrash,
              handler: (node, level) => handleDelete(node, level),
              danger: true // Use 'danger' property to highlight in red
            }
          );

          return menuItems;
        }
      },
    ],
    onNodeClick: handleNodeClick,
  };

  // Determinar el ID seleccionado basado en la vista actual
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

  return (
    <SidebarContainer>
      <Tree
        data={items}
        config={config}
        selectedId={getSelectedId()}
      />
      <WarehouseForm />
    </SidebarContainer>
  );
};

export default Sidebar;


