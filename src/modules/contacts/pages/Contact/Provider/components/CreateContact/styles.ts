import styled, { css } from 'styled-components';

import { MainLayoutModal } from '@/components/common/Modal/Modal';

export const ModalLayout = styled(MainLayoutModal).attrs<{
  $hasDetails: boolean;
}>(({ $hasDetails }) => ({
  $hasSecondary: $hasDetails,
  $secondaryWidth: '420px',
  $secondaryPosition: 'right',
}))``;

const panelBase = css`
  min-width: 0;
`;

export const FormPanel = styled.div<{ $hasDetails: boolean }>`
  ${panelBase}
  overflow-y: auto;
  max-height: calc(
    100dvh
    - var(--modal-viewport-offset, 16px)
    - var(--modal-header-height, 72px)
    - var(--modal-footer-extra-offset, 76px)
  );
  width: 100%;
  padding: 16px 16px 20px;
  background: #fff;

  @media (width <= 1100px) {
    max-height: none;
    overflow-y: visible;
  }
`;

export const DetailsPanel = styled.div`
  ${panelBase}
  overflow-y: auto;
  max-height: calc(
    100dvh
    - var(--modal-viewport-offset, 16px)
    - var(--modal-header-height, 72px)
    - var(--modal-footer-extra-offset, 76px)
  );
  align-self: stretch;
  padding: 10px 12px;
  border-left: 1px solid #f0f0f0;
  background: #fafafa;

  @media (width <= 1100px) {
    max-height: none;
    overflow-y: visible;
    border-top: 1px solid #f0f0f0;
    border-left: none;
  }
`;

export const AlertStack = styled.div`
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;
