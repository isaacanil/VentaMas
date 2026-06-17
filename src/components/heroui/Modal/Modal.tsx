import { Modal as HeroModal } from '@heroui/react';
import type {
  ModalBackdropProps,
  ModalBodyProps,
  ModalContainerProps,
  ModalDialogProps,
  ModalFooterProps,
  ModalHeaderProps,
  ModalHeadingProps,
  ModalProps,
} from '@heroui/react';
import type { ReactNode } from 'react';
import styled from 'styled-components';

import { vmSurfaceBorderStyles } from '../styles';

type VmModalRootProps = {
  isOpen: boolean;
  children: ReactNode;
  title?: ReactNode;
  footer?: ReactNode;
  placement?: ModalContainerProps['placement'];
  scroll?: ModalContainerProps['scroll'];
  size?: ModalContainerProps['size'];
  isDismissable?: ModalBackdropProps['isDismissable'];
  isKeyboardDismissDisabled?: ModalBackdropProps['isKeyboardDismissDisabled'];
  backdropVariant?: ModalBackdropProps['variant'];
  onOpenChange?: ModalBackdropProps['onOpenChange'];
  showCloseButton?: boolean;
  closeButtonLabel?: string;
  ariaLabel?: string;
  backdropClassName?: string;
  containerClassName?: string;
  dialogClassName?: string;
  dialogProps?: Omit<ModalDialogProps, 'children' | 'className'>;
};

const VmModalDialog = styled(HeroModal.Dialog)`
  ${vmSurfaceBorderStyles}
`;

const VmModalFooter = styled(HeroModal.Footer)`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;
`;

const VmModalRoot = ({
  isOpen,
  children,
  title,
  footer,
  placement = 'center',
  scroll = 'inside',
  size,
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  backdropVariant,
  onOpenChange,
  showCloseButton = true,
  closeButtonLabel = 'Cerrar',
  ariaLabel,
  backdropClassName,
  containerClassName,
  dialogClassName,
  dialogProps,
}: VmModalRootProps) => {
  const resolvedAriaLabel =
    ariaLabel ?? (typeof title === 'string' ? title : undefined);

  return (
    <HeroModal.Backdrop
      isOpen={isOpen}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      onOpenChange={onOpenChange}
      variant={backdropVariant}
      className={backdropClassName}
    >
      <HeroModal.Container
        placement={placement}
        scroll={scroll}
        size={size}
        className={containerClassName}
      >
        <VmModalDialog
          aria-label={resolvedAriaLabel}
          className={dialogClassName}
          {...dialogProps}
        >
          {title || showCloseButton ? (
            <HeroModal.Header>
              {title ? <HeroModal.Heading>{title}</HeroModal.Heading> : null}
              {showCloseButton ? (
                <HeroModal.CloseTrigger aria-label={closeButtonLabel} />
              ) : null}
            </HeroModal.Header>
          ) : null}
          <HeroModal.Body>{children}</HeroModal.Body>
          {footer ? <VmModalFooter>{footer}</VmModalFooter> : null}
        </VmModalDialog>
      </HeroModal.Container>
    </HeroModal.Backdrop>
  );
};

export const VmModal = Object.assign(VmModalRoot, {
  Root: VmModalRoot,
  Primitive: HeroModal,
  Trigger: HeroModal.Trigger,
  Backdrop: HeroModal.Backdrop,
  Container: HeroModal.Container,
  Dialog: VmModalDialog,
  Header: HeroModal.Header,
  Icon: HeroModal.Icon,
  Heading: HeroModal.Heading,
  Body: HeroModal.Body,
  Footer: VmModalFooter,
  CloseTrigger: HeroModal.CloseTrigger,
});

export type { VmModalRootProps as VmModalProps };
export type {
  ModalBackdropProps as VmModalBackdropProps,
  ModalBodyProps as VmModalBodyProps,
  ModalContainerProps as VmModalContainerProps,
  ModalDialogProps as VmModalDialogProps,
  ModalFooterProps as VmModalFooterProps,
  ModalHeaderProps as VmModalHeaderProps,
  ModalHeadingProps as VmModalHeadingProps,
  ModalProps as VmModalRootBaseProps,
};
