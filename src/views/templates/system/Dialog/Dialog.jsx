import { message } from 'antd'; // Nuevo import
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import styled, { css } from 'styled-components';

import { icons } from '../../../../constants/icons/icons';
import { useDialog } from '../../../../Context/Dialog';
import { ButtonGroup } from '../Button/Button';
import Typography from '../Typografy/Typografy';

import { BackdropVariants, ContainerVariants } from './variants';

const dialogTheme = {
  error: {
    background: '#FFF5F5',
    border: '#FFA5A5',
    text: '#DC2626',
    button: '#EF4444',
    buttonHover: '#DC2626',
    iconBg: 'rgba(239, 68, 68, 0.1)',
  },
  warning: {
    background: '#FFFBEB',
    border: '#FCD34D',
    text: '#D97706',
    button: '#F59E0B',
    buttonHover: '#D97706',
    iconBg: 'rgba(245, 158, 11, 0.1)',
  },
  success: {
    background: '#F0FDF4',
    border: '#86EFAC',
    text: '#16A34A',
    button: '#22C55E',
    buttonHover: '#16A34A',
    iconBg: 'rgba(34, 197, 94, 0.1)',
  },
  info: {
    background: '#EFF6FF',
    border: '#93C5FD',
    text: '#2563EB',
    button: '#3B82F6',
    buttonHover: '#2563EB',
    iconBg: 'rgba(59, 130, 246, 0.1)',
  },
};

const iconTypes = {
  warning: icons.types.warning,
  error: icons.types.error,
  success: icons.types.success,
  info: icons.types.info,
};

const BaseButton = styled.button`
  position: relative;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: 0.75rem 1.5rem;
  overflow: hidden;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transform-origin: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
    transform: none !important;
  }

  &::before {
    position: absolute;
    inset: 0;
    content: '';
    background: linear-gradient(
      45deg,
      transparent,
      rgb(255 255 255 / 10%),
      transparent
    );
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  &:hover:not(:disabled)::before {
    transform: translateX(100%);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

const CancelButton = styled(BaseButton)`
  color: #64748b;
  background: ${(props) => props.theme.colors.background || '#ffffff'};
  border: 2px solid #e2e8f0;

  &:hover:not(:disabled) {
    color: #475569;
    background: #f8fafc;
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgb(148 163 184 / 10%);
    transform: translateY(-2px);
  }
`;

const ConfirmButton = styled(BaseButton)`
  color: white;
  background: ${(props) => dialogTheme[props.$type]?.button || '#3b82f6'};
  border: none;
  box-shadow: 0 2px 8px ${(props) => dialogTheme[props.$type]?.border}40;

  &:hover:not(:disabled) {
    background: ${(props) =>
      dialogTheme[props.$type]?.buttonHover || '#2563eb'};
    box-shadow: 0 4px 15px ${(props) => dialogTheme[props.$type]?.border}60;
    transform: translateY(-2px);
  }

  &:disabled {
    background: ${(props) => dialogTheme[props.$type]?.button}90;
  }
`;

const CloseButton = styled(BaseButton)`
  width: 32px;
  min-width: unset;
  height: 32px;
  padding: 0;
  color: ${({ $type }) => dialogTheme[$type]?.text};
  background: transparent;
  border: 2px solid ${({ $type }) => dialogTheme[$type]?.border}40;
  border-radius: 50%;

  &:hover:not(:disabled) {
    background: ${({ $type }) => dialogTheme[$type]?.border}20;
    transform: rotate(90deg);
  }

  svg {
    width: 16px;
    height: 16px;
    fill: ${({ $type }) => dialogTheme[$type]?.text};
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: rotation 1s linear infinite;

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
`;

const Dialog = () => {
  const { dialog, onClose } = useDialog();
  const [isLoading, setIsLoading] = useState(false);
  if (!dialog.isOpen) return null;

  // Extraer propiedades directamente de dialog, ya no se usa config
  const {
    isOpen,
    title,
    type,
    message: dialogMessage,
    onConfirm,
    onCancel,
    size = 'default',
    successMessage,
    cancelButtonText,
    confirmButtonText,
  } = dialog;

  const handleCancel = () => {
    if (!isLoading) {
      onCancel?.();
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true);
      try {
        const result = onConfirm();
        if (result && typeof result.then === 'function') {
          await result;
        }
        // Mostrar mensaje de éxito si successMessage existe
        if (successMessage) {
          message.success(successMessage);
        }
      } finally {
        setIsLoading(false);
        onClose();
      }
    }
  };

  // Usar los textos directamente desde dialog o valores por defecto
  const cancelText =
    cancelButtonText || (onConfirm === null ? 'Aceptar' : 'Cancelar');
  const confirmText = confirmButtonText || 'Confirmar';

  return (
    <AnimatePresence>
      {isOpen && (
        <Backdrop
          variants={BackdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <Container
            variants={ContainerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            $size={size}
            $type={type}
          >
            <Header $type={type}>
              <Typography variant="h2" disableMargins>
                {title}
              </Typography>
              <CloseButton
                onClick={onClose}
                $type={type}
                disabled={isLoading}
                aria-label="Cerrar diálogo"
              >
                {icons.operationModes.close}
              </CloseButton>
            </Header>
            <Body>
              <Description $type={type}>
                <IconWrapper $type={type}>{iconTypes[type]}</IconWrapper>
                <MessageText variant="p" color="inherit" disableMargins>
                  {dialogMessage}
                </MessageText>
              </Description>
            </Body>
            <Footer>
              <ButtonGroup>
                <CancelButton onClick={handleCancel} disabled={isLoading}>
                  {cancelText}
                </CancelButton>
                {onConfirm !== null && (
                  <ConfirmButton
                    onClick={handleConfirm}
                    $type={type}
                    disabled={isLoading}
                  >
                    {confirmText}
                    {isLoading && <LoadingSpinner />}
                  </ConfirmButton>
                )}
              </ButtonGroup>
            </Footer>
          </Container>
        </Backdrop>
      )}
    </AnimatePresence>
  );
};

export default Dialog;

const getDialogSize = (size) => {
  const sizes = {
    small: css`
      max-width: 400px;
      min-height: 200px;
    `,
    default: css`
      max-width: 600px;
      min-height: 300px;
    `,
    large: css`
      max-width: 800px;
      min-height: 400px;
    `,
  };
  return sizes[size] || sizes.default;
};

const Backdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100%;
  padding: 1rem;
  backdrop-filter: blur(4px) brightness(0.7);
`;

const Container = styled(motion.div)`
  ${(props) => getDialogSize(props.$size)}

  width: 100%;
  background-color: ${({ $type, theme }) =>
    dialogTheme[$type]?.background || theme.colors.background};
  border-radius: 16px;
  box-shadow: 0 8px 32px rgb(0 0 0 / 8%);
  padding: 1.75rem;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  gap: 1.5rem;
  border: 2px solid
    ${({ $type }) => dialogTheme[$type]?.border || 'rgba(0,0,0,0.1)'};
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  color: ${({ $type }) => dialogTheme[$type]?.text};
  border-bottom: 1px solid ${({ $type }) => dialogTheme[$type]?.border}30;
`;

const Body = styled.div`
  display: flex;
  align-items: flex-start;
`;

const Description = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  width: 100%;
  padding: 1.5rem;
  color: ${({ $type }) => dialogTheme[$type]?.text};
  background-color: ${({ $type }) =>
    dialogTheme[$type]?.iconBg || 'rgba(0,0,0,0.05)'};
  border: 1px solid ${({ $type }) => dialogTheme[$type]?.border}30;
  border-radius: 12px;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2em;
  height: 2em;
  color: ${({ $type }) => dialogTheme[$type]?.text || 'inherit'};
`;

const MessageText = styled(Typography)`
  flex: 1;
  line-height: 1.5;
`;

const Footer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;
