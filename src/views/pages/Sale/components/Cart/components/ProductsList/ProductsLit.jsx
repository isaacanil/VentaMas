import { Modal, Alert } from 'antd';
import { motion } from 'framer-motion';
import React, { useState, forwardRef, memo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Virtuoso } from 'react-virtuoso';
import styled from 'styled-components';

import ProductDiscountModal from '../../../../../../../components/modals/ProductDiscountModal/ProductDiscountModal';
import {
  deleteProduct,
  SelectProduct,
  updateProductFields,
} from '../../../../../../../features/cart/cartSlice';
import {
  selectInsuranceData,
  updateInsuranceData,
} from '../../../../../../../features/insurance/insuranceSlice';
import useInsuranceEnabled from '../../../../../../../hooks/useInsuranceEnabled';
import Typography from '../../../../../../templates/system/Typografy/Typografy';
import { InsuranceAuthFields } from '../InsuranceAuthFields/InsuranceAuthFields';
import { ProductCardForCart } from '../ProductCardForCart/ProductCardForCart';

import { BatchInfoModal } from './components/BatchInfoModal/BatchInfoModal';
import { CommentModal } from './components/CommentModal/CommentModal';

const VirtuosoList = forwardRef(({ style, children, ...props }, ref) => (
  <Body ref={ref} style={style} {...props}>
    {children}
  </Body>
));
VirtuosoList.displayName = 'VirtuosoList';

// VirtuosoItem ahora es un contenedor simple, sin animación
const VirtuosoItem = forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
));
VirtuosoItem.displayName = 'VirtuosoItem';

const ProductCardForCartMemo = memo(ProductCardForCart);

export const ProductsList = () => {
  const dispatch = useDispatch();
  const ProductSelected = useSelector(SelectProduct);

  const insuranceEnabled = useInsuranceEnabled();
  const insuranceData = useSelector(selectInsuranceData);
  const EMPTY_CART_MESSAGE = 'Los productos seleccionados aparecerán aquí...';
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [batchInfoModalOpen, setBatchInfoModalOpen] = useState(false);
  const [comment, setComment] = useState('');

  const handleOpenCommentModal = useCallback((product) => {
    setSelectedProduct(product);
    setComment(product.comment || '');
    setCommentModalOpen(true);
  }, []);

  const handleOpenDeleteModal = useCallback((product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  }, []);

  const handleOpenDiscountModal = useCallback((product) => {
    setSelectedProduct(product);
    setDiscountModalOpen(true);
  }, []);
  
  const handleOpenBatchInfoModal = useCallback((product) => {
    if (product) {
      setSelectedProduct(product);
      setBatchInfoModalOpen(true);
    }
  }, []);

  const handleSaveComment = () => {
    if (selectedProduct) {
      dispatch(
        updateProductFields({
          id: selectedProduct.id,
          data: { comment },
        }),
      );
    }
    setCommentModalOpen(false);
  };

  const handleDeleteProduct = () => {
    if (selectedProduct) {
      dispatch(deleteProduct(selectedProduct.cid));
    }
    setDeleteModalOpen(false);
  };

  const handleRecurrenceChange = (e) => {
    dispatch(updateInsuranceData({ recurrence: e.target.checked }));
  };

  const handleValidityChange = (e) => {
    dispatch(updateInsuranceData({ validity: e.target.checked }));
  };

  const handleAuthNumberChange = (e) => {
    dispatch(updateInsuranceData({ authNumber: e.target.value }));
  };

  const itemContent = useCallback(
    (index, item) => (
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
      {insuranceEnabled && (
        <InsuranceAuthFields
          values={insuranceData}
          onRecurrenceChange={handleRecurrenceChange}
          onValidityChange={handleValidityChange}
          onAuthNumberChange={handleAuthNumberChange}
        />
      )}
      <BatchInfoModal
        isOpen={batchInfoModalOpen}
        onClose={() => setBatchInfoModalOpen(false)}
        product={selectedProduct}
      />

      <CommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        selectedProduct={selectedProduct}
        comment={comment}
        onCommentChange={setComment}
        onSave={handleSaveComment}
        onDelete={() => {
          if (selectedProduct) {
            setComment('');
            dispatch(
              updateProductFields({
                id: selectedProduct.id,
                data: { comment: '' },
              }),
            );
          }
          setCommentModalOpen(false);
        }}
      />

      <ProductDiscountModal
        visible={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        product={selectedProduct}
      />

      <Modal
        title="Eliminar producto"
        open={deleteModalOpen}
        onOk={handleDeleteProduct}
        onCancel={() => setDeleteModalOpen(false)}
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

const EmptyCartMessage = styled(motion.div)`
  margin: 1em;
`;

const Body = styled.div`
  display: grid;
  gap: 0.2rem;
  align-content: start;
  align-items: start;
  padding: 0.4em;
  border-top: 6px solid transparent;
  border-bottom: 0px solid transparent;
`;
