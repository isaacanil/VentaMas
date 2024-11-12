import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronRight, faSpinner, faEllipsisH, faBox, faCircle } from "@fortawesome/free-solid-svg-icons";
import { Input, Empty, Dropdown, Menu } from "antd";

// Estilos con styled-components
const Container = styled.div`
  font-family: Arial, sans-serif;
  height: 100%;
  display: grid;
  
  grid-template-rows: min-content 1fr;  
  resize: horizontal;
  overflow: hidden; // Required for resize to work
  min-width: 250px; // Optional: Set minimum width
  max-width: 400px; // Optional: Set maximum width

`;

const NodeContainer = styled.div`
  display: grid;
  grid-template-columns: min-content 1fr min-content; // Añade un espacio para los botones de acción
  align-items: center;
  margin: 0;
  padding: 0 0.2em;
  border-radius: 6px;
  background-color: ${(props) => (props.isSelected ? "#e9e9e9" : "transparent")};
  cursor: pointer;
  height: 40px;
  position: relative;
  width: 100%; // Asegura que el contenedor ocupe todo el ancho disponible
  overflow: hidden; // Oculta el contenido que se desborda

  &:hover {
    background-color: ${(props) => (props.isSelected ? "#f0f0f0" : "#f0f0f0")};
  }

  // Efecto de degradado para texto largo
  &::after {
    content: '';
    position: absolute;
    right: 35px; // Ajusta según el ancho de tus botones
    top: 0;
    height: 100%;
    width: 20px;
    background: linear-gradient(to right, transparent, ${props => props.isSelected ? "#e9e9e9" : "white"});
    pointer-events: none; // Permite hacer clic a través del degradado
  }

  &:hover::after {
    background: linear-gradient(to right, transparent, #f0f0f0);
  }
`;

const LevelIndicator = styled.div`
  width: 15px;
  height: 40px;
  border-right: 1px solid #e0e0e0;
  display: inline-block;
`;

const LevelContainer = styled.div`
  display: flex;
  align-items: center;
`;

const NodeContent = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0; // Importante para que el texto se trunque correctamente
  margin-right: 8px; // Espacio para el dropdown
`;

// Modificar el componente NodeName
const NodeName = styled.span`
  margin-left: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0; // Importante para que el texto se trunque correctamente
  padding-right: 8px; // Espacio para evitar que el texto toque el dropdown
`;

const Highlight = styled.span`
  background-color: #ffff00b5;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto; // Empuja los botones hacia la derecha
  flex-shrink: 0; // Evita que los botones se encojan
  position: relative; // Para mantener los botones siempre visibles
  z-index: 1; // Asegura que los botones estén sobre el texto
  background: inherit; // Hereda el color de fondo del contenedor padre
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  display: flex;
  cursor: pointer;
  margin-left: 5px;

  &:hover {
    color: #0056b3;
  }
`;

const GoBackButton = styled.button`
  background: none;
  border: none;
  display: flex;
  padding: 0;
  width: 1.4em;
  justify-content: center;
  cursor: pointer;

  &:hover {
    color: #0056b3;
  }
`;

const NodeIcon = styled(FontAwesomeIcon)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 8px; // Hacerlo más pequeño para el círculo
  height: 8px; // Hacerlo más pequeño para el círculo
  color: ${props => props.isSelected ? '#1890ff' : '#666'};
`;

// O alternativamente, usar un círculo personalizado:
const CircleIcon = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.isSelected ? '#1890ff' : '#666'};
  margin-right: 8px;
`;

// Crear un ícono personalizado más pequeño
const SmallIcon = styled(FontAwesomeIcon)`
  font-size: 0.6em; // Reducir el tamaño del ícono
`;

const Tree = ({ data, config, selectedId }) => {
  const [expandedNodes, setExpandedNodes] = useState({});
  const [selectedNode, setSelectedNode] = useState(selectedId);
  const [searchTerm, setSearchTerm] = useState(""); // Agregar este estado

  // Actualizar selectedNode cuando cambia selectedId
  useEffect(() => {
    setSelectedNode(selectedId);
    // Si hay un nuevo nodo seleccionado, asegurarse de que esté expandido
    if (selectedId) {
      expandNodePath(selectedId, data);
    }
  }, [selectedId, data]);

  // Función para expandir la ruta hasta un nodo
  const expandNodePath = (nodeId, nodes) => {
    const findAndExpandPath = (currentNodes, targetId, path = []) => {
      for (let node of currentNodes) {
        const currentPath = [...path, node.id];
        if (node.id === targetId) {
          // Encontrado el nodo, expandir toda la ruta
          setExpandedNodes(prev => ({
            ...prev,
            ...currentPath.reduce((acc, id) => ({ ...acc, [id]: true }), {})
          }));
          return true;
        }
        if (node.children && findAndExpandPath(node.children, targetId, currentPath)) {
          return true;
        }
      }
      return false;
    };

    findAndExpandPath(nodes, nodeId);
  };

  const toggleNode = (nodeId, nodes) => {
    setExpandedNodes((prevExpandedNodes) => {
      const newExpandedNodes = { ...prevExpandedNodes };
      const isExpanded = !prevExpandedNodes[nodeId];

      if (!isExpanded) {
        const collapseChildren = (nodeList) => {
          nodeList.forEach((node) => {
            if (node.id === nodeId) {
              if (node.children) {
                node.children.forEach((child) => {
                  newExpandedNodes[child.id] = false;
                  collapseChildren(child.children || []);
                });
              }
            } else if (node.children) {
              collapseChildren(node.children);
            }
          });
        };

        collapseChildren(nodes);
      }

      newExpandedNodes[nodeId] = isExpanded;
      return newExpandedNodes;
    });
  };

  const selectNode = (nodeId, node, level) => {
    setSelectedNode(nodeId);
    toggleNode(nodeId, data);
    if (config.onNodeClick) {
      config.onNodeClick(node, level); 
    }
  };

  const filterNodes = (nodes, term) => {
    if (!term) return nodes;
    const lowerTerm = term.toLowerCase();
    return nodes.reduce((acc, node) => {
      const nameMatch = node.name.toLowerCase().includes(lowerTerm);
      const productMatch = node.productStock && node.productStock.some(stock => stock.productName.toLowerCase().includes(lowerTerm));
      const hasMatchingChildren = node.children ? filterNodes(node.children, term).length > 0 : false;

      if (nameMatch || productMatch || hasMatchingChildren) {
        acc.push({
          ...node,
          children: node.children ? filterNodes(node.children, term) : [],
        });
      }
      return acc;
    }, []);
  };

  const expandMatchingNodes = (nodes, term) => {
    const newExpandedNodes = {};
    const lowerTerm = term.toLowerCase();

    const traverse = (nodes) => {
      nodes.forEach((node) => {
        const nameMatch = node.name.toLowerCase().includes(lowerTerm);
        const productMatch = node.productStock && node.productStock.some(stock => stock.productName.toLowerCase().includes(lowerTerm));
        const hasMatchingChildren = node.children && traverse(node.children);

        if (nameMatch || productMatch || hasMatchingChildren) {
          newExpandedNodes[node.id] = true;
        }
      });
      return Object.keys(newExpandedNodes).length > 0;
    };

    traverse(nodes);
    setExpandedNodes(newExpandedNodes);
  };

  useEffect(() => {
    expandMatchingNodes(data, searchTerm);
  }, [searchTerm, data]);

  const renderHighlightedText = (text, highlight) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? <Highlight key={index}>{part}</Highlight> : part
    );
  };

  const renderTree = (nodes, level = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedNodes[node.id];
      const hasChildren = node.children && node.children.length > 0;
      const isSelected = selectedNode === node.id;
      const match = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (node.productStock && node.productStock.some(stock => stock.productName.toLowerCase().includes(searchTerm.toLowerCase())));

      const getNodeIcon = () => {
        if (node.isLoading) return faSpinner;
        if (!hasChildren) return faCircle;
        return null;
      };

      return (
        <div key={node.id}>
          <NodeContainer
            isSelected={isSelected}
            onClick={() => selectNode(node.id, node, level)}
          >
            <LevelContainer>
              {Array.from({ length: level }).map((_, index) => (
                <LevelIndicator key={index} />
              ))}
            </LevelContainer>

            <NodeContent>
              <GoBackButton onClick={(e) => { e.stopPropagation(); toggleNode(node.id, data); }}>
                {hasChildren ? (
                  <FontAwesomeIcon
                    icon={isExpanded ? faChevronDown : faChevronRight}
                  />
                ) : (
                  <SmallIcon
                    icon={getNodeIcon()}
                    spin={node.isLoading}
                  />
                )}
              </GoBackButton>

              <NodeName 
                title={node.name}
                isMatch={match}
              >
                {node.isLoading 
                  ? 'Cargando' 
                  : searchTerm 
                    ? renderHighlightedText(node.name, searchTerm)
                    : node.name
                }
              </NodeName>
              {node.isLoading && (
                <FontAwesomeIcon icon={faSpinner} spin style={{ marginLeft: '5px' }} />
              )}
            </NodeContent>

            <ActionButtonsContainer>
              {config.actions.map((action) => {
                if (action.type === 'button') {
                  return (
                    <ActionButton
                      key={action.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.handler(node, level);
                      }}
                      title={action.name}
                    >
                      <FontAwesomeIcon icon={action.icon} />
                    </ActionButton>
                  );
                } else if (action.type === 'dropdown') {
                  const items = typeof action.items === 'function' 
                    ? action.items(node, level) 
                    : action.items;
                  
                  return (
                    <Dropdown
                      key={action.name}
                      overlay={
                        <Menu>
                          {items.map((item) => (
                            <Menu.Item
                              key={item.name}
                              onClick={(e) => {
                                e.domEvent.stopPropagation();
                                item.handler(node, level);
                              }}
                              danger={item.name.toLowerCase().includes('eliminar')} // Set danger for delete items
                            >
                              <FontAwesomeIcon icon={item.icon} style={{ marginRight: '5px' }} />
                              {item.name}
                            </Menu.Item>
                          ))}
                        </Menu>
                      }
                      trigger={['click']}
                    >
                      <ActionButton onClick={(e) => e.stopPropagation()} title={action.name}>
                        <FontAwesomeIcon icon={action.icon} />
                      </ActionButton>
                    </Dropdown>
                  );
                }
                return null;
              })}
            </ActionButtonsContainer>
          </NodeContainer>

          {isExpanded && hasChildren && renderTree(node.children, level + 1)}
        </div>
      );
    });
  };

  const filteredData = filterNodes(data, searchTerm);

  return (
    <Container>
      <Input
        placeholder="Buscar por nombre o producto..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: "10px" }}
      />

      {filteredData.length > 0 ? (
        <Items>
          {renderTree(filteredData)}
        </Items>
      ) : (
        <Empty description="No se encontraron elementos" />
      )}
    </Container>
  );
};

export default Tree;

const Items = styled.div`
  display: grid;
  overflow-x: hidden;
  overflow-y: auto;
  align-content: start;
  width: 100%;
`;
