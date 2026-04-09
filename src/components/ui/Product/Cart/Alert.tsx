import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { deleteProduct, recalcTotals } from '@/features/cart/cartSlice';
import { Button, ButtonGroup } from '@/components/ui/Button/Button';

type AlertProps = {
  isOpen: boolean;
  handleIsOpen: (open: boolean) => void;
  id: string | number;
};

type AlertContainerProps = {
  $isOpen: boolean;
};

export const Alert = ({ isOpen, handleIsOpen, id }: AlertProps) => {
  const dispatch = useDispatch();
  const handleDelete = (itemId: string | number) => {
    handleIsOpen(false);
    dispatch(deleteProduct(String(itemId)));
    dispatch(recalcTotals());
  };
  const close = () => {
    handleIsOpen(false);
  };
  return (
    <Component $isOpen={isOpen}>
      <h1>¿Quieres Eliminar?</h1>
      <ButtonGroup>
        <Button
          borderRadius="normal"
          title={<FontAwesomeIcon icon={faTrash} />}
          width="icon32"
          onClick={() => handleDelete(id)}
        />
        <Button
          title="Cancelar"
          borderRadius="normal"
          onClick={() => close()}
        />
      </ButtonGroup>
    </Component>
  );
};

const Component = styled.div<AlertContainerProps>`
  width: 100%;
  height: 100%;
  background-color: #d32929;
  border-radius: 4px;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1em;
  transition: transform 500ms ease-in-out;
  z-index: 20;

  h1 {
    margin: 0;
    font-size: 1em;
    color: white;
  }
  ${(props) =>
    props.$isOpen
      ? `
        transition: transform 390ms ease-in-out;
        transform: scale(1) translateY(0);
      `
      : `
        transition: transform 200ms ease-in-out;
        transform: scale(0) translateY(-200%);
      `}
`;
