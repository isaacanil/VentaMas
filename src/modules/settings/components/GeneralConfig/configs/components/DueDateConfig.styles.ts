import styled from 'styled-components';

export const RootContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

export const ToggleCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);

  .label-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
`;

export const ConfigPanel = styled.div`
  padding: 16px 0;
  margin-top: 8px;
  border-top: 1px solid #f0f0f0;
  animation: slide-down 0.3s ease-out;

  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const OptionLabel = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .period {
    font-weight: 600;
  }

  .desc {
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 400;
    color: #8c8c8c;
    background: #f5f5f5;
    border-radius: 4px;
  }
`;

export const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

export const FullWidthSelectWrapper = styled.div`
  .ant-select {
    width: 100%;
  }
`;

export const CustomPeriodSection = styled.div`
  margin-top: 20px;
`;

export const CustomDivider = styled.div`
  .ant-divider {
    margin: 0 0 16px;
  }
`;

export const CustomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
`;

export const FieldLabel = styled.span`
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
`;

export const FullWidthInputNumber = styled.div`
  .ant-input-number {
    width: 100%;
  }
`;

export const ApplyButtonWrapper = styled.div`
  margin-top: 20px;

  .ant-btn {
    border-radius: 8px;
  }
`;
