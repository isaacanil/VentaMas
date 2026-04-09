import {
  CloseOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
} from '@/constants/icons/antd';
import { Modal, Button, Input, Tooltip } from 'antd';
import React from 'react';
import type { Product as CartProduct } from '@/features/cart/types';
import styled from 'styled-components';

const { TextArea } = Input;

type CommentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct?: CartProduct | null;
  comment: string;
  onCommentChange: (value: string) => void;
  onSave: () => void;
  onDelete: () => void;
};

export const CommentModal = ({
  isOpen,
  onClose,
  selectedProduct,
  comment,
  onCommentChange,
  onSave,
  onDelete,
}: CommentModalProps) => {
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
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Agregar un comentario..."
              autoSize={{ minRows: 5, maxRows: 14 }}
              maxLength={600}
            />
            <CharCount>{comment.length}/600</CharCount>
          </EditorArea>{' '}
          <ToolbarContainer>
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
                        content:
                          '¿Estás seguro que deseas eliminar este comentario?',
                        okText: 'Sí, eliminar',
                        cancelText: 'Cancelar',
                        okButtonProps: { danger: true },
                        onOk: onDelete,
                      });
                    }}
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
              )}
            </ToolbarActions>
          </ToolbarContainer>
        </ContentArea>{' '}
        <Actions>
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
    box-shadow: 0 8px 32px rgb(0 0 0 / 8%);
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  color: #6b7280;
  cursor: pointer;
  background: none;
  border: none;
  transition: all 0.2s;
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 180px;
  padding: 20px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const EditorArea = styled.div`
  position: relative;
  padding: 4px;
  background: #f8fafc;
  border-radius: 12px;

  .ant-input {
    font-size: 14px;
    color: #334155;
    background: transparent;

    &::placeholder {
      color: #94a3b8;
    }
  }
`;

const CharCount = styled.span`
  position: absolute;
  right: 12px;
  bottom: 8px;
  font-size: 11px;
  color: #94a3b8;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
`;

const SaveButton = styled(Button)``;

const ToolbarContainer = styled.div`
  padding: 8px 1.4em;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const ToolbarLabel = styled.span`
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
