import styled from 'styled-components';

export const Bar = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 0.4rem 1rem;
  background: var(--white);
  border-bottom: 1px solid var(--gray);

  .ant-form-item {
    display: inline-block;
    margin-bottom: 0 !important;
  }

  .ant-form-item-label {
    padding-bottom: 2px !important;
    line-height: 1.2 !important;
  }

  .ant-form-item-label > label {
    height: auto !important;
    font-size: 11px !important;
    font-weight: 500 !important;
    color: #666 !important;
  }
`;

export const DesktopActions = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
`;

export const MobileWrapper = styled.div`
  background: var(--white);
  border-bottom: 1px solid var(--gray);
`;

export const MobileHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;

  .mobile-extra {
    display: flex;
    gap: 1rem;
    font-weight: 550;
  }
`;

export const DrawerContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;

  .ant-form {
    display: flex !important;
    flex-direction: column !important;
    gap: 1.25rem !important;
  }

  .ant-select,
  .ant-picker,
  .ant-input-number {
    width: 100% !important;
  }

  .ant-input-number-group-wrapper {
    width: 100% !important;

    .ant-input-number {
      width: 50% !important;
    }
  }

  .ant-space-compact {
    width: 100% !important;

    .ant-select {
      flex: 1 !important;
    }
  }

  .ant-form-item {
    width: 100% !important;
    margin-bottom: 0 !important;
  }

  .ant-form-item-label {
    padding-bottom: 8px !important;

    > label {
      font-size: 14px !important;
      font-weight: 500 !important;
      color: #333 !important;
    }
  }
`;

export const ModalContent = styled.div`
  .ant-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .ant-form-item {
    margin-bottom: 0 !important;
  }

  .ant-form-item-label > label {
    font-size: 14px !important;
    font-weight: 500 !important;
    color: #333 !important;
  }
`;
