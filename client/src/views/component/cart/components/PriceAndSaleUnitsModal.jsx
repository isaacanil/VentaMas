import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Modal } from 'antd';
import { useListenSaleUnits } from '../../../../firebase/products/saleUnits/fbUpdateSaleUnit';
import { useFormatPrice } from '../../../../hooks/useFormatPrice';
import { getListPriceTotal, getTotalPrice } from '../../../../utils/pricing';
import { extraerPreciosConImpuesto } from './ProductCardForCart';

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

const PriceAndSaleUnitsModal = ({ isVisible, onClose, item, onSelectPrice, onSelectDefaultUnit, onSelectUnit }) => {
  const productId = item.id;
  const [selectedUnitId, setSelectedUnitId] = useState(item.defaultSaleUnitId || 'default');
  const [combinedPrices, setCombinedPrices] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [currentItem, setCurrentItem] = useState(item);
  const { data: saleUnits } = useListenSaleUnits(productId);

  const getDefaultPrice = (prices) => {
    return prices.find(price => price.type === 'listPrice') || prices[0];
  };
  
  const handleSelectUnit = (unit) => {
    setSelectedUnitId(unit.id);
    onSelectUnit(unit);

    const selectedItemPricing = unit.pricing;
    if (selectedItemPricing) {
      const prices = extraerPreciosConImpuesto(selectedItemPricing);
      const enabledPrices = prices.filter(price => price.enabled);
      
      // Obtener el precio por defecto
      const defaultPrice = getDefaultPrice(enabledPrices);
      setSelectedPrice(defaultPrice);

    }
  };

  const handleSelectDefaultUnit = () => {
    setSelectedUnitId('default');
    onSelectDefaultUnit(item);

    const selectedItemPricing = item.pricing;
    if (selectedItemPricing) {
      const prices = extraerPreciosConImpuesto(selectedItemPricing);
      const enabledPrices = prices.filter(price => price.enabled);
      
      // Obtener el precio por defecto
      const defaultPrice = getDefaultPrice(enabledPrices);
      setSelectedPrice(defaultPrice);
  
    }
  };

  const handleSelectPrice = (price) => {
    setSelectedPrice(price);
    onSelectPrice(price);
  };

  useEffect(() => {
    const selectedItemPricing = selectedUnitId === 'default' ? item.pricing : saleUnits?.find(unit => unit.id === selectedUnitId)?.pricing;
    if (selectedItemPricing) {
      const prices = extraerPreciosConImpuesto(selectedItemPricing);
      const enabledPrices = prices.filter(price => price.enabled);
      setCombinedPrices(enabledPrices);

      // Selecciona un precio por defecto (listPrice)
      const defaultPrice = enabledPrices.find(price => price.type === 'listPrice');

      setSelectedPrice(defaultPrice || prices[0]);
    }
  }, [selectedUnitId, saleUnits]);

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
        </div>

        {/* Precios */}
        <div>
          <SectionTitle>Selecciona un Precio</SectionTitle>
          <PriceOptions>
            {combinedPrices.map((price, index) => (
              <PriceOption
                key={index}
                selected={price.type === selectedPrice?.type}
                onClick={() => handleSelectPrice(price)}
              >
                <span>{price.label}: {useFormatPrice(price.valueWithTax)}</span>
              </PriceOption>
            ))}
          </PriceOptions>
        </div>
      </ModalContainer>
    </Modal>
  );
};

export default PriceAndSaleUnitsModal;

