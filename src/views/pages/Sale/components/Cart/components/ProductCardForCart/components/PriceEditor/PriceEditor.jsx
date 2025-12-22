import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

import { icons } from '../../../../../../../../../constants/icons/icons';
import { changeProductPrice } from '../../../../../../../../../features/cart/cartSlice';
import { selectTaxReceiptEnabled } from '../../../../../../../../../features/taxReceipt/taxReceiptSlice';
import { useUserAccess } from '../../../../../../../../../hooks/abilities/useAbilities';
import {
  getPriceTotal,
  getPriceWithoutTax,
} from '../../../../../../../../../utils/pricing';


export const PriceEditor = ({ item, onModalOpen }) => {
  const dispatch = useDispatch();
  const { abilities, loading } = useUserAccess();
  const canModifyPrice = abilities.can('modify', 'Price');
  const canReadPriceList = abilities.can('read', 'PriceList');
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);

  const [inputPrice, setInputPrice] = useState(
    getPriceTotal(item, taxReceiptEnabled),
  );
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  useEffect(() => {
    setInputPrice(getPriceTotal(item, taxReceiptEnabled));
  }, [item, taxReceiptEnabled]);

  const handlePriceChange = (e) => {
    const newValue = e.target.value.replace(/[^0-9.]/g, '');
    setInputPrice(newValue);
  };

  const handlePriceBlur = () => {
    if (isEditingPrice && canModifyPrice) {
      // Convertir el precio con impuesto a precio sin impuesto
      const priceWithoutTax = getPriceWithoutTax(
        parseFloat(inputPrice),
        item.pricing.tax,
        taxReceiptEnabled,
      );

      // Despachar el cambio al estado con el precio sin impuesto
      dispatch(
        changeProductPrice({
          id: item.id,
          price: priceWithoutTax,
        }),
      );

      setIsEditingPrice(false);
    }
  };

  const handlePriceFocus = () => {
    if (canModifyPrice && !item?.weightDetail?.isSoldByWeight) {
      setIsEditingPrice(true);
    }
  };

  const handleModalOpen = () => {
    if (canReadPriceList) {
      onModalOpen();
    }
  };

  // Si está cargando los permisos, mostrar estado de carga
  if (loading) {
    return (
      <PriceContainer>
        <div style={{ padding: '8px', textAlign: 'center' }}>Cargando...</div>
      </PriceContainer>
    );
  }

  return (
    <PriceContainer>
      <DropdownButton
        onClick={handleModalOpen}
        disabled={!canReadPriceList}
        title={
          !canReadPriceList
            ? 'No tienes permisos para ver la lista de precios'
            : 'Ver lista de precios'
        }
      >
        <CaretIcon>{icons.arrows.caretDown}</CaretIcon>
      </DropdownButton>
      <PriceInput
        disabled={!canModifyPrice || item?.weightDetail?.isSoldByWeight}
        type="text"
        value={isEditingPrice ? inputPrice : formatPrice(inputPrice)}
        onChange={handlePriceChange}
        onBlur={handlePriceBlur}
        onFocus={handlePriceFocus}
        readOnly={!canModifyPrice || item?.weightDetail?.isSoldByWeight}
        title={
          !canModifyPrice ? 'No tienes permisos para modificar precios' : ''
        }
      />
    </PriceContainer>
  );
};

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 32px;
  overflow: hidden;
  background-color: #f5f5f7;
  border: 1px solid #ddd;
  border-radius: 8px;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 100%;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  background-color: #f5f5f5;
  border: none;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  transition: background-color 0.2s;

  &&:hover {
    background-color: ${(props) => (props.disabled ? '#f5f5f5' : '#eaeaea')};
  }
`;

const CaretIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const PriceInput = styled.input`
  flex: 1;
  height: 100%;
  padding: 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  outline: none;
  background-color: white;
  border: none;

  &&:disabled {
    color: #999;
    cursor: not-allowed;
    background-color: #f9f9f9;
  }
`;

export default PriceEditor;
