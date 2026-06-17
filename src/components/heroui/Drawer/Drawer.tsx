import { Drawer as HeroDrawer } from '@heroui/react';
import type {
  DrawerBackdropProps,
  DrawerBodyProps,
  DrawerContentProps,
  DrawerDialogProps,
  DrawerFooterProps,
  DrawerHandleProps,
  DrawerHeaderProps,
  DrawerHeadingProps,
  DrawerProps,
} from '@heroui/react';
import type { ReactNode } from 'react';
import styled from 'styled-components';

import { vmSurfaceBorderStyles } from '../styles';

type VmDrawerRootProps = {
  isOpen: boolean;
  children: ReactNode;
  title?: ReactNode;
  footer?: ReactNode;
  placement?: DrawerContentProps['placement'];
  isDismissable?: DrawerBackdropProps['isDismissable'];
  isKeyboardDismissDisabled?: DrawerBackdropProps['isKeyboardDismissDisabled'];
  onOpenChange?: DrawerBackdropProps['onOpenChange'];
  showCloseButton?: boolean;
  closeButtonLabel?: string;
  showHandle?: boolean;
  ariaLabel?: string;
  backdropClassName?: string;
  contentClassName?: string;
  dialogClassName?: string;
  dialogProps?: Omit<DrawerDialogProps, 'children' | 'className'>;
};

const VmDrawerDialog = styled(HeroDrawer.Dialog)`
  ${vmSurfaceBorderStyles}
`;

const VmDrawerBody = styled(HeroDrawer.Body)`
  min-width: 0;
`;

const VmDrawerFooter = styled(HeroDrawer.Footer)`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;
`;

const VmDrawerRoot = ({
  isOpen,
  children,
  title,
  footer,
  placement = 'bottom',
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  onOpenChange,
  showCloseButton = true,
  closeButtonLabel = 'Cerrar',
  showHandle = placement === 'bottom',
  ariaLabel,
  backdropClassName,
  contentClassName,
  dialogClassName,
  dialogProps,
}: VmDrawerRootProps) => {
  const resolvedAriaLabel =
    ariaLabel ?? (typeof title === 'string' ? title : undefined);

  return (
    <HeroDrawer>
      <HeroDrawer.Backdrop
        isOpen={isOpen}
        isDismissable={isDismissable}
        isKeyboardDismissDisabled={isKeyboardDismissDisabled}
        onOpenChange={onOpenChange}
        className={backdropClassName}
      >
        <HeroDrawer.Content placement={placement} className={contentClassName}>
          <VmDrawerDialog
            aria-label={resolvedAriaLabel}
            className={dialogClassName}
            {...dialogProps}
          >
            {showHandle ? <HeroDrawer.Handle /> : null}
            {title || showCloseButton ? (
              <HeroDrawer.Header>
                {title ? (
                  <HeroDrawer.Heading>{title}</HeroDrawer.Heading>
                ) : null}
                {showCloseButton ? (
                  <HeroDrawer.CloseTrigger aria-label={closeButtonLabel} />
                ) : null}
              </HeroDrawer.Header>
            ) : null}
            <VmDrawerBody>{children}</VmDrawerBody>
            {footer ? <VmDrawerFooter>{footer}</VmDrawerFooter> : null}
          </VmDrawerDialog>
        </HeroDrawer.Content>
      </HeroDrawer.Backdrop>
    </HeroDrawer>
  );
};

export const VmDrawer = Object.assign(VmDrawerRoot, {
  Root: VmDrawerRoot,
  Primitive: HeroDrawer,
  Backdrop: HeroDrawer.Backdrop,
  Content: HeroDrawer.Content,
  Dialog: VmDrawerDialog,
  Handle: HeroDrawer.Handle,
  Header: HeroDrawer.Header,
  Heading: HeroDrawer.Heading,
  Body: VmDrawerBody,
  Footer: VmDrawerFooter,
  CloseTrigger: HeroDrawer.CloseTrigger,
});

export type { VmDrawerRootProps as VmDrawerProps };
export type {
  DrawerBackdropProps as VmDrawerBackdropProps,
  DrawerBodyProps as VmDrawerBodyProps,
  DrawerContentProps as VmDrawerContentProps,
  DrawerDialogProps as VmDrawerDialogProps,
  DrawerFooterProps as VmDrawerFooterProps,
  DrawerHandleProps as VmDrawerHandleProps,
  DrawerHeaderProps as VmDrawerHeaderProps,
  DrawerHeadingProps as VmDrawerHeadingProps,
  DrawerProps as VmDrawerRootBaseProps,
};
