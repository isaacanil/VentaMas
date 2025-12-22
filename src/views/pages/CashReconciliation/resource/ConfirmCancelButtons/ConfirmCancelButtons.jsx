import { Button } from 'antd';
import styled from 'styled-components';

export const ConfirmCancelButtons = ({ onSubmit, onCancel }) => {
  const handleCancel = () => {
    onCancel && onCancel();
  };
  return (
    <Container>
      <Button onClick={handleCancel}>{onSubmit ? 'Cancelar' : 'Cerrar'}</Button>
      {onSubmit && (
        <Button onClick={onSubmit} type={'primary'}>
          Confirmar
        </Button>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  gap: 1em;
  justify-content: flex-end;
`;
