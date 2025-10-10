import { DeleteOutlined, SwapOutlined, ClearOutlined, SearchOutlined, UnorderedListOutlined, EllipsisOutlined, SortAscendingOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Button, Input, DatePicker, Form, Dropdown } from 'antd';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Add this import
import styled from 'styled-components';

import { selectUser } from '../../../../../../../../features/auth/userSlice';
import { openDeleteModal } from '../../../../../../../../features/productStock/deleteProductStockSlice';
import { getBatchById } from '../../../../../../../../firebase/warehouse/batchService';
import { useListenProductsStockByLocation } from '../../../../../../../../firebase/warehouse/productStockService';
import DateUtils from '../../../../../../../../utils/date/dateUtils';
import { AdvancedTable } from '../../../../../../../templates/system/AdvancedTable/AdvancedTable';

import BatchViewModal from './BatchViewModal';
import { ProductMovementModal } from './ProductMovementModal';



const Container = styled.div`
  margin-bottom: 24px;
  min-height: 400px;
  display: grid;
  grid-template-rows: min-content min-content 1fr;

  border-radius: 8px;
  background-color: #fff;
`;

const Title = styled.h2`
  margin-bottom: 1em;
  font-size: 1.1em;
  font-weight: 600;
`;

const TitleSection = styled.div`
/* padding: 1em 0; */
`;

const SearchContainer = styled(Form)`
  display: grid;
  grid-template-columns: min-content min-content min-content min-content;
  align-items: end;
  gap: 16px;
  /* margin-bottom: 24px; */
`;

const SearchInput = styled(Input)`
  width: 300px;

  .ant-input-prefix {
    color: #8c8c8c;
    margin-right: 8px;
  }
`;

const StyledDateRangePicker = styled(DatePicker.RangePicker)`
  width: 230px;
`;

const ClearButton = styled(Button)`
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  
  &:hover {
    background: #e8e8e8;
    border-color: #d9d9d9;
    color: #ff4d4f;
  }
`;

const ActionContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
`;

const ActionButton = styled(Button)`
  &.ant-btn {
    padding: 4px 8px;
    
    &:hover {
      background-color: #f5f5f5;
    }
  }
`;

const MenuItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  
  .anticon {
    font-size: 14px;
  }
`;

const SortButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 8px;
  
  .anticon {
    font-size: 14px;
  }
`;

export const InventoryTable = ({ currentNode, searchTerm, setSearchTerm, setDateRange, location, warehouseData }) => {
  const navigate = useNavigate(); // Add this hook
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { data: productsStock, loading } = useListenProductsStockByLocation(location);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    field: null,
    order: null
  });
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const handleMove = (record) => {
    setSelectedProduct(record); // Pass the entire record instead of just the product name
    setMoveModalVisible(true);
  };

  const handleMoveSubmit = (values) => {
    setMoveModalVisible(false);
  };

  const handleDateRangeChange = (dates) => {
    setDateFilter(dates);
    setDateRange(dates);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFilter(null);
    setDateRange(null);
  };

  const handleViewProductStock = (productId) => {
    navigate(`/inventory/warehouses/products-stock/${productId}`);
  };
  const handleDeleteBatch = (record) => {
    dispatch(openDeleteModal({
      productStockId: record.id,
      batchId: record.batchId,
      actionType: 'productStock',
    }));
  };

  const handleViewBatch = async (batchId) => {
    const batchData = await getBatchById(user, batchId);
    if (batchData) {
      setSelectedBatch(batchData);
      setBatchModalVisible(true);
    }
  };

  const getActionMenu = (record) => ({
    items: [
      {
        key: 'view-stock',
        label: (
          <MenuItemContent>
            <UnorderedListOutlined />
            Ver todas las ubicaciones
          </MenuItemContent>
        ),
        onClick: () => handleViewProductStock(record.productId)
      },
      {
        key: 'move',
        label: (
          <MenuItemContent>
            <SwapOutlined />
            Mover producto
          </MenuItemContent>
        ),
        onClick: () => handleMove(record)
      },
      {
        key: 'delete',
        danger: true,
        label: (
          <MenuItemContent>
            <DeleteOutlined />
            Eliminar batch
          </MenuItemContent>
        ),
        onClick: () => handleDeleteBatch(record)
      }
    ]
  });

  const sortOptions = [
    {
      key: 'productName-asc',
      label: 'Nombre de Producto (A-Z)',
      onClick: () => handleSort('productName', 'asc')
    },
    {
      key: 'productName-desc',
      label: 'Nombre de Producto (Z-A)',
      onClick: () => handleSort('productName', 'desc')
    },
    {
      key: 'batchNumberId-asc',
      label: 'Número de Lote (Ascendente)',
      onClick: () => handleSort('batchNumberId', 'asc')
    },
    {
      key: 'expirationDate-asc',
      label: 'Fecha de Vencimiento (Próximos)',
      onClick: () => handleSort('expirationDate', 'asc')
    },
    {
      key: 'expirationDate-desc',
      label: 'Fecha de Vencimiento (Lejanos)',
      onClick: () => handleSort('expirationDate', 'desc')
    },
    {
      key: 'createdAt-desc',
      label: 'Más recientes primero',
      onClick: () => handleSort('createdAt', 'desc')
    },
    {
      key: 'createdAt-asc',
      label: 'Más antiguos primero',
      onClick: () => handleSort('createdAt', 'asc')
    }
  ];

  const handleSort = (field, order) => {
    setSortConfig({ field, order });
  };

  const getSortedData = (data) => {
    if (!sortConfig.field) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (sortConfig.field === 'expirationDate' || sortConfig.field === 'createdAt') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.order === 'desc' ? -comparison : comparison;
    });
  };

  const columns = [
    {
      Header: "Producto",
      accessor: "productName",
      minWidth: "200px",
    },
    {
      Header: "Cantidad Existente",
      accessor: "quantity",
      align: "right",
      minWidth: "100px",
    },
    {
      Header: "Batch",
      accessor: "batch",
      minWidth: "150px",
      cell: ({ value }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{"# " + value.batchNumberId || 'N/A'}</span>
          {value.batchId && (
            <Button
              type="text"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleViewBatch(value.batchId);
              }}
            />
          )}
        </div>
      ),
    },
    {
      Header: "Fecha de Vencimiento",
      accessor: "expiryDate",
      minWidth: "150px",
    },
    {
      Header: "Acciones",
      accessor: "actions",
      align: "right",
      minWidth: "80px",
      cell: ({ value }) => (
        <ActionContainer>
          <Dropdown
            menu={getActionMenu(value)}
            placement="bottomRight"
            trigger={['click']}
          >
            <ActionButton
              icon={<EllipsisOutlined />}
              size="small"
            />
          </Dropdown>
        </ActionContainer>
      ),
    },
  ];

  const inventoryData = productsStock
    ? getSortedData(productsStock
      .filter(stock => {
        // Filtro por término de búsqueda
        if (searchTerm) {
          const productNameMatch = stock.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
          const batchMatch = stock.batch?.toString().toLowerCase().includes(searchTerm.toLowerCase()) || false;
          if (!productNameMatch && !batchMatch) return false;
        }

        // Filtro por rango de fechas
        if (dateFilter && dateFilter[0] && dateFilter[1]) {
          const startDate = dateFilter[0].startOf('day').valueOf();
          const endDate = dateFilter[1].endOf('day').valueOf();

          // Si no hay fecha de vencimiento y hay filtro de fechas, no mostrar
          if (!stock.expirationDate) return false;

          const expirationDate = stock.expirationDate;
          return expirationDate >= startDate && expirationDate <= endDate;
        }

        return true;
      })
      .map((stock) => ({
        id: stock.id,           // Asegurarnos de incluir el id del productStock
        key: stock.id,
        productName: stock.productName || 'Producto sin nombre', // Changed from product to productName
        productId: stock.productId || '',
        quantity: stock.quantity || 0,
        batch: { batchNumberId: stock.batchNumberId || 'N/A', batchId: stock.batchId || null },
        batchId: stock.batchId || null,
        actions: stock, // Pass the entire stock object
        expiryDate: stock?.expirationDate ? DateUtils.convertMillisToISODate(stock?.expirationDate) : 'N/A',
        // Incluir todos los campos originales que necesitemos
        ...stock  // Opcionalmente, incluir todos los campos originales
      })))
    : [];



  return (
    <>
      <Container>
        <TitleSection>
          <Title>Gestión de Inventario</Title>
        </TitleSection>
        <SearchContainer layout="vertical">
          <Form.Item>
            <SearchInput
              prefix={<SearchOutlined />}
              placeholder="Buscar por Producto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Form.Item>
          <Form.Item label="Fecha de Vencimiento:">
            <StyledDateRangePicker
              onChange={handleDateRangeChange}
              placeholder={["Inicio", "Fin"]}
              value={dateFilter}
              format="DD/MM/YYYY"
            />
          </Form.Item>
          <Form.Item>
            <Dropdown menu={{ items: sortOptions }} placement="bottomRight">
              <SortButton icon={<SortAscendingOutlined />}>
                Ordenar por
              </SortButton>
            </Dropdown>
          </Form.Item>
          <Form.Item>
            <ClearButton
              icon={<ClearOutlined />}
              onClick={() => {
                handleClearFilters();
                setSortConfig({ field: null, order: null });
              }}
              title="Limpiar filtros"
            >
              Limpiar
            </ClearButton>
          </Form.Item>
        </SearchContainer>

        <AdvancedTable
          columns={columns}
          data={inventoryData}
          loading={loading}
          numberOfElementsPerPage={8}
          emptyText="No hay registros para mostrar"
        />
      </Container>

      <ProductMovementModal
        visible={moveModalVisible}
        onCancel={() => setMoveModalVisible(false)}
        onOk={handleMoveSubmit}
        product={selectedProduct}
        currentNode={currentNode}
      />

      <BatchViewModal
        visible={batchModalVisible}
        onClose={() => setBatchModalVisible(false)}
        batchData={selectedBatch}
      />
    </>
  );
};
