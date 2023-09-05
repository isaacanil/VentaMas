import React, { Fragment, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useClickOutSide } from '../../../../../../../hooks/useClickOutSide'
import { Button } from '../../../../../../templates/system/Button/Button';
import { icons } from '../../../../../../../constants/icons/icons';

export const Item = ({ name, data, option, onClick, value,}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const handleOpen = () => setIsOpen(!isOpen);
    const handleSelect = () => {
        setIsOpen(false)
    }
    const MenuRef = useRef(null);
    useClickOutSide(MenuRef, isOpen, () => setIsOpen(false));
  
    return (
        <Container>
            <Header onClick={handleOpen}>
                {name}
         
               {isOpen ? icons.arrows.caretUp : icons.arrows.caretDown}
            </Header>
            {
                isOpen &&
                <Menu>
                    <Body ref={MenuRef}>
                        {data.map((item, index) => (
                            <OptionItem
                                isSelected={value === item.id}
                                onClick={() => onClick({ value: item })}
                            >
                                {option({ value: item })}
                            </OptionItem>
                        ))}
                    </Body>
                    <Footer>
                        <button>
                            Limpiar
                        </button>

                    </Footer>
                </Menu>
            }
        </Container>
    )
}
const Container = styled.div`
    background-color: ${props => props.theme.bg.color2};
    padding: 0 1em;
    display: flex;
    position: relative;
`
const Header = styled.div`
    height: 2.4em;
    justify-content: space-between;
    gap:1em;
    display: flex;
    align-items: center;
    background-color: ${props => props.theme.bg.color2};
    padding: 0 0.4em;
`

const Menu = styled.div`
     position: absolute;
    height: 300px;
    display: grid;
    grid-template-rows: 1fr min-content;
    min-width: 200px;
    top: 100%;
    background-color: rgb(242, 242, 242);
    z-index: 100;
    `


const Body = styled.div`
    top: 100%;
    background-color: rgb(242, 242, 242);
    z-index: 100;
    overflow-y: scroll;
    padding: 1em;

`
const OptionItem = styled.div`
    border-bottom: 1px solid #cccccc;
    height: 2.4em;
    display: flex;
    align-items: center;
    :last-child{
        border-bottom: none;
    }
    :hover{
        background-color: #5e5e5e + cc;
    }
   ${props => props.isSelected && `
        background-color: #e00d0d + cc;
    `}
`


const Footer = styled.div`
    display: flex;
    
    height: 2.2em;
    button{
        flex-grow: 1;
    }
`