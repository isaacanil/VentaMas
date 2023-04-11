import React, { useState } from "react";
import styled from "styled-components";
import { BsChevronDown } from "react-icons/bs";


export const CustomSelect = ({
    options,
    position = "top",
    onChange,
    optionProp = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState("");

    const toggleSelect = () => {
        setIsOpen(!isOpen);
    };

    const handleOptionClick = (option) => {
        setSelectedOption(option);
        setIsOpen(false);
        onChange(option);
    };

    const getMenuPosition = () => {
        switch (position) {
            case "top":
                return "top: 100%; left: 0; right: 0;";
            case "top-left":
                return "top: 100%; left: 0;";
            case "top-right":
                return "top: 100%; right: 0;";
            case "left":
                return "top: 0; left: -100%;";
            case "left-top":
                return "top: 0; left: -100%;";
            case "left-bottom":
                return "bottom: 0; left: -100%;";
            case "right":
                return "top: 0; right: -100%;";
            case "right-top":
                return "top: 0; right: -100%;";
            case "right-bottom":
                return "bottom: 0; right: -100%;";
            case "bottom":
                return "bottom: 100%; left: 0; right: 0;";
            case "bottom-left":
                return "bottom: 100%; left: 0;";
            case "bottom-right":
                return "bottom: 100%; right: 0;";
            default:
                return "top: 100%; left: 0; right: 0;";
        }
    };

    return (
        <Container>
            <CustomSelectInput onClick={toggleSelect}>
                <span>{selectedOption ? selectedOption[optionProp] : "Seleccionar opción"}</span>
                <ChevronIcon />
            </CustomSelectInput>
            {isOpen && (
                <SelectMenu position={getMenuPosition()}>
                    {options.map((option) => (
                        <SelectOption
                            key={option.value}
                            isSelected={option.value === selectedOption?.value}
                            onClick={() => handleOptionClick(option)}
                        >
                            {optionProp ? option[optionProp] : option.name}
                        </SelectOption>
                    ))}
                </SelectMenu>
            )}
        </Container>
    );
};


const Container = styled.div`
  position: relative;
  width: 200px;
  margin: 0 auto;
`;

const SelectMenu = styled.ul`
  position: absolute;
  ${({ position }) => position};
  padding: 0;
  margin: 0;
  background-color: white;
  list-style-type: none;
  border: 1px solid grey;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 10;
`;

const SelectOption = styled.li`
  padding: 8px;
  cursor: pointer;
  ${({ isSelected }) =>
        isSelected
            ? `
      background-color: grey;
      color: white;
    `
            : `
      &:hover {
        background-color: lightgrey;
      }
    `}
`;

const CustomSelectInput = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 32px;
  border: 1px solid grey;
  border-radius: 4px;
  padding: 8px;
  font-size: 16px;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: blue;
    box-shadow: 0 0 4px rgba(0, 0, 255, 0.4);
  }
`;

const ChevronIcon = styled(BsChevronDown)`
  margin-left: auto;
`;