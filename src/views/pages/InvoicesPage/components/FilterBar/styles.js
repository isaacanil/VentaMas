import styled from 'styled-components';

export const Bar = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  padding: 0.4rem 1rem;
  border-bottom: 1px solid var(--Gray);
  background: var(--White);
  justify-content: flex-start;
  
  .ant-form-item {
    margin-bottom: 0 !important;
    display: inline-block;
  }
  
  .ant-form-item-label {
    padding-bottom: 2px !important;
    line-height: 1.2 !important;
  }
  
  .ant-form-item-label > label {
    font-size: 11px !important;
    font-weight: 500 !important;
    color: #666 !important;
    height: auto !important;
  }
`;

export const MobileWrapper = styled.div`
  border-bottom: 1px solid var(--Gray);
  background: var(--White);
`;

export const MobileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;

  .mobile-totals {
    display: flex;
    gap: 1rem;
    font-weight: 550;
  }
`;

export const DrawerContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

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
    margin-bottom: 0 !important;
    width: 100% !important;
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
