import { useState, useEffect } from 'react'
import { Modal, Button, Input, Empty, Spin } from 'antd'
import { SearchOutlined, CheckCircleOutlined, CalendarOutlined, BoxPlotOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux';
import { selectProductStockSimple, closeProductStockSimple } from '../../../../../../../features/productStock/productStockSimpleSlice';
import { useListenProductsStock } from '../../../../../../../firebase/warehouse/productStockService';
import { useLocationNames } from '../../../../../../../hooks/useLocationNames';
import { addProduct, SelectCartData } from '../../../../../../../features/cart/cartSlice';

const StyledWrapper = styled.div`
  .batch-select-button {
    background: linear-gradient(145deg, #2563eb, #1d4ed8);
    border: none;
    padding: 10px 20px;
    border-radius: 12px;
    color: white;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
    }
  }
`

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
  }



  .search-container {
    margin-bottom: 16px;
  }
`

const BatchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  padding: 12px 0;
  max-height: 60vh;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 4px;
  }
`

const LocationBadge = styled.span`
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #475569;
  margin-bottom: 4px;
  display: inline-block;
  
  &:hover {
    background: #e2e8f0;
  }
`

const BatchCard = styled.div`
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid ${props => props.selected ? '#2563eb' : '#e2e8f0'};
  box-shadow: ${props => props.selected ? '0 4px 12px rgba(37, 99, 235, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.05)'};
  display: flex;
  flex-direction: column;
  gap: 4px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    /* padding-bottom: 2px; */
    /* border-bottom: 1px solid #e2e8f0; */
  }

  .card-content {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 12px;
  }

  .locations-column {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-column {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 12px;
    border-left: 1px solid #e2e8f0;
  }

  .batch-number {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: #64748b;

    .icon {
      min-width: 16px;
      color: #94a3b8;
    }

    .text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .quantity {
    color: #2563eb;
    font-weight: 500;
  }

  .check-icon {
    color: #2563eb;
    opacity: ${props => props.selected ? 1 : 0};
    transform: ${props => props.selected ? 'scale(1)' : 'scale(0.5)'};
    transition: all 0.2s ease;
    font-size: 18px;
  }
`

export function ProductBatchModal() {
    const dispatch = useDispatch();
    const { isOpen, productId, product } = useSelector(selectProductStockSimple);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [searchText, setSearchText] = useState('');
    const {products} = useSelector(SelectCartData);
    
    // Obtener datos de productStock en tiempo real
    const { data: productStocks, loading } = useListenProductsStock(productId);
    const { locationNames, fetchLocationName } = useLocationNames();

    const filteredBatches = productStocks.filter(stock =>
        stock.batchNumberId.toString().toLowerCase().includes(searchText.toLowerCase()) ||
        stock.location.toLowerCase().includes(searchText.toLowerCase())
    );
    

    useEffect(() => {
        const uniqueLocations = [...new Set(filteredBatches.map(stock => stock.location).filter(Boolean))];
        uniqueLocations.forEach(loc => {
            if (!locationNames[loc]) {
                fetchLocationName(loc);
            }
        });
    }, [filteredBatches, locationNames, fetchLocationName]);

    useEffect(() => {
        if (products.length === 0) {
            setSelectedBatch(null);
        }
    }, [products.length]);

    // Modificar la función formatLocation
    function formatLocation(locationId) {
        if (!locationId) return '';
        return locationNames[locationId] || 'Cargando...';
    }

    const handleBatchToggle = (batchId) => {
        setSelectedBatch(selectedBatch === batchId ? null : batchId);
    };

    const handleConfirm = () => {
        if (selectedBatch) {
            const chosenStock = productStocks.find(s => s.id === selectedBatch);
            dispatch(addProduct({ ...product, productStockId: chosenStock?.id, batchId: chosenStock?.batchId, stock: chosenStock.quantity }));
            dispatch(closeProductStockSimple());
        }
    };

    return (
        <StyledModal
            open={isOpen}
            onCancel={() => dispatch(closeProductStockSimple())}
            title="Seleccionar Ubicación del Producto"
            width={800}
            style={{ top: 10 }}
            footer={
                <Button
                    type="primary"
                    onClick={handleConfirm}
                    disabled={!selectedBatch}
                    style={{
                        background: '#2563eb',
                        borderRadius: '8px',
                        height: '40px'
                    }}
                >
                    Confirmar
                </Button>
            }
        >
            <div className="search-container">
                <Input
                    placeholder="Buscar por número de lote o ubicación..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ borderRadius: '8px' }}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin />
                </div>
            ) : filteredBatches.length > 0 ? (
                <BatchGrid>
                    {filteredBatches.map(stock => (
                        <BatchCard
                            key={stock.id}
                            selected={selectedBatch === stock.id}
                            onClick={() => handleBatchToggle(stock.id)}
                        >
                            <div className="card-header">
                                <div className="batch-number">
                                    Lote #{stock.batchNumberId}
                                    <CheckCircleOutlined className="check-icon" />
                                </div>
                            </div>
                            <div className="card-content">
                                <div className="locations-column">
                                    <LocationBadge>
                                        {formatLocation(stock.location)}
                                    </LocationBadge>
                                </div>
                                <div className="info-column">
                                    <div className="info-row quantity">
                                        <span className="text">{stock.quantity} unidades</span>
                                    </div>
                                    <div className="info-row">
                                        <CalendarOutlined className="icon" />
                                        <span className="text">
                                            {stock.expirationDate 
                                                ? new Date(stock.expirationDate.seconds * 1000).toLocaleDateString()
                                                : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </BatchCard>
                    ))}
                </BatchGrid>
            ) : (
                <Empty
                    description="No se encontraron lotes"
                    style={{ margin: '40px 0' }}
                />
            )}
        </StyledModal>
    );
}
