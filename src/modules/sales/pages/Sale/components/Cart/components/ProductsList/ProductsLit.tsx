import { Modal, Alert } from 'antd';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import React, { useReducer, forwardRef, memo, useCallback } from 'react';
import type { HTMLAttributes } from 'react';
import type { Product as CartProduct } from '@/features/cart/types';
import { useSelector, useDispatch } from 'react-redux';
import { Virtuoso } from 'react-virtuoso';
import styled from 'styled-components';

import ProductDiscountModal from '@/components/modals/ProductDiscountModal/ProductDiscountModal';
import {
  deleteProduct,
  SelectProduct,
  updateProductFields,
} from '@/features/cart/cartSlice';
import useInsuranceEnabled from '@/hooks/useInsuranceEnabled';
import { InsuranceAuthFields } from '@/modules/sales/pages/Sale/components/Cart/components/InsuranceAuthFields/InsuranceAuthFields';
import { ProductCardForCart } from '@/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/ProductCardForCart';
import Typography from '@/components/ui/Typografy/Typografy';

import { BatchInfoModal } from './components/BatchInfoModal/BatchInfoModal';
import { CommentModal } from './components/CommentModal/CommentModal';

const VirtuosoList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ style, children, ...props }, ref) => (
    <Body ref={ref} style={style} {...props}>
      {children}
    </Body>
  ),
);
VirtuosoList.displayName = 'VirtuosoList';

// VirtuosoItem ahora es un contenedor simple, sin animación
const VirtuosoItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props}>
      {children}
    </div>
  ),
);
VirtuosoItem.displayName = 'VirtuosoItem';

const ProductCardForCartMemo = memo(ProductCardForCart);

interface ProductsListState {
  commentModalOpen: boolean;
  deleteModalOpen: boolean;
  discountModalOpen: boolean;
  batchInfoModalOpen: boolean;
  selectedProduct: CartProduct | null;
  comment: string;
}

type ProductsListAction =
  | { type: 'openComment'; product: CartProduct }
  | { type: 'closeComment' }
  | { type: 'openDelete'; product: CartProduct }
  | { type: 'closeDelete' }
  | { type: 'openDiscount'; product: CartProduct }
  | { type: 'closeDiscount' }
  | { type: 'openBatchInfo'; product: CartProduct }
  | { type: 'closeBatchInfo' }
  | { type: 'setComment'; value: string };

const initialProductsListState: ProductsListState = {
  commentModalOpen: false,
  deleteModalOpen: false,
  discountModalOpen: false,
  batchInfoModalOpen: false,
  selectedProduct: null,
  comment: '',
};

const productsListReducer = (
  state: ProductsListState,
  action: ProductsListAction,
): ProductsListState => {
  switch (action.type) {
    case 'openComment':
      return {
        ...state,
        selectedProduct: action.product,
        comment: action.product.comment || '',
        commentModalOpen: true,
      };
    case 'closeComment':
      return {
        ...state,
        commentModalOpen: false,
      };
    case 'openDelete':
      return {
        ...state,
        selectedProduct: action.product,
        deleteModalOpen: true,
      };
    case 'closeDelete':
      return {
        ...state,
        deleteModalOpen: false,
      };
    case 'openDiscount':
      return {
        ...state,
        selectedProduct: action.product,
        discountModalOpen: true,
      };
    case 'closeDiscount':
      return {
        ...state,
        discountModalOpen: false,
      };
    case 'openBatchInfo':
      return {
        ...state,
        selectedProduct: action.product,
        batchInfoModalOpen: true,
      };
    case 'closeBatchInfo':
      return {
        ...state,
        batchInfoModalOpen: false,
      };
    case 'setComment':
      return {
        ...state,
        comment: action.value,
      };
    default:
      return state;
  }
};

export const ProductsList = () => {
  const dispatch = useDispatch();
  const ProductSelected = useSelector(SelectProduct) as CartProduct[];

  const insuranceEnabled = useInsuranceEnabled();
  const EMPTY_CART_MESSAGE = 'Los productos seleccionados aparecerán aquí...';
  const [state, dispatchState] = useReducer(
    productsListReducer,
    initialProductsListState,
  );
  const {
    commentModalOpen,
    deleteModalOpen,
    discountModalOpen,
    selectedProduct,
    batchInfoModalOpen,
    comment,
  } = state;
  const selectedProductLineId =
    selectedProduct?.cid ?? selectedProduct?.id ?? null;

  const handleOpenCommentModal = useCallback((product: CartProduct) => {
    dispatchState({ type: 'openComment', product });
  }, []);

  const handleOpenDeleteModal = useCallback((product: CartProduct) => {
    dispatchState({ type: 'openDelete', product });
  }, []);

  const handleOpenDiscountModal = useCallback((product: CartProduct) => {
    dispatchState({ type: 'openDiscount', product });
  }, []);

  const handleOpenBatchInfoModal = useCallback(
    (product: CartProduct | null) => {
      if (product) {
        dispatchState({ type: 'openBatchInfo', product });
      }
    },
    [],
  );

  const handleSaveComment = () => {
    if (selectedProductLineId) {
      dispatch(
        updateProductFields({
          id: selectedProductLineId,
          data: { comment },
        }),
      );
    }
    dispatchState({ type: 'closeComment' });
  };

  const handleDeleteProduct = () => {
    if (selectedProductLineId) {
      dispatch(deleteProduct(selectedProductLineId));
    }
    dispatchState({ type: 'closeDelete' });
  };

  const itemContent = useCallback(
    (_index: number, item: CartProduct) => (
      <ProductCardForCartMemo
        item={item}
        onOpenCommentModal={handleOpenCommentModal}
        onOpenDeleteModal={handleOpenDeleteModal}
        onOpenDiscountModal={handleOpenDiscountModal}
        onOpenBatchInfoModal={handleOpenBatchInfoModal}
      />
    ),
    [
      handleOpenCommentModal,
      handleOpenDeleteModal,
      handleOpenDiscountModal,
      handleOpenBatchInfoModal,
    ],
  );

  return (
    <LazyMotion features={domAnimation}>
      <Container>
        <ListContainer>
          {ProductSelected.length > 0 ? (
            <Virtuoso
              data={ProductSelected}
              computeItemKey={(index, item) =>
                item?.cid || item?.id || `item-${index}`
              }
              itemContent={itemContent}
              components={{
                List: VirtuosoList,
                Item: VirtuosoItem,
              }}
              style={{ height: '100%' }}
            />
          ) : (
            <EmptyCartMessage
              key="empty-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Typography variant="body1">{EMPTY_CART_MESSAGE}</Typography>
            </EmptyCartMessage>
          )}
        </ListContainer>
        {insuranceEnabled && <InsuranceAuthFields />}
        <BatchInfoModal
          isOpen={batchInfoModalOpen}
          onClose={() => dispatchState({ type: 'closeBatchInfo' })}
          product={selectedProduct}
        />

        <CommentModal
          isOpen={commentModalOpen}
          onClose={() => dispatchState({ type: 'closeComment' })}
          selectedProduct={selectedProduct}
          comment={comment}
          onCommentChange={(value) =>
            dispatchState({ type: 'setComment', value })
          }
          onSave={handleSaveComment}
          onDelete={() => {
            if (selectedProductLineId) {
              dispatchState({ type: 'setComment', value: '' });
              dispatch(
                updateProductFields({
                  id: selectedProductLineId,
                  data: { comment: '' },
                }),
              );
            }
            dispatchState({ type: 'closeComment' });
          }}
        />

        <ProductDiscountModal
          visible={discountModalOpen}
          onClose={() => dispatchState({ type: 'closeDiscount' })}
          product={selectedProduct}
        />

        <Modal
          title="Eliminar producto"
          open={deleteModalOpen}
          onOk={handleDeleteProduct}
          onCancel={() => dispatchState({ type: 'closeDelete' })}
          okText="Eliminar"
          cancelText="Cancelar"
          okButtonProps={{ danger: true }}
          centered
        >
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <Alert
              message="¿Estás seguro que deseas eliminar este producto del carrito?"
              description={`Se eliminará "${selectedProduct?.name || ''}" del carrito de compras.`}
              type="warning"
              showIcon
            />
          </div>
        </Modal>
      </Container>
    </LazyMotion>
  );
};

const Container = styled.ul`
  position: relative;
  display: grid;
  grid-template-rows: 1fr min-content;
  gap: 0.4em;
  width: 100%;
  padding: 0;
  margin: 0;
  overflow: hidden;
  background-color: ${(props) => props.theme.bg.color2};
  border: 1px solid rgb(0 0 0 / 12.1%);
`;

const ListContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const EmptyCartMessage = styled(m.div)`
  margin: 1em;
`;

const Body = styled.div`
  display: grid;
  gap: 0.2rem;
  align-content: start;
  align-items: start;
  padding: 0.4em;
  border-top: 6px solid transparent;
  border-bottom: 0 solid transparent;
`;
