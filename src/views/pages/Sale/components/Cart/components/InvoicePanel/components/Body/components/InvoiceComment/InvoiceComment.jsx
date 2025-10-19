import {
    SaveOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { Modal, Button, Input, Card, Tooltip } from 'antd';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import {
    addInvoiceComment,
    deleteInvoiceComment,
    SelectInvoiceComment
} from '../../../../../../../../../../../features/cart/cartSlice';

const { TextArea } = Input;
const { confirm } = Modal;

/**
 * InvoiceComment
 * ---------------------------------------------------------------------------
 * Componente que permite visualizar, crear, editar y eliminar un comentario
 * asociado a la factura activa.
 * El diseño replica la estética usada en CommentModal para mantener coherencia
 * visual en toda la aplicación.
 * ---------------------------------------------------------------------------
 */
export const InvoiceComment = () => {
    const dispatch = useDispatch();
    const currentComment = useSelector(SelectInvoiceComment) || '';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [comment, setComment] = useState(currentComment);

    /* --------------------------- handlers UI --------------------------- */
    const showModal = () => {
        setComment(currentComment);
        setIsModalOpen(true);
    };

    const handleClose = () => setIsModalOpen(false);

    const handleSave = () => {
        dispatch(addInvoiceComment(comment.trim()));
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        confirm({
            title: '¿Eliminar comentario?',
            icon: <ExclamationCircleOutlined />,
            content: '¿Estás seguro que deseas eliminar este comentario de la factura?',
            okText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            okButtonProps: { danger: true },
            onOk: () => {
                dispatch(deleteInvoiceComment());
                setComment('');
                setIsModalOpen(false);
            }
        });
    };

    /* ------------------------------ render ----------------------------- */
    return (
        <>
            <Container>
                <Card
                    title="Comentario"
                    extra={
                        <Button 
                       type='link'
                        onClick={showModal}
                        >
                            {currentComment ? 'Editar' : 'Agregar'}
                        </Button>
                    }
                    size="small"
                >
                    {currentComment ? (
                        <CommentContent>{currentComment}</CommentContent>
                    ) : (
                        <EmptyComment>No hay comentario para esta factura</EmptyComment>
                    )}
                </Card>
            </Container>

            <StyledModal
                open={isModalOpen}
                onCancel={handleClose}
                centered
                closeIcon={null}
                footer={null}
                width={600}
            >
                <ModalContainer>
                     <Header>
            <InvoiceName>Comentario para la Factura</InvoiceName>
            <CloseButton onClick={handleClose} aria-label="Cerrar">
              <CloseOutlined />
            </CloseButton>
          </Header>
                    <ContentArea>
                        <EditorArea>
                            <TextArea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="Agregar un comentario a la factura..."
                                autoSize={{ minRows: 5, maxRows: 14 }}
                                maxLength={600}
                            />
                            <CharCount>{comment.length}/600</CharCount>
                        </EditorArea>

                        <ToolbarContainer>
                            <ToolbarLabel>Herramientas del comentario</ToolbarLabel>
                            <ToolbarActions>
                                {comment && (
                                    <Tooltip title="Eliminar comentario">
                                        <IconButton
                                            onClick={handleDelete}
                                            danger
                                            icon={<DeleteOutlined />}
                                        />
                                    </Tooltip>
                                )}
                            </ToolbarActions>
                        </ToolbarContainer>
                    </ContentArea>

                    <Actions>
                        <ButtonGroup>
                            <SaveButton onClick={handleSave} type="primary" icon={<SaveOutlined />}>
                                Guardar
                            </SaveButton>
                        </ButtonGroup>
                    </Actions>
                </ModalContainer>
            </StyledModal>
        </>
    );
};

/* -------------------------------------------------------------------------- */
/*                                  ESTILOS                                   */
/* -------------------------------------------------------------------------- */

const Container = styled.div`
  width: 100%;
  margin-bottom: 1em;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;

const InvoiceName = styled.h3`
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

  &:hover {
    color: #111827;
  }
`;

const CommentContent = styled.p`
  margin: 0;
  font-size: 14px;
  color: #334155;
`;

const EmptyComment = styled.p`
  margin: 0;
  font-style: italic;
  color: #94a3b8;
`;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    padding: 0;
    /* border-radius: 16px;  // se comenta para poder sobrescribir desde Ant */
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }
`;

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: #fff;
`;

const ContentArea = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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

const Actions = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const SaveButton = styled(Button)`
  border-radius: 4px;
`;
