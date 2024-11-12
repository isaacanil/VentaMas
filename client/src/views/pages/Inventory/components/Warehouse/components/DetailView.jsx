import React, { useState } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { selectWarehouse, navigateWarehouse, navigateToBreadcrumb } from "../../../../../../features/warehouse/warehouseSlice";
import { Button, Card, Input, Table, DatePicker, Breadcrumb } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTransformedWarehouseData } from '../../../../../../firebase/warehouse/warehouseNestedServise';

// Styled components
const DetailContainer = styled.div`
  flex: 1;
  padding: 20px;
  width: 100%;
`;

const DetailTitle = styled.h3`
  margin-top: 0;
  font-size: 1.5em;
  color: #2c3e50;
`;

const DetailContent = styled.div`
  margin-top: 10px;
  color: #333;
  font-size: 1em;
`;

// Componente principal
export const DetailView = ({ items }) => {
  const dispatch = useDispatch();
  const { 
    selectedWarehouse, 
    selectedShelf, 
    selectedRowShelf, 
    selectedSegment, 
    selectedProduct,
    breadcrumbs 
  } = useSelector(selectWarehouse);
  
  const [searchTerm, setSearchTerm] = useState("");

  // Determinar el nodo actual basado en las selecciones
  const currentNode = selectedProduct || selectedSegment || selectedRowShelf || selectedShelf || selectedWarehouse || null;

  // Columnas y datos para las tablas
  const inventoryColumns = [
    { title: "Producto", dataIndex: "product", key: "product" },
    { title: "Cantidad Existente", dataIndex: "quantity", key: "quantity", align: "right" },
    { title: "Batch", dataIndex: "batch", key: "batch" },
    { title: "Fecha de Vencimiento", dataIndex: "expiryDate", key: "expiryDate" },
    {
      title: "Acciones",
      key: "actions",
      align: "right",
      render: () => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <Button icon={<EyeOutlined />} size="small" />
          <Button icon={<EditOutlined />} size="small" />
          <Button icon={<DeleteOutlined />} size="small" />
        </div>
      ),
    },
  ];

  const inventoryData = currentNode && currentNode.productStock
    ? currentNode.productStock
        .filter(stock => 
          stock.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
          stock.batch.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((stock, index) => ({
          key: index.toString(),
          product: stock.productName || 'Producto sin nombre',
          quantity: stock.stock || 0,
          batch: stock.batch || 'N/A',
          expiryDate: stock.expiryDate || 'N/A',
        }))
    : [];

  const movementsColumns = [
    { title: "Fecha", dataIndex: "date", key: "date" },
    { title: "Producto", dataIndex: "product", key: "product" },
    { title: "Entrada/Salida", dataIndex: "movement", key: "movement" },
    { title: "Origen/Destino", dataIndex: "origin", key: "origin" },
    { title: "Cantidad", dataIndex: "quantity", key: "quantity", align: "right" },
    {
      title: "Acciones",
      key: "actions",
      align: "right",
      render: () => <Button icon={<EyeOutlined />} size="small" />,
    },
  ];

  const movementsData = [
    { key: "1", date: "2024-01-15", product: "Acetaminofen", movement: "Entrada", origin: "Almacén Central", quantity: 50 },
    { key: "2", date: "2024-01-14", product: "Ciprofloxacina", movement: "Salida", origin: "Farmacia A", quantity: 25 },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      {/* Breadcrumb actualizado */}
      {breadcrumbs.length > 0 && (
        <Breadcrumb style={{ marginBottom: "16px" }}>
          {breadcrumbs.map((item, index) => (
            <Breadcrumb.Item key={index}>
              <span 
                onClick={() => dispatch(navigateToBreadcrumb(index))}
                style={{ cursor: 'pointer', color: '#1890ff' }}
              >
                {item.title}
              </span>
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      )}

      {!currentNode ? (
        <DetailContent>Selecciona un elemento para ver los productos</DetailContent>
      ) : (
        <>
          {/* Contenido cuando se selecciona un elemento */}
          <DetailContainer>
            <DetailTitle>{currentNode.name}</DetailTitle>
            <DetailContent>
              <p>ID: {currentNode.id}</p>
            </DetailContent>
          </DetailContainer>
          <Card 
            title={`Gestión de Inventario - ${currentNode.type || 'Sin selección'}`} 
            style={{ marginBottom: "24px" }}
          >
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Input 
                placeholder="Buscar por Producto o Batch" 
                style={{ flex: 1 }} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <DatePicker.RangePicker
                onChange={(dates) => setDateRange(dates)}
                placeholder={["Fecha inicio", "Fecha fin"]}
                style={{ flex: 1 }}
              />
            </div>

            <Table
              columns={inventoryColumns}
              dataSource={inventoryData}
              pagination={false}
              style={{ marginTop: "16px" }}
            />
          </Card>

          <Card title="Últimos Movimientos">
            <Table columns={movementsColumns} dataSource={movementsData} pagination={false} />
          </Card>
          {/* ...otros componentes... */}
        </>
      )}
    </div>
  );
};

export default DetailView;
