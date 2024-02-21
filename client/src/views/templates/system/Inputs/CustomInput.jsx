// Este componente usa React y styled-components para crear un input personalizado con un menú
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { addDiscount, totalPurchase } from "../../../../features/cart/cartSlice";
import { quitarCeros } from "../../../../hooks/quitarCeros";
import { useClickOutSide } from "../../../../hooks/useClickOutSide";
import { InputV4 } from "./GeneralInput/InputV4";
import * as antd from "antd";
const { Typography } = antd;
const { Title, Paragraph } = Typography;
const CustomInput = ({ options }) => {

  const [value, setValue] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const dispatch = useDispatch()
  const inputRef = useRef(null);
  const handleChange = (e) => {
    setValue(Number(e.target.value));
    dispatch(addDiscount(Number(e.target.value)))
  };

  const handleClick = () => {
    setShowMenu(!showMenu);
  };

  const handleSelect = (option) => {
    setValue(option);
    setShowMenu(false);
    dispatch(addDiscount(option))
  };

  useClickOutSide(inputRef, showMenu, handleClick)

  return (
    <Container ref={inputRef} >
      {showMenu && (
        <StyledMenu>
          <Title level={5}>
            Descuentos
          </Title>
          <Paragraph>
            Selecciona un descuento
          </Paragraph>
          <MenuOptions>
            {options.map((option) => (
              <StyledMenuItem key={option} onClick={() => handleSelect(option)}>
                {option}%
              </StyledMenuItem>
            ))}
          </MenuOptions>
        </StyledMenu>
      )}
      <Wrapper >
        
        <InputV4
          type="number"
          label='Descuento (%)'
          labelVariant='primary'
          size='large'
          value={quitarCeros(value)}
          onChange={handleChange}
          onClick={handleClick}
        />
      </Wrapper>
    </Container>
  );
};

export default CustomInput;
const Container = styled.div`
  position: relative;
`
const Wrapper = styled.div`
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

const MenuOptions = styled.ul`
  display: grid;
  gap: 0.2em;
  grid-template-columns: repeat(6, 1fr);
  list-style: none;
  padding: 0;
`
const StyledMenu = styled.div`
  border: 1px solid #ccc;
  padding: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  width: min-content;
  max-width: 500px;
  border-radius: 6px;
  background: #ffffff;
  position: absolute;
  z-index: 10;
  margin: -80px 0;
  right: 0;
  top: -58px;
 
`;


const StyledMenuItem = styled.li`
  padding: 5px 5px;
  display: flex;
  height: 2.4em;
  width: 3.2em;
  align-items: center;
  border-radius: 4px;
  justify-content: center;
  background-color: #f3f3f3;

  cursor: pointer;
`;
