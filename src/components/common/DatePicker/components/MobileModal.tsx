import { CloseOutlined } from '@ant-design/icons';
import React from 'react';
import styled from 'styled-components';

interface MobileModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

interface ModalOverlayProps {
  $open: boolean;
}

const ModalOverlay = styled.div<ModalOverlayProps>`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: ${(props: ModalOverlayProps) => (props.$open ? 'flex' : 'none')};
  align-items: flex-end;
  background: rgb(0 0 0 / 50%);

  @media (height >= 600px) {
    align-items: center;
    justify-content: center;
  }
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 95vh;
  overflow: hidden;
  background: white;
  border-radius: 8px 8px 0 0;
  animation: slide-up 0.3s ease-out;

  @media (height >= 600px) {
    width: 90%;
    max-width: 400px;
    max-height: 100vh;
    border-radius: 8px;
  }

  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }

    to {
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #262626;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #8c8c8c;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;

  &:hover {
    color: #595959;
    background: #f5f5f5;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  padding: 0;
  overflow-y: auto;
`;

export const MobileModal = ({
  open,
  onClose,
  title,
  children,
}: MobileModalProps) => {
  return (
    <ModalOverlay $open={open} onClick={onClose}>
      <ModalContent
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <CloseButton onClick={onClose} aria-label="Cerrar">
            <CloseOutlined />
          </CloseButton>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};
