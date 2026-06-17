import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Form, Input } from 'antd';
import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const CancelButton = styled(Button)`
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  font-weight: 500;
`;

export const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const WarningCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  background: #fff8eb;
  border: 1px solid #fcd34d;
  border-radius: 12px;
`;

export const WarningHeader = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

export const WarningIcon = styled(FontAwesomeIcon)`
  font-size: 1.75rem;
  color: #d97706;
`;

export const WarningCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

export const WarningTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: #1f2937;
`;

export const WarningSubtitle = styled.span`
  font-size: 0.9rem;
  color: #6b7280;
`;

export const WarningList = styled.ul`
  display: grid;
  gap: 0.75rem;
  padding: 0;
  margin: 0;
  list-style: none;
`;

export const WarningItem = styled.li`
  display: flex;
  gap: 0.625rem;
  align-items: flex-start;
  color: #374151;
`;

export const ListIcon = styled(FontAwesomeIcon)`
  margin-top: 0.15rem;
  font-size: 1rem;
  color: #d97706;
`;

export const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const StyledFormItem = styled(Form.Item)`
  margin-bottom: 0;
`;

export const StyledTextArea = styled(Input.TextArea)`
  padding: 0.6rem 0.75rem;
`;

export const FormActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;
