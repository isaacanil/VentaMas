import { type ReactNode } from 'react';
import styled from 'styled-components';

import { Modal, type ModalProps } from './Modal';

type ModalShellProps = Omit<ModalProps, 'footer' | 'children'> & {
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
          ...(styles?.container ?? {}),
        },
        body: {
          padding: 0,
          ...(styles?.body ?? {}),
        },
        ...styles,
      }}
      {...props}
    >
      <Body className={bodyClassName}>{children}</Body>
    </Modal>
  );
};

const Body = styled.div`
  padding: 16px 20px 20px;

`;
