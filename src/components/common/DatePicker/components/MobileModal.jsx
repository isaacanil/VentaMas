import React from 'react';
import styled from 'styled-components';
import { CloseOutlined } from '@ant-design/icons';

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: ${props => props.$open ? 'flex' : 'none'};
    align-items: flex-end;
    
    @media (min-height: 600px) {
        align-items: center;
        justify-content: center;
    }
`;

const ModalContent = styled.div`
    background: white;
    border-radius: 8px 8px 0 0;
    width: 100%;
    max-height: 95vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideUp 0.3s ease-out;
    
    @media (min-height: 600px) {
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        max-height: 100vh;
    }
    
    @keyframes slideUp {
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
    justify-content: space-between;
    align-items: center;
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
    border: none;
    background: transparent;
    color: #8c8c8c;
    cursor: pointer;
    border-radius: 4px;
    
    &:hover {
        background: #f5f5f5;
        color: #595959;
    }
`;

const ModalBody = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 0;
`;

export const MobileModal = ({
    open,
    onClose,
    title,
    children
}) => {
    return (
        <ModalOverlay
            $open={open}
            onClick={onClose}
        >
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>
                        {title}
                    </ModalTitle>
                    <CloseButton onClick={onClose}>
                        <CloseOutlined />
                    </CloseButton>
                </ModalHeader>
                <ModalBody>
                    {children}
                </ModalBody>
            </ModalContent>
        </ModalOverlay>
    );
}; 