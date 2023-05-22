import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from "framer-motion";

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

const Select = ({ title, options, value, onChange, optionsLabel }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (selectedItem) => {
        onChange(selectedItem);
        setIsOpen(false);
    };
 
    const getOptionLabel = (option) => {
        if (!optionsLabel) {
            return option.name;
        }
        return getPropertyByPath(option, optionsLabel);
    };

    return (
        <Container>
            <SelectHeader onClick={() => setIsOpen(!isOpen)}>
                <SelectTitle>{value ? getOptionLabel(value) : title}</SelectTitle>
            </SelectHeader>
            <motion.div 
                initial={false}
                animate={isOpen ? "open" : "closed"}>
                <DropdownWrapper isOpen={isOpen}>
                    <motion.div
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
                        style={{ pointerEvents: isOpen ? "auto" : "none" }}>
                        <Dropdown >
                            {options.map((item) => (
                                <motion.div variants={itemVariants}>
                                    <Option
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        isSelected={getOptionLabel(value) === getOptionLabel(item)}
                                    >
                                        {getOptionLabel(item)}
                                    </Option>
                                </motion.div>
                            ))}
                        </Dropdown>
                    </motion.div>
                </DropdownWrapper>
            </motion.div>
        </Container>
    );
};

export default Select;

const Container = styled.div`
  position: relative;
  width: 100%;

`;

const SelectHeader = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  background-color: #ffffff;
    height: 2em;
    padding: 0 1em;
    border: var(--border2);
    border-radius: var(--border-radius-light);
`;

const SelectTitle = styled.p`
  margin: 0;
  color: var(--Gray4);
  
`;
const DropdownWrapper = styled.div`
    position: absolute;
    top: 110%;
    left: 0;
    width: 100%;
    z-index: 1;
    min-height: 200px;
    height: 100%;
    border: var(--border-primary);
    border-radius: var(--border-radius-light);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    background-color: #fff;
    overflow: hidden;
display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
`
const Dropdown = styled.div`
height: 100%;
  width: 100%;
    overflow-y: auto;
    display: grid;
    gap: 0.5em;
`;

const Option = styled.div`
  padding: 0 1em;
  height: 2em;
  display: flex;
    align-items: center;

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