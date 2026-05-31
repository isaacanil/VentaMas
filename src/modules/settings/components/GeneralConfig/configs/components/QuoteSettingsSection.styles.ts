import { Checkbox, Form, InputNumber, Typography } from 'antd';
import styled from 'styled-components';

const { Text } = Typography;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const StyledForm = styled(Form)`
  .ant-form-item-label > label {
    color: #262626;
    font-weight: 600;
  }

  .ant-input-number,
  .ant-input-textarea {
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 12px;
    background: #fdfdfd;
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);

    &:hover {
      border-color: #1890ff;
    }

    &:focus {
      border-color: #1890ff;
      background: #fff;
      box-shadow: 0 0 0 4px rgb(24 144 255 / 10%);
    }
  }
`;

export const ToggleCard = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border: 1px solid ${({ $active }) => ($active ? '#1890ff' : '#e9ecef')};
  border-radius: 16px;
  background: ${({ $active }) => ($active ? '#fff' : '#f8f9fa')};
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 4px 12px rgb(24 144 255 / 8%);
    transform: translateY(-2px);
  }
`;

export const ToggleLabelGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

export const ToggleIcon = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid ${({ $active }) => ($active ? '#91d5ff' : '#d9d9d9')};
  border-radius: 12px;
  background: ${({ $active }) => ($active ? '#e6f7ff' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#1890ff' : '#8c8c8c')};
  font-size: 20px;
`;

export const ToggleTitle = styled(Text)`
  && {
    font-size: 15px;
  }
`;

export const ToggleDescription = styled(Text)`
  && {
    display: block;
    font-size: 13px;
  }
`;

export const StyledCheckbox = styled(Checkbox)`
  transform: scale(1.2);
`;

export const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding: 24px;
  border: 1px solid #f0f0f0;
  border-radius: 20px;
  background: #fff;
  animation: fade-in 0.4s ease-out;

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const ValidityInput = styled(InputNumber)`
  width: 120px;
`;
