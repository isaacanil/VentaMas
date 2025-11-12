import { CloseOutlined, SaveOutlined, ExclamationCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { Modal, Button, Input, Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';

const { TextArea } = Input;

export const CommentModal = ({
    isOpen,
    onClose,
    selectedProduct,
    comment,
    onCommentChange,
    onSave,
    onDelete
}) => {

    return (
        <StyledModal
            open={isOpen}
            onCancel={onClose}
            centered
            closeIcon={null}
            footer={null}
        >
            <ModalContainer>
                <Header>
                    <ProductName>{selectedProduct?.name}</ProductName>
                    <CloseButton onClick={onClose}>
                        <CloseOutlined />
                    </CloseButton>
                </Header>

                <ContentArea>
                    <EditorArea>
                        <TextArea
                            value={comment}
                            onChange={e => onCommentChange(e.target.value)}
                            placeholder="Agregar un comentario..."
                            autoSize={{ minRows: 5, maxRows: 14 }}
                            maxLength={600}
                        />
                        <CharCount>{comment.length}/600</CharCount>
                    </EditorArea>                    <ToolbarContainer>
                        <ToolbarLabel>Herramientas del comentario</ToolbarLabel>
                        <ToolbarActions>
                            {/* <Tooltip title="Revisar ortografía">
                                <IconButton
                                    onClick={handleCheckSpelling}
                                    loading={isCheckingSpelling}
                                    disabled={isSpellCheckDisabled}
                                    icon={<CheckOutlined />}
                                />
                            </Tooltip>
                             */}
                            {comment && (
                                <Tooltip title="Eliminar comentario">
                                    <IconButton
                                        onClick={() => {
                                            Modal.confirm({
                                                title: '¿Eliminar comentario?',
                                                icon: <ExclamationCircleOutlined />,
                                                content: '¿Estás seguro que deseas eliminar este comentario?',
                                                okText: 'Sí, eliminar',
                                                cancelText: 'Cancelar',
                                                okButtonProps: { danger: true },
                                                onOk: onDelete
                                            });
                                        }}
                                        danger
                                        icon={<DeleteOutlined />}
                                    />
                                </Tooltip>
                            )}
                        </ToolbarActions>
                    </ToolbarContainer>
                </ContentArea>                <Actions>
                    <ButtonGroup>
                        <SaveButton onClick={onSave} type="primary" icon={<SaveOutlined />}>
                            Guardar
                        </SaveButton>

                    </ButtonGroup>
                </Actions>
            </ModalContainer>
        </StyledModal>
    );
};

const StyledModal = styled(Modal)`
    .ant-modal-content {
        padding: 0;
        /* border-radius: 16px; */
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    }
`;

const ModalContainer = styled.div`
    display: flex;
    flex-direction: column;
    background: #fff;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
`;

const ProductName = styled.h3`
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #1f2937;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

`;

const ContentArea = styled.div`
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 180px;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 8px;
`;

const EditorArea = styled.div`
    position: relative;
    background: #f8fafc;
    border-radius: 12px;
    padding: 4px;

    .ant-input {
        background: transparent;
        font-size: 14px;
        color: #334155;
        
        &::placeholder {
            color: #94a3b8;
        }
    }
`;

const CharCount = styled.span`
    position: absolute;
    bottom: 8px;
    right: 12px;
    font-size: 11px;
    color: #94a3b8;
`;

const Actions = styled.div`
    padding: 16px 20px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
`;

const SaveButton = styled(Button)`
`;

const ToolbarContainer = styled.div`
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    padding: 8px 1.4em;
   
`;

const ToolbarLabel = styled.span`
    font-size: 12px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: block;
    margin-bottom: 8px;
`;

const ToolbarActions = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

const IconButton = styled(Button)`
    &.ant-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border-radius: 50%;

        &[disabled] {
            background: #f1f5f9;
            border-color: transparent;
            
            .anticon {
                color: #94a3b8;
            }
        }

        &.ant-btn-dangerous {
            background: #fef2f2;
            
            &:hover {
                background: #fee2e2;
            }
        }

        .anticon {
            font-size: 16px;
        }
    }
`;
