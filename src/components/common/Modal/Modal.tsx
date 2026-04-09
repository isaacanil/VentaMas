import { Modal as AntdModal, type ModalProps as AntdModalProps } from 'antd';
import type { CSSProperties } from 'react';
import { isValidElement } from 'react';
import styled from 'styled-components';

type ModalStyleKey =
  | 'root'
  | 'header'
  | 'body'
  | 'footer'
  | 'container'
  | 'title'
  | 'wrapper'
  | 'mask';

type ModalStyleMap = Partial<Record<ModalStyleKey, CSSProperties>>;

const normalizeFooter = (footer: AntdModalProps['footer']) =>
  Array.isArray(footer) && footer.length === 0 ? null : footer;

const hasRenderableFooter = (footer: AntdModalProps['footer']) => {
  if (footer == null) return false;
  if (Array.isArray(footer)) return footer.length > 0;
  if (typeof footer === 'boolean') return footer;
  if (typeof footer === 'function') return true;
  if (typeof footer === 'string' || typeof footer === 'number') return true;
  return isValidElement(footer);
};

export interface ModalProps extends AntdModalProps {
  styles?: ModalStyleMap;
}

export const Modal = ({
  children,
  centered = true,
  footer,
  styles,
  ...props
}: ModalProps) => {
  const resolvedFooter = normalizeFooter(footer);
  const hasFooter = hasRenderableFooter(resolvedFooter);
  const baseStyles: ModalStyleMap = {
    body: {
      minHeight: 0,
      padding: 0,
      background: '#fff',
      maxHeight:
        'calc(100dvh - var(--modal-viewport-offset) - var(--modal-header-height) - var(--modal-footer-extra-offset))',
      overflow: 'auto',
    },
    container: {
      maxHeight: 'calc(100dvh - 16px)',
      borderRadius: 12,
      padding: '0',
      overflow: 'hidden',
      ['--modal-viewport-offset' as string]: '16px',
      ['--modal-header-height' as string]: '72px',
      ['--modal-footer-height' as string]: '76px',
      ['--modal-footer-extra-offset' as string]: hasFooter
        ? 'var(--modal-footer-height)'
        : '0px',
    } as CSSProperties,
    footer: {
      marginTop: 0,
      padding: '10px 16px 14px',
      borderTop: '1px solid #f0f0f0',
      background: '#fff',
    },
    header: {
      marginBottom: 0,
      padding: '1em',
      background: '#fff',
    },
  };
  const mergedStyles: ModalStyleMap = {
    ...baseStyles,
    ...styles,
    body: {
      ...baseStyles.body,
      ...styles?.body,
    },
    container: {
      ...baseStyles.container,
      ...styles?.container,
    },
    footer: {
      ...baseStyles.footer,
      ...styles?.footer,
    },
    header: {
      ...baseStyles.header,
      ...styles?.header,
    },
  };

  return (
    <StyledModal
      centered={centered}
      footer={resolvedFooter}
      styles={mergedStyles}
      {...props}
    >
      {children}
    </StyledModal>
  );
};

interface MainLayoutBodyProps {
  $hasSecondary?: boolean;
  $secondaryWidth?: string;
  $secondaryPosition?: 'left' | 'right';
  $viewportOffset?: string;
  $bodyHeight?: string;
  $minBodyHeight?: string;
}

const resolveViewportBodyLimit = ({
  $bodyHeight,
  $viewportOffset = '132px',
}: Pick<MainLayoutBodyProps, '$bodyHeight' | '$viewportOffset'>) =>
  $bodyHeight ??
  `calc(100dvh - ${$viewportOffset} - var(--modal-footer-extra-offset, 0px))`;

const resolveMinBodyHeight = ({
  $minBodyHeight = '0px',
  ...props
}: MainLayoutBodyProps) =>
  $minBodyHeight === '0px'
    ? '0px'
    : `min(${$minBodyHeight}, ${resolveViewportBodyLimit(props)})`;

export const MainLayoutModal = styled.div<MainLayoutBodyProps>`
  display: grid;
  grid-template-columns: ${({
    $hasSecondary = true,
    $secondaryWidth = '360px',
    $secondaryPosition = 'right',
  }) => {
    if (!$hasSecondary) return 'minmax(0, 1fr)';
    return $secondaryPosition === 'left'
      ? `${$secondaryWidth} minmax(0, 1fr)`
      : `minmax(0, 1fr) ${$secondaryWidth}`;
  }};
  height: ${({ $bodyHeight = 'auto' }) => $bodyHeight};
  min-height: ${resolveMinBodyHeight};
  min-width: 0;
  align-items: stretch;
  background: #fff;

  @media (width <= 1100px) {
    grid-template-columns: 1fr;
    height: auto;
  }
`;

const StyledModal = styled(AntdModal)`
  .ant-modal {
    max-width: calc(100vw - 32px);
  }

  .ant-modal-content {
    display: flex;
    flex-direction: column;
  }

  .ant-modal-header,
  .ant-modal-footer {
    flex-shrink: 0;
  }

  .ant-modal-body {
    flex: 1 1 auto;
    min-height: 0;
  }
`;
