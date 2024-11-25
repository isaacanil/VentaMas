import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { useClickOutSide } from '../../../../../../hooks/useClickOutSide'
import { icons } from '../../../../../../constants/icons/icons';

export const Item = ({ label, filterOptions, onChange, onClear, format, selectedValue }) => {
    const [isOpen, setIsOpen] = useState(false);
    const handleOpen = () => setIsOpen(!isOpen);
    
    const handleSelect = (value) => {
        const event = { target: { value } };
        onChange(event);
    };

    const MenuRef = useRef(null);
    useClickOutSide(MenuRef, isOpen, () => setIsOpen(false));
    const handleClear = () => onClear();

    return (
        <Container ref={MenuRef}>
            <Header onClick={handleOpen} selectedValue={selectedValue}>
                {label}
                {isOpen ? icons.arrows.caretUp : icons.arrows.caretDown}
            </Header>
            {
                isOpen &&
                <Menu>
                    <Body >
                        {filterOptions.map((option, index) => (
                            <OptionItem
                                isSelected={selectedValue == option.value}
                                onClick={() => handleSelect(option.value)}
                            >
                                {format ? format(option.label) : option.label}
                            </OptionItem>
                        ))}
                    </Body>
                    <Footer>
                        <button onClick={handleClear} disabled={!selectedValue}>
                            Limpiar
                        </button>
                    </Footer>
                </Menu>
            }
        </Container>
    )
}
const Container = styled.div`
    background-color: ${props => props.theme.bg.shave};
    display: flex;
    align-items: center;
    position: relative;
    
`
const Header = styled.div`
    height: 2.2em;
    border-radius: 8px;
    justify-content: space-between;
    gap:1em;
    border: 2px solid #cccccc;
    display: flex;
    align-items: center;
    background-color: ${props => props.theme.bg.shade};
    padding: 0 0.4em;
    ${props => props.selectedValue && `
        border: 2px solid ${props.theme.bg.color};
        
    `}
`

const Menu = styled.div`
     position: absolute;
    height: 300px;
    display: grid;
    grid-template-rows: 1fr min-content;
    min-width: 300px;
    top: 100%;
    background-color: rgb(242, 242, 242);
    z-index: 100;
    border-radius: 8px;
    border: 1px solid #cccccc;
    box-shadow: 0 0 10px 0 rgba(0,0,0,0.2) ;
    overflow-y: hidden;
    `


const Body = styled.div`
    top: 100%;
    background-color: rgb(255, 255, 255);
    z-index: 100;
    overflow-y: scroll;
    

`
const OptionItem = styled.div`
    border-bottom: 1px solid #cccccc;
    height: 2.4em;
    display: flex;
    padding: 0 1em;
    align-items: center;
    :last-child{
        border-bottom: none;
    }
    :hover{
        background-color: #5e5e5e + cc;
    }
   ${props => props.isSelected === true && `
        background-color: #9cb2f0;

    `}
`


const Footer = styled.div`
    display: flex;
    
    height: 2.2em;
    button{
        flex-grow: 1;
        border: none;
        background-color: gray;
        font-weight: 500 ;
        color: white;
        :disabled{
            background-color: #cccccc;
            color: #666666;

        }
    }

`