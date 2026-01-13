import React, { useMemo, useState, type ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';


import { icons } from '@/constants/icons/icons';
import { changeProductPrice } from '@/features/cart/cartSlice';
import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import { formatPrice } from '@/utils/format';
import {
  getPriceTotal,
  getPriceWithoutTax,
} from '@/utils/pricing';
import type { PricingTax, ProductPricing } from '@/types/products';
import type { InvoiceProduct } from '@/types/invoice';

type PriceEditableItem = {
  id?: string;
  pricing?: ProductPricing & { price?: number | string; tax?: PricingTax };
  price?: number | string;
  weightDetail?: { isSoldByWeight?: boolean };
};

type PriceEditorProps = {
  item: PriceEditableItem;
  onModalOpen: () => void;
};

const resolveTaxValue = (tax?: PricingTax): number => {
  if (typeof tax === 'number') return tax;
  if (typeof tax === 'string') {
    const parsed = Number.parseFloat(tax);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (tax && typeof tax === 'object' && 'tax' in tax) {
    const nestedTax = (tax as { tax?: unknown }).tax;
    if (typeof nestedTax === 'number') return nestedTax;
    if (typeof nestedTax === 'string') {
      const parsed = Number.parseFloat(nestedTax);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
  }
  return 0;
};

export const PriceEditor = ({ item, onModalOpen }: PriceEditorProps) => {
  const dispatch = useDispatch();
  const { abilities, loading } = useUserAccess();
  const canModifyPrice = abilities.can('modify', 'Price');
  const canReadPriceList = abilities.can('read', 'PriceList');
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled) as boolean;

  const computedPrice = useMemo(
    () => getPriceTotal(item as InvoiceProduct, taxReceiptEnabled),
    [item, taxReceiptEnabled],
  );
  const [inputPrice, setInputPrice] = useState<string>(() =>
    String(computedPrice),
  );
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9.]/g, '');
    setInputPrice(newValue);
  };

  const handlePriceBlur = () => {
    if (!isEditingPrice || !canModifyPrice) {
      setIsEditingPrice(false);
      return;
    }

    const numericValue = Number.parseFloat(inputPrice);
    if (Number.isNaN(numericValue)) {
      setIsEditingPrice(false);
      setInputPrice(String(computedPrice));
      return;
    }

    // Convertir el precio con impuesto a precio sin impuesto
    const priceWithoutTax = getPriceWithoutTax(
      numericValue,
      resolveTaxValue(item.pricing?.tax),
      taxReceiptEnabled,
    );

    if (item.id) {
      // Despachar el cambio al estado con el precio sin impuesto
      dispatch(
        changeProductPrice({
          id: item.id,
          price: priceWithoutTax,
        }),
      );
    }

    setIsEditingPrice(false);
  };

  const handlePriceFocus = () => {
    if (canModifyPrice && !item?.weightDetail?.isSoldByWeight) {
      setInputPrice(String(computedPrice));
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
        value={isEditingPrice ? inputPrice : formatPrice(computedPrice)}
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

type DropdownButtonStyleProps = { disabled?: boolean };

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 100%;
  cursor: ${(props: DropdownButtonStyleProps) =>
    props.disabled ? 'not-allowed' : 'pointer'};
  background-color: #f5f5f5;
  border: none;
  opacity: ${(props: DropdownButtonStyleProps) => (props.disabled ? 0.5 : 1)};
  transition: background-color 0.2s;

  &&:hover {
    background-color: ${(props: DropdownButtonStyleProps) =>
      props.disabled ? '#f5f5f5' : '#eaeaea'};
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
