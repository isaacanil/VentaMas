import { Modal, Button } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { useListenSaleUnits } from '@/firebase/products/saleUnits/fbUpdateSaleUnit';
import { normalizeSupportedDocumentCurrency } from '@/utils/accounting/currencies';
import { formatPriceByCurrency } from '@/utils/format';
import { getListPriceTotal, getTotalPrice } from '@/utils/pricing';

import type {
  ProductPricing,
  ProductRecord,
  ProductSaleUnit,
  SupportedDocumentCurrency,
} from '@/types/products';
import {
  extraerPreciosConImpuesto,
  type PriceOption,
} from './ProductCardForCart/utils/priceUtils';

// Estilos
const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5em;
`;

const SectionTitle = styled.h3`
  margin-bottom: 10px;
  font-size: 0.9rem;
  font-weight: 500;
`;

const PriceOptionCard = styled.div<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  cursor: pointer;
  background: ${({ selected }: { selected?: boolean }) =>
    selected ? '#e6f7ff' : 'white'};
  border: ${({ selected }: { selected?: boolean }) =>
    selected ? '2px solid #1890ff' : '1px solid #ddd'};
  border-radius: 8px;
  transition: background 0.3s ease;

  &:hover {
    background: #f0f0f0;
  }
`;

const SaleUnitsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.6em;
  padding: 0.6em;
  background-color: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
`;

const SaleUnitCard = styled.div<{ selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 15px;
  cursor: pointer;
  background: ${({ selected }: { selected?: boolean }) =>
    selected ? '#e6f7ff' : 'white'};
  border: ${({ selected }: { selected?: boolean }) =>
    selected ? '2px solid #1890ff' : '1px solid #ddd'};
  border-radius: 10px;
  transition: background 0.3s ease;

  &:hover {
    background: #f0f0f0;
  }
`;

const EmptySaleUnitsMessage = styled.div`
  margin-top: 10px;
  font-size: 1rem;
  color: #999;
  text-align: center;
`;

const PriceOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6em;
`;

const InfoMessage = styled.div`
  padding: 12px;
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: #155724;
  text-align: center;
  background-color: #f0f8ff;
  border: 1px solid #d4edda;
  border-radius: 8px;

  .info-button {
    margin-top: 10px;
  }
`;

type SaleUnitItem = ProductRecord & {
  defaultSaleUnitId?: string | null;
  pricing?: ProductPricing;
};

type PriceAndSaleUnitsModalProps = {
  isVisible: boolean;
  onClose: () => void;
  item: SaleUnitItem;
  onSelectPrice: (price: PriceOption) => void;
  onSelectDefaultUnit: (item: SaleUnitItem) => void;
  onSelectUnit: (unit: SaleUnitRecord) => void;
  prices?: PriceOption[];
  selectedUnit?: SaleUnitRecord | null;
};

type SaleUnitRecord = Partial<ProductSaleUnit> & { id: string };

type ManualSelection = {
  itemId?: string;
  unitId: string;
} | null;

type ManualPrice = {
  itemId?: string;
  price: PriceOption;
} | null;

const EMPTY_PRICE_OPTIONS: PriceOption[] = [];

const normalizeCurrency = (
  value: unknown,
): SupportedDocumentCurrency => normalizeSupportedDocumentCurrency(value);

const PriceAndSaleUnitsModal = ({
  isVisible,
  onClose,
  item,
  onSelectPrice,
  onSelectDefaultUnit,
  onSelectUnit,
  prices = EMPTY_PRICE_OPTIONS,
  selectedUnit,
}: PriceAndSaleUnitsModalProps) => {
  const productId = item.id ? String(item.id) : undefined;
  const [manualSelection, setManualSelection] = useState<ManualSelection>(null);
  const [manualPrice, setManualPrice] = useState<ManualPrice>(null);
  const { data: saleUnits } = useListenSaleUnits(productId) as {
    data: ProductSaleUnit[];
  };
  const navigate = useNavigate();

  const selectedUnitId = useMemo(() => {
    if (!isVisible) return null;
    if (manualSelection?.itemId === productId && manualSelection?.unitId) {
      return manualSelection.unitId;
    }
    return selectedUnit?.id || item.defaultSaleUnitId || 'default';
  }, [
    isVisible,
    manualSelection?.itemId,
    manualSelection?.unitId,
    item.defaultSaleUnitId,
    productId,
    selectedUnit?.id,
  ]);
  const displayCurrency: SupportedDocumentCurrency =
    selectedUnitId && selectedUnitId !== 'default'
      ? normalizeCurrency(
          saleUnits?.find((unit) => unit.id === selectedUnitId)?.pricing
            ?.currency,
        )
      : normalizeCurrency(item?.pricing?.currency);

  // Función para navegar a la configuración del producto
  const handleGoToInventory = () => {
    navigate('/inventory/items');
  };

  // Función helper para determinar qué precio es el actual del producto en el carrito
  const getCurrentProductPrice = useCallback(() => {
    // Si estamos en la unidad por defecto
    if (selectedUnitId === 'default') {
      const prices =
        extraerPreciosConImpuesto(item.pricing) || EMPTY_PRICE_OPTIONS;
      const listPriceVal = prices.find(
        (p) => p.type === 'listPrice',
      )?.valueWithTax;
      const avgPriceVal = prices.find(
        (p) => p.type === 'avgPrice',
      )?.valueWithTax;
      const minPriceVal = prices.find(
        (p) => p.type === 'minPrice',
      )?.valueWithTax;
      const cardPriceVal = prices.find(
        (p) => p.type === 'cardPrice',
      )?.valueWithTax;
      const offerPriceVal = prices.find(
        (p) => p.type === 'offerPrice',
      )?.valueWithTax;
      // Calcula el precio actualizado con impuestos
      const currentPrice = getTotalPrice({ pricing: item.pricing });

      if (currentPrice === listPriceVal) return 'listPrice';
      if (currentPrice === avgPriceVal) return 'avgPrice';
      if (currentPrice === minPriceVal) return 'minPrice';
      if (currentPrice === cardPriceVal) return 'cardPrice';
      if (currentPrice === offerPriceVal) return 'offerPrice';

      return 'listPrice';
    }
    if (!selectedUnitId) {
      return 'listPrice';
    }

    // Si estamos en una unidad de venta específica
    const selectedUnit = saleUnits?.find((unit) => unit.id === selectedUnitId);
    if (!selectedUnit) return 'listPrice';

    const prices =
      extraerPreciosConImpuesto(selectedUnit.pricing) || EMPTY_PRICE_OPTIONS;
    const listPriceVal = prices.find(
      (p) => p.type === 'listPrice',
    )?.valueWithTax;
    const avgPriceVal = prices.find((p) => p.type === 'avgPrice')?.valueWithTax;
    const minPriceVal = prices.find((p) => p.type === 'minPrice')?.valueWithTax;
    const cardPriceVal = prices.find(
      (p) => p.type === 'cardPrice',
    )?.valueWithTax;
    const offerPriceVal = prices.find(
      (p) => p.type === 'offerPrice',
    )?.valueWithTax;
    // Calcula el precio actualizado con impuestos para la unidad
    const currentPrice = getTotalPrice({ pricing: selectedUnit.pricing });

    if (currentPrice === listPriceVal) return 'listPrice';
    if (currentPrice === avgPriceVal) return 'avgPrice';
    if (currentPrice === minPriceVal) return 'minPrice';
    if (currentPrice === cardPriceVal) return 'cardPrice';
    if (currentPrice === offerPriceVal) return 'offerPrice';

    return 'listPrice';
  }, [item.pricing, selectedUnitId, saleUnits]);

  const getDefaultPrice = useCallback(
    (prices: PriceOption[]) => {
      // Intentar determinar el tipo de precio actualmente seleccionado
      const currentPriceType = getCurrentProductPrice();

      // Buscar ese tipo de precio en los precios disponibles
      const currentPrice = prices.find(
        (price) => price.type === currentPriceType,
      );

      // Si lo encontramos, usarlo; si no, usar listPrice o el primero disponible
      return (
        currentPrice ||
        prices.find((price) => price.type === 'listPrice') ||
        prices[0]
      );
    },
    [getCurrentProductPrice],
  );

  const handleSelectUnit = (unit: SaleUnitRecord) => {
    if (!unit.id) return;
    setManualSelection({ itemId: productId, unitId: unit.id });
    onSelectUnit(unit);
    const selectedItemPricing = unit.pricing;
    if (selectedItemPricing) {
      const pricingOptions = extraerPreciosConImpuesto(selectedItemPricing);
      // Filtrar precios habilitados y con valores válidos (mayor que 0)
      const enabledPrices = pricingOptions.filter((price) => {
        const value = Number(price?.valueWithTax);
        return price.enabled && Number.isFinite(value) && value > 0;
      });

      // Obtener el precio por defecto
      const defaultPrice = getDefaultPrice(enabledPrices);
      if (defaultPrice) {
        setManualPrice({ itemId: productId, price: defaultPrice });
      }

      // Llamar a onSelectPrice con el precio por defecto
      if (defaultPrice) {
        onSelectPrice(defaultPrice);
      }
    }
  };

  const handleSelectDefaultUnit = () => {
    setManualSelection({ itemId: productId, unitId: 'default' });
    onSelectDefaultUnit(item);
    const selectedItemPricing = item.pricing;
    if (selectedItemPricing) {
      const pricingOptions =
        prices.length > 0
          ? prices
          : extraerPreciosConImpuesto(selectedItemPricing);
      // Filtrar precios habilitados y con valores válidos (mayor que 0)
      const enabledPrices = pricingOptions.filter((price) => {
        const value = Number(price?.valueWithTax);
        return price.enabled && Number.isFinite(value) && value > 0;
      });

      // Obtener el precio por defecto
      const defaultPrice = getDefaultPrice(enabledPrices);
      if (defaultPrice) {
        setManualPrice({ itemId: productId, price: defaultPrice });
      }

      // Llamar a onSelectPrice con el precio por defecto
      if (defaultPrice) {
        onSelectPrice(defaultPrice);
      }
    }
  };

  const derivedPrices = useMemo(() => {
    if (!isVisible || !selectedUnitId) {
      return { enabledPrices: EMPTY_PRICE_OPTIONS, defaultPrice: null };
    }

    let pricingOptions = EMPTY_PRICE_OPTIONS;

    if (selectedUnitId === 'default') {
      pricingOptions =
        prices.length > 0 ? prices : extraerPreciosConImpuesto(item.pricing);
    } else {
      const selectedUnitData = saleUnits?.find(
        (unit) => unit.id === selectedUnitId,
      );
      pricingOptions = extraerPreciosConImpuesto(selectedUnitData?.pricing);
    }

    const enabledPrices = pricingOptions.filter((price) => {
      const value = Number(price?.valueWithTax);
      return price?.enabled && Number.isFinite(value) && value > 0;
    });

    const defaultPrice = getDefaultPrice(enabledPrices);
    return { enabledPrices, defaultPrice };
  }, [selectedUnitId, saleUnits, item, isVisible, prices, getDefaultPrice]);

  const combinedPrices = derivedPrices.enabledPrices;
  const selectedPrice = useMemo(() => {
    if (manualPrice?.itemId === productId && manualPrice) {
      const exists = combinedPrices.some(
        (price) => price.type === manualPrice.price.type,
      );
      if (exists) {
        return manualPrice.price;
      }
    }
    return derivedPrices.defaultPrice;
  }, [combinedPrices, derivedPrices.defaultPrice, manualPrice, productId]);

  const handleSelectPrice = (price: PriceOption) => {
    setManualPrice({ itemId: productId, price });
    // Pasamos todo el objeto de precio para que ProductCardForCart pueda extraer los valores correctos
    onSelectPrice(price);
  };

  // Determina si un precio está seleccionado
  const isPriceSelected = (price: PriceOption) => {
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
              <p>
                Precio:{' '}
                {formatPriceByCurrency(
                  getListPriceTotal({ pricing: item?.pricing }),
                  normalizeCurrency(item?.pricing?.currency),
                )}
              </p>
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
                    <p>
                      Precio:{' '}
                      {formatPriceByCurrency(
                        getListPriceTotal({ pricing: unit?.pricing }),
                        normalizeCurrency(unit?.pricing?.currency),
                      )}
                    </p>
                  </div>
                </SaleUnitCard>
              ))}
            </SaleUnitsContainer>
          ) : (
            <EmptySaleUnitsMessage>
              No hay unidades de venta configuradas.
            </EmptySaleUnitsMessage>
          )}
        </div>{' '}
        {/* Precios */}{' '}
        <div>
          <SectionTitle>Selecciona un Precio</SectionTitle>{' '}
          {combinedPrices.length === 0 ? (
            <InfoMessage>
              📋 No hay precios configurados para esta unidad. Ve a la
              configuración del producto para establecer los precios.
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
              Solo hay un precio disponible para esta unidad. Para más opciones
              de precios, ve a la configuración del producto.
            </InfoMessage>
          ) : (
            <PriceOptions>
              {combinedPrices.map((price, index) => (
                <PriceOptionCard
                  key={index}
                  selected={isPriceSelected(price)}
                  onClick={() => handleSelectPrice(price)}
                >
                  <span>
                    {price.label}:{' '}
                    {formatPriceByCurrency(price.valueWithTax, displayCurrency)}
                  </span>
                </PriceOptionCard>
              ))}
            </PriceOptions>
          )}
        </div>
      </ModalContainer>
    </Modal>
  );
};

export default PriceAndSaleUnitsModal;
