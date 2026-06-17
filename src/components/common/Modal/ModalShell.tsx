import { type ReactNode } from 'react';

import { Modal, type ModalProps } from './Modal';
import { Body } from './ModalShell.styles';

export type ModalShellProps = Omit<ModalProps, 'footer' | 'children'> & {
  footer: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
};
export const ModalShell = ({
  footer,
  children,
  bodyClassName,
  styles,
  ...props
}: ModalShellProps) => {
  return (
    <Modal
      footer={footer}
      styles={{
        container: {
          ['--modal-viewport-offset' as string]: '0px',
          maxHeight: 'calc(100dvh - 0px)',
          ...styles?.container,
        },
        body: {
          padding: 0,
          ...styles?.body,
        },
        ...styles,
      }}
      {...props}
    >
      <Body className={bodyClassName}>{children}</Body>
    </Modal>
  );
};
