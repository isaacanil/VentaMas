import { EditOutlined } from '@/constants/icons/antd';
import { message } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import {
  VmButton,
  VmCard,
  VmChip,
  VmInput,
  VmModal,
} from '@/components/heroui';
import { useGetProducts } from '@/firebase/products/fbGetProducts';
import type { InvoiceData, InvoiceProduct } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';
import { useInvoiceWorkspaceDraftEditor } from '../hooks/useInvoiceWorkspaceDraftEditor';
import {
  formatWorkspaceAmount,
  getWorkspaceProductQuantity,
  getWorkspaceProductTotal,
  getWorkspaceProductUnitPrice,
} from '../utils/invoiceWorkspaceFormat';
import {
  addWorkspaceDraftProduct,
  getWorkspaceEditProductKey,
  getWorkspaceEditProductQuantity,
  removeWorkspaceDraftProduct,
  updateWorkspaceDraftProductQuantity,
  updateWorkspaceDraftProductUnitPrice,
  type InvoiceWorkspaceEditState,
} from '../utils/invoiceWorkspaceEdit';
import { InvoiceWorkspaceProductPicker } from './InvoiceWorkspaceProductPicker';

interface InvoiceWorkspaceProductsProps {
  editState: InvoiceWorkspaceEditState;
  invoice: InvoiceData;
  isEditing?: boolean;
  onSaved: (invoice: InvoiceData) => void;
  user: UserIdentity | null;
}

type PriceEditorState = {
  productKey: string;
  productName: string;
  value: string;
} | null;

const parseAmount = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatEditableAmountValue = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '0';
  return String(Math.round(parsed * 100) / 100);
};

const createFieldIdSegment = (value: string) =>
  value.replace(/[^a-zA-Z0-9_-]/g, '-');

const getProductName = (product: InvoiceProduct) =>
  product.name ||
  product.productName ||
  product.sku ||
  product.barcode ||
  'Producto';

const isTechnicalProductCode = (value: unknown) =>
  typeof value === 'string' && value.includes('::');

const getProductSecondaryText = (product: InvoiceProduct) => {
  if (product.barcode) return product.barcode;
  if (product.sku && !isTechnicalProductCode(product.sku)) return product.sku;
  if (product.cid && !isTechnicalProductCode(product.cid)) return product.cid;
  return 'Sin código';
};

export const InvoiceWorkspaceProducts = ({
  editState,
  invoice,
  isEditing = false,
  onSaved,
  user,
}: InvoiceWorkspaceProductsProps) => {
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [priceEditor, setPriceEditor] = useState<PriceEditorState>(null);
  const { products: catalogProducts, loading: catalogProductsLoading } =
    useGetProducts();
  const {
    authorizationModal,
    canEditDirectly,
    draft,
    handleAuthorizedSave,
    handleReset,
    hasChanges,
    isBusy,
    setDraft,
  } = useInvoiceWorkspaceDraftEditor({
    editState,
    invoice,
    isEditing,
    onSaved,
    successMessage: 'Productos de la factura actualizados',
    user,
  });
  const visibleInvoice = isEditing ? draft : invoice;
  const products = Array.isArray(visibleInvoice.products)
    ? visibleInvoice.products
    : [];

  const handleProductQuantityChange = (productKey: string, value: string) => {
    if (!canEditDirectly) return;
    const quantity = Math.max(1, parseAmount(value));
    setDraft((current) =>
      updateWorkspaceDraftProductQuantity(current, productKey, quantity),
    );
  };

  const handleRemoveProduct = (productKey: string) => {
    if (!canEditDirectly) return;
    setDraft((current) => removeWorkspaceDraftProduct(current, productKey));
  };

  const handleOpenProductPicker = () => {
    if (!canEditDirectly) {
      message.warning('Esta factura no permite agregar productos.');
      return;
    }
    setIsProductPickerOpen(true);
  };

  const handleAddProduct = (product: InvoiceProduct) => {
    if (!canEditDirectly) return;
    setDraft((current) => addWorkspaceDraftProduct(current, product));
    message.success(`${getProductName(product)} agregado`);
  };

  const handleOpenPriceEditor = (product: InvoiceProduct, index: number) => {
    if (!canEditDirectly) return;

    const productKey = getWorkspaceEditProductKey(product, index);
    setPriceEditor({
      productKey,
      productName: getProductName(product),
      value: formatEditableAmountValue(
        getWorkspaceProductUnitPrice(product, draft),
      ),
    });
  };

  const handleApplyPriceChange = () => {
    if (!priceEditor || !canEditDirectly) return;

    setDraft((current) =>
      updateWorkspaceDraftProductUnitPrice(
        current,
        priceEditor.productKey,
        parseAmount(priceEditor.value),
      ),
    );
    setPriceEditor(null);
  };

  return (
    <>
      <ProductsCard>
        <VmCard.Header>
          <ProductsHeader>
            <div>
              <VmCard.Title>Productos</VmCard.Title>
              <VmCard.Description>
                {products.length} líneas en esta factura
              </VmCard.Description>
            </div>
            {isEditing ? (
              <HeaderActions>
                {editState.canEditDirectly ? (
                  <VmChip color="success" variant="soft">
                    <VmChip.Label>Edición en detalle</VmChip.Label>
                  </VmChip>
                ) : (
                  <VmChip color="warning" variant="soft">
                    <VmChip.Label>Solo lectura</VmChip.Label>
                  </VmChip>
                )}
                <VmButton
                  size="sm"
                  variant="secondary"
                  onPress={handleOpenProductPicker}
                  isDisabled={!canEditDirectly}
                >
                  Agregar producto
                </VmButton>
              </HeaderActions>
            ) : null}
          </ProductsHeader>
        </VmCard.Header>
        <VmCard.Content>
          {isEditing && !editState.canEditDirectly ? (
            <LockNotice>
              <strong>Esta factura no permite edición directa.</strong>
              <ReasonList>
                {editState.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ReasonList>
            </LockNotice>
          ) : null}

          {products.length > 0 ? (
            <ProductsTable>
              <TableHeader $editing={isEditing}>
                <span>Producto</span>
                <span>Cant.</span>
                <span>Unidad</span>
                <span>Total</span>
                {isEditing ? <span /> : null}
              </TableHeader>
              {products.map((product, index) => {
                const productKey = getWorkspaceEditProductKey(product, index);
                const productFieldId = createFieldIdSegment(productKey);
                const productQuantityId = `invoice-workspace-product-${productFieldId}-quantity`;
                const productName = getProductName(product);

                return (
                  <ProductRow key={productKey} $editing={isEditing}>
                    <ProductName>
                      <strong>{productName}</strong>
                      <span>{getProductSecondaryText(product)}</span>
                    </ProductName>
                    {isEditing ? (
                      <QuantityField
                        id={productQuantityId}
                        name={productQuantityId}
                        type="number"
                        min="1"
                        step="1"
                        aria-label={`Cantidad ${productName}`}
                        value={getWorkspaceEditProductQuantity(product)}
                        disabled={!canEditDirectly}
                        onChange={(event) =>
                          handleProductQuantityChange(
                            productKey,
                            event.target.value,
                          )
                        }
                      />
                    ) : (
                      <span>{getWorkspaceProductQuantity(product)}</span>
                    )}
                    <UnitPriceCell>
                      <span>
                        {formatWorkspaceAmount(
                          getWorkspaceProductUnitPrice(product, visibleInvoice),
                          visibleInvoice,
                        )}
                      </span>
                      {isEditing ? (
                        <VmButton
                          size="sm"
                          variant="secondary"
                          onPress={() => handleOpenPriceEditor(product, index)}
                          isDisabled={!canEditDirectly}
                        >
                          <EditOutlined />
                          Precio
                        </VmButton>
                      ) : null}
                    </UnitPriceCell>
                    <strong>
                      {formatWorkspaceAmount(
                        getWorkspaceProductTotal(product, visibleInvoice),
                        visibleInvoice,
                      )}
                    </strong>
                    {isEditing ? (
                      <VmButton
                        size="sm"
                        variant="danger-soft"
                        onPress={() => handleRemoveProduct(productKey)}
                        isDisabled={!canEditDirectly || products.length <= 1}
                      >
                        Quitar
                      </VmButton>
                    ) : null}
                  </ProductRow>
                );
              })}
            </ProductsTable>
          ) : (
            <EmptyMessage>
              Esta factura no tiene productos registrados.
            </EmptyMessage>
          )}
        </VmCard.Content>
        {isEditing ? (
          <VmCard.Footer>
            <EditFooter>
              <SummaryItem>
                <span>Total productos</span>
                <strong>
                  {formatWorkspaceAmount(
                    visibleInvoice.totalPurchase?.value,
                    visibleInvoice,
                  )}
                </strong>
              </SummaryItem>
              <FooterActions>
                <VmButton
                  variant="secondary"
                  onPress={handleReset}
                  isDisabled={!hasChanges || isBusy}
                >
                  Deshacer cambios
                </VmButton>
                <VmButton
                  variant="primary"
                  onPress={handleAuthorizedSave}
                  isDisabled={!canEditDirectly || !hasChanges || isBusy}
                  isPending={isBusy}
                >
                  Guardar productos
                </VmButton>
              </FooterActions>
            </EditFooter>
          </VmCard.Footer>
        ) : null}
      </ProductsCard>

      <InvoiceWorkspaceProductPicker
        invoice={draft}
        isDisabled={!canEditDirectly}
        isLoading={catalogProductsLoading}
        isOpen={isProductPickerOpen}
        onAddProduct={handleAddProduct}
        onClose={() => setIsProductPickerOpen(false)}
        products={catalogProducts as InvoiceProduct[]}
      />

      <VmModal
        ariaLabel="Editar precio del producto"
        isOpen={Boolean(priceEditor)}
        onOpenChange={(open) => {
          if (!open) setPriceEditor(null);
        }}
        size="sm"
        title="Editar precio"
        footer={
          <>
            <VmButton variant="secondary" onPress={() => setPriceEditor(null)}>
              Cancelar
            </VmButton>
            <VmButton
              variant="primary"
              onPress={handleApplyPriceChange}
              isDisabled={!canEditDirectly}
            >
              Aplicar precio
            </VmButton>
          </>
        }
      >
        <PriceModalContent>
          <PriceModalText>
            <strong>{priceEditor?.productName || 'Producto'}</strong>
            <span>Este cambio recalcula los totales antes de guardar.</span>
          </PriceModalText>
          <PriceInput
            id="invoice-workspace-product-price"
            name="invoice-workspace-product-price"
            type="number"
            min="0"
            step="0.01"
            aria-label="Precio unitario"
            value={priceEditor?.value ?? ''}
            onChange={(event) =>
              setPriceEditor((current) =>
                current ? { ...current, value: event.target.value } : current,
              )
            }
          />
        </PriceModalContent>
      </VmModal>
      {authorizationModal}
    </>
  );
};

const ProductsCard = styled(VmCard)`
  min-width: 0;
`;

const ProductsHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
`;

const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: flex-end;
`;

const LockNotice = styled.div`
  display: grid;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3);
  margin-bottom: var(--ds-space-3);
  color: var(--ds-color-text-primary);
  background: var(--ds-color-state-warning-subtle);
  border: 1px solid var(--ds-color-state-warning);
  border-radius: var(--ds-radius-lg);
`;

const ReasonList = styled.ul`
  display: grid;
  gap: var(--ds-space-1);
  padding-left: var(--ds-space-5);
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

const ProductsTable = styled.div`
  display: grid;
  overflow: auto;
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-lg);
`;

const TableHeader = styled.div<{ $editing: boolean }>`
  display: grid;
  grid-template-columns: ${({ $editing }) =>
    $editing
      ? 'minmax(220px, 1fr) 96px 170px 120px 96px'
      : 'minmax(220px, 1fr) 72px 120px 120px'};
  gap: var(--ds-space-3);
  min-width: ${({ $editing }) => ($editing ? '780px' : '620px')};
  padding: var(--ds-space-2) var(--ds-space-3);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  text-transform: uppercase;
  background: var(--ds-color-bg-subtle);
  border-bottom: 1px solid var(--ds-color-border-subtle);
`;

const ProductRow = styled.div<{ $editing: boolean }>`
  display: grid;
  grid-template-columns: ${({ $editing }) =>
    $editing
      ? 'minmax(220px, 1fr) 96px 170px 120px 96px'
      : 'minmax(220px, 1fr) 72px 120px 120px'};
  gap: var(--ds-space-3);
  align-items: center;
  min-width: ${({ $editing }) => ($editing ? '780px' : '620px')};
  padding: var(--ds-space-3);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  border-bottom: 1px solid var(--ds-color-border-subtle);

  &:last-child {
    border-bottom: 0;
  }
`;

const ProductName = styled.div`
  display: grid;
  min-width: 0;
  gap: 2px;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-xs);
  }
`;

const QuantityField = styled(VmInput)`
  width: 100%;
  min-width: 0;
  height: 32px;
`;

const UnitPriceCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  min-width: 0;

  > span {
    min-width: 0;
    font-weight: var(--ds-font-weight-medium);
  }
`;

const EditFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const SummaryItem = styled.div`
  display: grid;
  gap: 2px;

  span {
    color: var(--ds-color-text-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    text-transform: uppercase;
  }

  strong {
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-semibold);
  }
`;

const FooterActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;
`;

const PriceModalContent = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

const PriceModalText = styled.div`
  display: grid;
  gap: var(--ds-space-1);

  strong {
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-sm);
  }

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
  }
`;

const PriceInput = styled(VmInput)`
  width: 100%;
`;

const EmptyMessage = styled.div`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;
