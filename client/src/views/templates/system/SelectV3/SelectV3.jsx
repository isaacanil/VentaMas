import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { motion } from "framer-motion";
import { useClickOutSide } from '../../../../hooks/useClickOutSide';

const itemVariants = {
    open: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 600, damping: 44 }
    },
    closed: { opacity: 0, y: 20, transition: { duration: 0.2 } }
};

const getPropertyByPath = (obj, path) => {
    const properties = path.split('.');
    let result = obj;
    properties.forEach((property) => {
        result = result[property];
    });
    return result;
};

const Select = ({label, title, options, value, onChange, optionsLabel, maxWidth = null }) => {
    const [isOpen, setIsOpen] = useState(false);
    const SelectRef = useRef(null);

    const handleSelect = (selectedItem) => {
        // Crear un evento simulado
        const event = {
            target: {
                name: label, // o cualquier otro nombre que quieras darle al select
                value: selectedItem
            }
        };
    
        // Llamar a onChange con el evento simulado
        onChange(event);
        setIsOpen(false);
    };
    

    const getOptionLabel = (option) => {
        if (!optionsLabel) {
            return option;
        }
        return getPropertyByPath(option, optionsLabel);
    };
    const closeDropdown = () => setIsOpen(false);
    useClickOutSide(SelectRef, isOpen === true, closeDropdown)
    return (
        <Backdrop maxWidth={maxWidth} ref={SelectRef}>
            {label && (
                <Label>
                    {label || title}
                </Label>
            )}
            <Container  >
                <SelectHeader onClick={() => setIsOpen(!isOpen)}>
                    <SelectTitle value={value}>{value ? getOptionLabel(value) : title}</SelectTitle>
                </SelectHeader>
                <DropdownWrapper
                    isOpen={isOpen}
                    initial={false}
                    animate={isOpen ? "open" : "closed"}
                >
                    <Dropdown
                        variants={{
                            open: {
                                clipPath: "inset(0% 0% 0% 0% round 4px)",
                                transition: {
                                    type: "spring",
                                    bounce: 0,
                                    duration: 0.7,
                                    delayChildren: 0.3,
                                    staggerChildren: 0.05
                                }
                            },
                            closed: {
                                clipPath: "inset(100% 0% 0% 0% round 10px)",
                                transition: {
                                    type: "spring",
                                    bounce: 0,
                                    duration: 0.3
                                }
                            }
                        }}
                        style={{ pointerEvents: isOpen ? "auto" : "none" }}
                    >
                        {options.map((item) => (

                            <Option
                                value={value}
                                key={item.id}
                                variants={itemVariants}
                                onClick={() => handleSelect(item)}
                                isSelected={getOptionLabel(value) === getOptionLabel(item)}
                            >
                                {getOptionLabel(item)}
                            </Option>

                        ))}
                    </Dropdown>

                </DropdownWrapper>

            </Container>
        </Backdrop>
    );
};

export default Select;
const Backdrop = styled.div`
    display: grid;
    align-items: center;
    gap: 0.2em;
    width: min-content;
    width: 100%;
    max-width: 200px;
    ${({ maxWidth }) => {
        switch (maxWidth) {
            case 'small':
                return `
                max-width: 200px;
                `
            case 'medium':
                return `
                max-width: 300px;
`
            case 'large':
                return `
                max-width: 400px;
                                `
            case 'xl':
                return `
                max-width: 500px;
                `
            case 'full':
                return `
                max-width: 100%;
                `
            default:
                return `
                max-width: 200px;
                `
        }
    }}
`;
const Container = styled.div`
  position: relative;
  min-width: 200px;
  width: 100%;
  
                                                
`;

const SelectHeader = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  background-color: #ffffff;
    height: 2em;
    max-height: calc(2em - 2px);
    width: 100%;
    padding: 0 0.4em;
    border: var(--border2);
    border-radius: var(--border-radius-light);
    :hover {
        background-color: var(--color2);
    }
`;

const SelectTitle = styled.p`
  margin: 0;
  color: var(--Gray4);

  ${({ value }) => value && (`
    color: var(--color-dark);
    font-weight: 500;
    
    `)}
  
`;
const DropdownWrapper = styled(motion.div)`
    position: absolute;
    top: 110%;
    left: 0;
    width: 100%;
    z-index: 10;
    min-height: 200px;
    height: 100%;
    border: var(--border-primary);
    border-radius: var(--border-radius-light);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    background-color: #fff;
    overflow: hidden;
display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
`
const Dropdown = styled(motion.div)`
height: 100%;
  width: min-content;
    overflow-y: auto;
    padding: 0.4em ;
    gap: 0.2em;
    display: grid;
    align-content: flex-start;
  
`;

const Option = styled(motion.div)`
  padding: 0 1em;
  height: 2.4em;
  display: flex;
    align-items: center;
    font-size: 16px;
    width: 100%;
    border-radius: var(--border-radius);
    white-space: nowrap;
    /* border-bottom: var(--border2); */
    
  cursor: pointer;

  &:hover {
    background-color: var(--White3);
  }

  ${({ isSelected }) =>
        isSelected &&
        `
    background-color: blue;
    color: white;
    :hover {
        background-color: blue;
        color: white;
  `}
 
  
`;

const Label = styled.label`
    font-size: 13px;
    color: var(--Gray5);
    line-height: 14px;
  

  `