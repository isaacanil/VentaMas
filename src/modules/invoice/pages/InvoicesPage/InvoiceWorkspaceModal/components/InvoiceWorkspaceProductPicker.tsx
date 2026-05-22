import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { VmButton, VmChip, VmInput, VmModal } from '@/components/heroui';
import type { InvoiceData, InvoiceProduct } from '@/types/invoice';
import {
  formatWorkspaceAmount,
  getWorkspaceProductUnitPrice,
} from '../utils/invoiceWorkspaceFormat';
import { getWorkspaceEditProductKey } from '../utils/invoiceWorkspaceEdit';

interface InvoiceWorkspaceProductPickerProps {
  invoice: InvoiceData;
  isDisabled?: boolean;
  isLoading?: boolean;
  isOpen: boolean;
  onAddProduct: (product: InvoiceProduct) => void;
  onClose: () => void;
  products: InvoiceProduct[];
}

const MAX_VISIBLE_PRODUCTS = 40;

const getProductName = (product: InvoiceProduct) =>
  product.name ||
  product.productName ||
  product.sku ||
  product.barcode ||
  'Producto';

const getProductMeta = (product: InvoiceProduct) => {
  const parts = [
    product.barcode,
    product.sku,
    product.brand,
    typeof product.category === 'string' ? product.category : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' - ') : 'Sin código';
};

const matchesSearch = (product: InvoiceProduct, search: string) => {
  if (!search) return true;
  const haystack = [
    product.name,
    product.productName,
    product.barcode,
    product.sku,
    product.brand,
    typeof product.category === 'string' ? product.category : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(search);
};

export const InvoiceWorkspaceProductPicker = ({
  invoice,
  isDisabled = false,
  isLoading = false,
  isOpen,
  onAddProduct,
  onClose,
  products,
}: InvoiceWorkspaceProductPickerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const invoiceProductKeys = useMemo(
    () =>
      new Set(
        (invoice.products || []).map((product, index) =>
          getWorkspaceEditProductKey(product, index),
        ),
      ),
    [invoice.products],
  );

  const visibleProducts = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    return safeProducts
      .filter((product) => matchesSearch(product, normalizedSearch))
      .slice(0, MAX_VISIBLE_PRODUCTS);
  }, [normalizedSearch, products]);

  return (
    <VmModal
      ariaLabel="Agregar producto"
      isOpen={isOpen && !isDisabled}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Agregar producto"
      footer={
        <VmButton variant="secondary" onPress={onClose}>
          Cerrar
        </VmButton>
      }
      size="lg"
    >
      <PickerContent>
        <SearchField>
          <Label htmlFor="invoice-workspace-product-search">
            Buscar producto
          </Label>
          <SearchInput
            id="invoice-workspace-product-search"
            name="invoice-workspace-product-search"
            value={searchTerm}
            placeholder="Nombre, código, marca o categoría"
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </SearchField>

        <ResultsMeta>
          {isLoading
            ? 'Cargando productos...'
            : `${visibleProducts.length} resultados`}
        </ResultsMeta>

        {visibleProducts.length > 0 ? (
          <ProductList>
            {visibleProducts.map((product, index) => {
              const productKey = getWorkspaceEditProductKey(product, index);
              const isAlreadyAdded = invoiceProductKeys.has(productKey);
              const stock = Number(product.stock ?? 0);

              return (
                <ProductOption key={productKey}>
                  <ProductCopy>
                    <ProductTitle>
                      <strong>{getProductName(product)}</strong>
                      {isAlreadyAdded ? (
                        <VmChip color="accent" variant="soft">
                          <VmChip.Label>En factura</VmChip.Label>
                        </VmChip>
                      ) : null}
                    </ProductTitle>
                    <ProductMeta>{getProductMeta(product)}</ProductMeta>
                  </ProductCopy>
                  <ProductNumbers>
                    <InfoPair>
                      <span>Precio</span>
                      <strong>
                        {formatWorkspaceAmount(
                          getWorkspaceProductUnitPrice(product, invoice),
                          invoice,
                        )}
                      </strong>
                    </InfoPair>
                    <InfoPair>
                      <span>Stock</span>
                      <strong>{Number.isFinite(stock) ? stock : 0}</strong>
                    </InfoPair>
                    <VmButton
                      size="sm"
                      variant="secondary"
                      onPress={() => onAddProduct(product)}
                    >
                      {isAlreadyAdded ? 'Sumar' : 'Agregar'}
                    </VmButton>
                  </ProductNumbers>
                </ProductOption>
              );
            })}
          </ProductList>
        ) : (
          <EmptyMessage>
            {isLoading
              ? 'Esperando catálogo de productos.'
              : 'No hay productos que coincidan con la búsqueda.'}
          </EmptyMessage>
        )}
      </PickerContent>
    </VmModal>
  );
};

const PickerContent = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

const SearchField = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const Label = styled.label`
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  text-transform: uppercase;
`;

const SearchInput = styled(VmInput)`
  width: 100%;
  height: 36px;
  min-width: 0;
  padding: 0 var(--ds-space-2);
  color: var(--ds-color-text-primary);
  font: inherit;
  font-size: var(--ds-font-size-sm);
  background: var(--ds-color-bg-surface);
`;

const ResultsMeta = styled.div`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

const ProductList = styled.div`
  display: grid;
  max-height: min(56vh, 520px);
  overflow: auto;
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-lg);
`;

const ProductOption = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--ds-space-3);
  align-items: center;
  padding: var(--ds-space-3);
  border-bottom: 1px solid var(--ds-color-border-subtle);

  &:last-child {
    border-bottom: 0;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const ProductCopy = styled.div`
  display: grid;
  min-width: 0;
  gap: var(--ds-space-1);
`;

const ProductTitle = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  min-width: 0;

  strong {
    overflow: hidden;
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-semibold);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const ProductMeta = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProductNumbers = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
  align-items: center;
  justify-content: flex-end;

  @media (max-width: 720px) {
    justify-content: flex-start;
  }
`;

const InfoPair = styled.div`
  display: grid;
  gap: 2px;
  min-width: 72px;

  span {
    color: var(--ds-color-text-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    text-transform: uppercase;
  }

  strong {
    color: var(--ds-color-text-primary);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-semibold);
  }
`;

const EmptyMessage = styled.div`
  padding: var(--ds-space-4);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  text-align: center;
  border: 1px dashed var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
`;
