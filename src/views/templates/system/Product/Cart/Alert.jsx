import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import {
  totalTaxes,
  deleteProduct,
  totalPurchase,
  setChange,
  totalShoppingItems,
} from '../../../../../features/cart/cartSlice';
import { Button, ButtonGroup } from '../../Button/Button';

export const Alert = ({ isOpen, handleIsOpen, id }) => {
  const dispatch = useDispatch();
  const handleDelete = (id) => {
    handleIsOpen(false);
    dispatch(deleteProduct(id));
    dispatch(totalShoppingItems());
    dispatch(totalTaxes());
    dispatch(totalPurchase());
    dispatch(setChange());
    dispatch(totalShoppingItems());
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

const Component = styled.div`
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
