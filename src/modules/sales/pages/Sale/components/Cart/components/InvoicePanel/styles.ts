import styled from 'styled-components';

import { VmDrawer, VmModal } from '@/components/heroui';

export const InvoicePanelDialog = styled(VmModal.Primitive.Dialog)`
  display: flex;
  flex-direction: column;
  width: min(520px, calc(100vw - var(--ds-space-8, 32px)));
  max-width: min(520px, calc(100vw - var(--ds-space-8, 32px)));
  height: min(
    720px,
    calc(var(--visual-viewport-height, 100vh) - var(--ds-space-4, 16px))
  );
  max-height: calc(
    var(--visual-viewport-height, 100vh) - var(--ds-space-4, 16px)
  );
  padding: 0;

  .modal__header {
    padding: var(--ds-space-5, 20px) var(--ds-space-5, 20px) 0;
  }
`;

export const InvoicePanelModalContainer = styled(VmModal.Primitive.Container)`
  padding-block: var(--ds-space-2, 8px);
  padding-inline: var(--ds-space-4, 16px);

  @media (width >= 640px) {
    padding-block: var(--ds-space-2, 8px);
    padding-inline: var(--ds-space-6, 24px);
  }
`;

export const InvoicePanelBody = styled(VmModal.Primitive.Body)<{
  $isBusy?: boolean;
}>`
  flex: 1 1 auto;
  min-height: 0;
  padding: 0;
  overflow: ${({ $isBusy }) => ($isBusy ? 'hidden' : 'auto')};
`;

export const InvoicePanelFooter = styled(VmModal.Primitive.Footer)`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 0 var(--ds-space-4, 16px) var(--ds-space-3, 12px);
`;

export const InvoicePanelDrawerDialog = styled(VmDrawer.Primitive.Dialog)`
  display: flex;
  flex-direction: column;
  height: min(
    720px,
    calc(var(--visual-viewport-height, 100vh) - var(--ds-space-3, 12px))
  );
  max-height: calc(
    var(--visual-viewport-height, 100vh) - var(--ds-space-3, 12px)
  );
  padding: 0;

  .drawer__header {
    padding: var(--ds-space-4, 16px) var(--ds-space-5, 20px) 0;
  }
`;

export const InvoicePanelDrawerBody = styled(VmDrawer.Primitive.Body)<{
  $isBusy?: boolean;
}>`
  flex: 1 1 auto;
  min-height: 0;
  padding: 0;
  overflow: ${({ $isBusy }) => ($isBusy ? 'hidden' : 'auto')};
`;

export const InvoicePanelDrawerFooter = styled(VmDrawer.Primitive.Footer)`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 0 var(--ds-space-4, 16px) var(--ds-space-3, 12px);
`;

export const ScrollableBody = styled.div`
  min-height: 100%;
  padding: 0 var(--ds-space-5, 20px) var(--ds-space-3, 12px);
`;

export const PrintToggleItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: default;
  user-select: none;

  span {
    font-size: 13px;
    color: var(--ds-color-text-primary, rgb(17 24 39));
  }
`;
