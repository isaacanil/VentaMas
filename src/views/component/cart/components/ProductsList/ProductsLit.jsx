import { Modal, Alert } from 'antd';
import { AnimatePresence, motion } from 'framer-motion'
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'

import { ProductDiscountModal } from '../../../../../components/modals/ProductDiscountModal/ProductDiscountModal';
import { deleteProduct, SelectProduct, updateProductFields } from '../../../../../features/cart/cartSlice'
import { selectInsuranceData, updateInsuranceData } from '../../../../../features/insurance/insuranceSlice'
import useInsuranceEnabled from '../../../../../hooks/useInsuranceEnabled'
import Typography from '../../../../templates/system/Typografy/Typografy'
import { InsuranceAuthFields } from '../InsuranceAuthFields/InsuranceAuthFields'
import { ProductCardForCart } from '../ProductCardForCart/ProductCardForCart'


import { CommentModal } from './components/CommentModal/CommentModal';


export const ProductsList = () => {
    const dispatch = useDispatch();
    const ProductSelected = useSelector(SelectProduct);
    const insuranceEnabled = useInsuranceEnabled();
    const insuranceData = useSelector(selectInsuranceData);
    const EMPTY_CART_MESSAGE = "Los productos seleccionados aparecerán aquí...";    // Estado para modales globales
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [discountModalOpen, setDiscountModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [comment, setComment] = useState("");    // Handlers para abrir modales
    const handleOpenCommentModal = (product) => {
        setSelectedProduct(product);
        setComment(product.comment || "");
        setCommentModalOpen(true);
    };

    const handleOpenDeleteModal = (product) => {
        setSelectedProduct(product);
        setDeleteModalOpen(true);
    };

    const handleOpenDiscountModal = (product) => {
        setSelectedProduct(product);
        setDiscountModalOpen(true);
    };
    // Guardar comentario
    const handleSaveComment = () => {
        if (selectedProduct) {
            dispatch(updateProductFields({
                id: selectedProduct.id,
                data: { comment }
            }));
        }
        setCommentModalOpen(false);
    };
    // Eliminar producto
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

    return (
        <Container>
            <Body>
                {ProductSelected.length > 0 ? (
                    <AnimatePresence>                        {ProductSelected.map((item, index) => (
                            <ProductCardForCart
                                item={item}
                                key={index}
                                onOpenCommentModal={handleOpenCommentModal}
                                onOpenDeleteModal={handleOpenDeleteModal}
                                onOpenDiscountModal={handleOpenDiscountModal}
                            />
                        ))}
                    </AnimatePresence>
                ) : (
                    <EmptyCartMessage
                        key="empty-message"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Typography variant='body1'>
                            {EMPTY_CART_MESSAGE}
                        </Typography>
                    </EmptyCartMessage>
                )}
            </Body>
            {insuranceEnabled && (
                <InsuranceAuthFields
                    values={insuranceData}
                    onRecurrenceChange={handleRecurrenceChange}
                    onValidityChange={handleValidityChange}
                    onAuthNumberChange={handleAuthNumberChange}
                />
            )}            <CommentModal
                isOpen={commentModalOpen}
                onClose={() => setCommentModalOpen(false)}
                selectedProduct={selectedProduct}
                comment={comment}
                onCommentChange={setComment}
                onSave={handleSaveComment}
                onDelete={() => {
                    setComment("");
                    dispatch(updateProductFields({
                        id: selectedProduct.id,
                        data: { comment: "" }
                    }));
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
    )
}

const Container = styled.ul`
    background-color: ${props => props.theme.bg.color2}; 
    display: grid;
    gap: 0.4em;
    grid-template-rows: 1fr min-content;
    width: 100%;
    margin: 0;
    padding: 0.4em;
    overflow-y: scroll;
    position: relative;
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.121);
`
const EmptyCartMessage = styled(motion.div)`
  margin: 1em;
`;

const Body = styled.div`
    display: grid;
    align-items: start;
    align-content: start;
    gap: 0.2rem;
`;