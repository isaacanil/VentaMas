import { Modal, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { useListenSaleUnits } from '../../../../firebase/products/saleUnits/fbUpdateSaleUnit';
import { useFormatPrice } from '../../../../hooks/useFormatPrice';
import { getListPriceTotal, getTotalPrice } from '../../../../utils/pricing';

import { extraerPreciosConImpuesto } from './ProductCardForCart/utils/priceUtils';


// Estilos
const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5em;
`;

const SectionTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 10px;
`;

const PriceOption = styled.div`
  padding: 10px;
  cursor: pointer;
  border: ${({ selected }) => (selected ? '2px solid #1890ff' : '1px solid #ddd')};
  border-radius: 8px;
  background: ${({ selected }) => (selected ? '#e6f7ff' : 'white')};
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.3s ease;

  &:hover {
    background: #f0f0f0;
  }
`;

const SaleUnitsContainer = styled.div`
  padding: 0.6em;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background-color: #fafafa;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.6em;
`;

const SaleUnitCard = styled.div`
  padding: 15px;
  cursor: pointer;
  border-radius: 10px;
  border: ${({ selected }) => (selected ? '2px solid #1890ff' : '1px solid #ddd')};
  background: ${({ selected }) => (selected ? '#e6f7ff' : 'white')};
  transition: background 0.3s ease;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  &:hover {
    background: #f0f0f0;
  }
`;

const EmptySaleUnitsMessage = styled.div`
  color: #999;
  font-size: 1rem;
  text-align: center;
  margin-top: 10px;
`;

const PriceOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6em;
`;

const InfoMessage = styled.div`
  padding: 12px;
  background-color: #f0f8ff;
  border: 1px solid #d4edda;
  border-radius: 8px;
  color: #155724;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 10px;

  .info-button {
    margin-top: 10px;
  }
`;

const PriceAndSaleUnitsModal = ({ isVisible, onClose, item, onSelectPrice, onSelectDefaultUnit, onSelectUnit }) => {
  const productId = item.id;
  const [selectedUnitId, setSelectedUnitId] = useState(item.defaultSaleUnitId || 'default');
  const [combinedPrices, setCombinedPrices] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const { data: saleUnits } = useListenSaleUnits(productId);
  const navigate = useNavigate();

  // Función para navegar a la configuración del producto
  const handleGoToInventory = () => {
    navigate('/inventory/items');
  };

  // Función helper para determinar qué precio es el actual del producto en el carrito
  const getCurrentProductPrice = () => {
    // Si estamos en la unidad por defecto
    if (selectedUnitId === 'default') {
      const prices = extraerPreciosConImpuesto(item.pricing) || [];
      const listPriceVal = prices.find(p => p.type === 'listPrice')?.valueWithTax;
      const avgPriceVal = prices.find(p => p.type === 'avgPrice')?.valueWithTax;
      const minPriceVal = prices.find(p => p.type === 'minPrice')?.valueWithTax;
      // Calcula el precio actualizado con impuestos
      const currentPrice = getTotalPrice({ pricing: item.pricing });

      if (currentPrice === listPriceVal) return 'listPrice';
      if (currentPrice === avgPriceVal) return 'avgPrice';
      if (currentPrice === minPriceVal) return 'minPrice';
      
      return 'listPrice';
    } else {
      // Si estamos en una unidad de venta específica
      const selectedUnit = saleUnits?.find(unit => unit.id === selectedUnitId);
      if (!selectedUnit) return 'listPrice';
      
      const prices = extraerPreciosConImpuesto(selectedUnit.pricing) || [];
      const listPriceVal = prices.find(p => p.type === 'listPrice')?.valueWithTax;
      const avgPriceVal = prices.find(p => p.type === 'avgPrice')?.valueWithTax;
      const minPriceVal = prices.find(p => p.type === 'minPrice')?.valueWithTax;
      // Calcula el precio actualizado con impuestos para la unidad
      const currentPrice = getTotalPrice({ pricing: selectedUnit.pricing });

      if (currentPrice === listPriceVal) return 'listPrice';
      if (currentPrice === avgPriceVal) return 'avgPrice';
      if (currentPrice === minPriceVal) return 'minPrice';
      
      return 'listPrice';
    }
  };

  const getDefaultPrice = (prices) => {
    // Intentar determinar el tipo de precio actualmente seleccionado
    const currentPriceType = getCurrentProductPrice();
    
    // Buscar ese tipo de precio en los precios disponibles
    const currentPrice = prices.find(price => price.type === currentPriceType);
    
    // Si lo encontramos, usarlo; si no, usar listPrice o el primero disponible
    return currentPrice || prices.find(price => price.type === 'listPrice') || prices[0];
  };
  
  const handleSelectUnit = (unit) => {
    setSelectedUnitId(unit.id);
    onSelectUnit(unit);    const selectedItemPricing = unit.pricing;
    if (selectedItemPricing) {
      const prices = extraerPreciosConImpuesto(selectedItemPricing);
      // Filtrar precios habilitados y con valores válidos (mayor que 0)
      const enabledPrices = prices.filter(price => 
        price.enabled && 
        price.valueWithTax && 
        !isNaN(price.valueWithTax) && 
        price.valueWithTax > 0
      );
      
      // Obtener el precio por defecto
      const defaultPrice = getDefaultPrice(enabledPrices);
      setSelectedPrice(defaultPrice);
      
      // Llamar a onSelectPrice con el precio por defecto
      if (defaultPrice) {
        onSelectPrice(defaultPrice);
      }
    }
  };

  const handleSelectDefaultUnit = () => {
    setSelectedUnitId('default');
    onSelectDefaultUnit(item);    const selectedItemPricing = item.pricing;
    if (selectedItemPricing) {
      const prices = extraerPreciosConImpuesto(selectedItemPricing);
      // Filtrar precios habilitados y con valores válidos (mayor que 0)
      const enabledPrices = prices.filter(price => 
        price.enabled && 
        price.valueWithTax && 
        !isNaN(price.valueWithTax) && 
        price.valueWithTax > 0
      );
      
      // Obtener el precio por defecto
      const defaultPrice = getDefaultPrice(enabledPrices);
      setSelectedPrice(defaultPrice);
      
      // Llamar a onSelectPrice con el precio por defecto
      if (defaultPrice) {
        onSelectPrice(defaultPrice);
      }
    }
  };

  const handleSelectPrice = (price) => {
    setSelectedPrice(price);
    // Pasamos todo el objeto de precio para que ProductCardForCart pueda extraer los valores correctos
    onSelectPrice(price);
  };
  useEffect(() => {
    if (!isVisible) return; // No hacer nada si el modal no está visible
    
    const selectedItemPricing = selectedUnitId === 'default' ? item.pricing : saleUnits?.find(unit => unit.id === selectedUnitId)?.pricing;
    if (selectedItemPricing) {
      const prices = extraerPreciosConImpuesto(selectedItemPricing);
      // Filtrar precios habilitados y con valores válidos (mayor que 0)
      const enabledPrices = prices.filter(price => 
        price.enabled && 
        price.valueWithTax && 
        !isNaN(price.valueWithTax) && 
        price.valueWithTax > 0
      );
      setCombinedPrices(enabledPrices);

      // Determinar el precio a seleccionar basado en el precio actual del producto
      const defaultPrice = getDefaultPrice(enabledPrices);
      setSelectedPrice(defaultPrice);
    }
  }, [selectedUnitId, saleUnits, item, isVisible]);

  // Determina si un precio está seleccionado
  const isPriceSelected = (price) => {
    if (!selectedPrice) return false;
    return price.type === selectedPrice.type;
  };

  return (
    <Modal
      open={isVisible}
      title="Detalles del Producto"
      onCancel={onClose}
      footer={null}
      style={{ top: 10 }}
      width={500}
    >
      <ModalContainer>
        {/* Unidad por Defecto */}
        <div>
          <SectionTitle>Unidad por Defecto</SectionTitle>
          <SaleUnitCard
            selected={selectedUnitId === 'default'}
            onClick={handleSelectDefaultUnit}
          >
            <div>
              <p>{item?.name || 'Unidad por defecto'}</p>
              <p>Precio: {useFormatPrice(getListPriceTotal({ pricing: item?.pricing }))}</p>
            </div>
          </SaleUnitCard>
        </div>

        {/* Unidades de Venta */}
        <div>
          <SectionTitle>Unidades de Venta</SectionTitle>
          {saleUnits && saleUnits.length > 0 ? (
            <SaleUnitsContainer>
              {saleUnits.map((unit) => (
                <SaleUnitCard
                  key={unit.id}
                  selected={unit.id === selectedUnitId}
                  onClick={() => handleSelectUnit(unit)}
                >
                  <div>
                    <p>{unit?.unitName}</p>
                    <p>Precio: {useFormatPrice(getListPriceTotal({ pricing: unit?.pricing }))}</p>
                  </div>
                </SaleUnitCard>
              ))}
            </SaleUnitsContainer>
          ) : (
            <EmptySaleUnitsMessage>
              No hay unidades de venta configuradas.
            </EmptySaleUnitsMessage>
          )}
        </div>        {/* Precios */}        <div>
          <SectionTitle>Selecciona un Precio</SectionTitle>          {combinedPrices.length === 0 ? (
            <InfoMessage>
              📋 No hay precios configurados para esta unidad. Ve a la configuración del producto para establecer los precios.
              <div className="info-button">
                <Button 
                  type="primary" 
                  size="small" 
                  onClick={handleGoToInventory}
                >
                  Ir a Inventario
                </Button>
              </div>
            </InfoMessage>
          ) : combinedPrices.length === 1 ? (
            <InfoMessage>
               Solo hay un precio disponible para esta unidad. Para más opciones de precios, ve a la configuración del producto.
      
            </InfoMessage>
          ) : (
            <PriceOptions>
              {combinedPrices.map((price, index) => (
                <PriceOption
                  key={index}
                  selected={isPriceSelected(price)}
                  onClick={() => handleSelectPrice(price)}
                >
                  <span>{price.label}: {useFormatPrice(price.valueWithTax)}</span>
                </PriceOption>
              ))}
            </PriceOptions>
          )}
        </div>
   
      </ModalContainer>
    </Modal>
  );
};

export default PriceAndSaleUnitsModal;

