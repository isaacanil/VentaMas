// Este componente usa React y styled-components para crear un input personalizado con un menú
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { addDiscount, totalPurchase } from "../../../../features/cart/cartSlice";
import { quitarCeros } from "../../../../hooks/quitarCeros";
import { useClickOutSide } from "../../../../hooks/useClickOutSide";
import { InputV4 } from "./InputV4";

const CustomInput = ({ options }) => {

  const [value, setValue] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const dispatch = useDispatch()
  const handleChange = (e) => {
    setValue(Number(e.target.value));
  };
  useEffect(() => {
    dispatch(addDiscount(value))
    dispatch(totalPurchase())

  }, [value])
  const handleClick = () => {
    setShowMenu(!showMenu);
  };

  const handleSelect = (option) => {
    setValue(option);
    setShowMenu(false);
  };



  return (
    <Container>

      <InputV4
        type="number"
        label='Descuento'
        labelVariant='primary'
        size='small'
        value={quitarCeros(value)}
        onChange={handleChange}
        onClick={handleClick}

      />
    
      {showMenu && (
        <StyledMenu>
          {options.map((option) => (
            <StyledMenuItem key={option} onClick={() => handleSelect(option)}>
              {option}
            </StyledMenuItem>
          ))}
        </StyledMenu>
      )}
    </Container>
  );
};

export default CustomInput;
const Container = styled.div`
    position: relative;
    label{
        height: 12px;
    box-sizing: border-box;
    margin: 0;
    padding: 0 0.4em;
    position: absolute;
    top: -8px;
    display: flex;
    align-items: center;
    background-color: white;
    color: #353535;
    font-weight: 600;
    border-radius: 3px;
    font-size: 11px;
    
    }
`

const StyledInput = styled.input`
  border: 1px solid #ccc;
  padding: 0 0.6em;
  height: 2em;
  width: 200px;
  background-size: 20px;
  border-radius: 6px;
    outline: none;
    border: 1px solid rgba(0, 0, 0, 0.100);
    padding: 0.2em 0.4em;
    height: 2em;
    font-size: 14px;
    color: var(--Black4);
    width: 100%;
`;


const StyledMenu = styled.ul`
  border: 1px solid #ccc;
  padding: 10px;
  width: 100%;
  max-width: 400px;
  background: white;
  position: absolute;
  z-index: 10;
  display: flex;
  top: 110%;
  right: 0;
  gap:1em;
  list-style: none;
`;


const StyledMenuItem = styled.li`
  padding: 0 5px;

  cursor: pointer;
`;
