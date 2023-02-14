import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { IoIosArrowDown } from 'react-icons/io'
import { MdClear } from 'react-icons/md'
import { useClickOutSide } from '../../../../hooks/useClickOutSide';

export const Select = ({ title, data, value, setValue, placement = 'bottom', property = 'name', reset, setReset }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showSelectTitle, setShowSelectTitle] = useState(title);
    const [selectedId, setSelectedId] = useState('');
    const SelectRef = useRef(null)

    useEffect(() => {
      if (reset) {
        setSelectedId('');
        setShowSelectTitle(title);
        setReset(false);
      }
    }, [reset, title]);
  
    useEffect(() => {
      if (value && data && data.Items) {
        setShowSelectTitle(value[property] || title);
        const selectedItem = data.Items.find(item => item.id === value.id);
        setSelectedId(selectedItem?.id || '');
      }
    }, [value, property, data]);

    const handleSelect = select => {
      setSelectedId(select.id);
      setValue(select);
      setShowSelectTitle(select[property]);
      setIsOpen(false);
    };

    const handleReset = () => {
      setSelectedId('');
        setShowSelectTitle(title);
        setReset(false);
        setIsOpen(false);
    }
    useClickOutSide(SelectRef, isOpen, ()=>{setIsOpen(false)})
    return (
      <Container ref={SelectRef}>
        <Head>
          {!isOpen ? (
            <Group onClick={() => setIsOpen(true)}>
              <h3>{showSelectTitle}</h3>
              <IoIosArrowDown />
            </Group>
          ) : null}
          {isOpen ? (
            <Group>
              <InputText size="s" placeholder={`Buscar ${data.name}`} />
              <Button onClick={() => setIsOpen(false)}>
                <MdClear />
              </Button>
            </Group>
          ) : null}
        </Head>
        {isOpen ? (
      <Body placement={placement}>
        {data.Items.length > 0 ? (
          <List>
            <Item
              style={selectedId === '' ? { backgroundColor: 'blue', color: 'white' } : null}
              onClick={() => handleReset()}
            >
              Ninguno
            </Item>
            {data.Items.map((item, index) => (
              <Item
                key={index}
                style={selectedId === item.id ? { backgroundColor: 'blue', color: 'white' } : null}
                onClick={() => handleSelect(item)}
              >
                {item[property]}
              </Item>
            ))}
          </List>
        ) : null}
      </Body>
    ) : null}
      </Container>
    );
  };
const Container = styled.div`
    position: relative;
    max-width: 200px;
    width: 100%;
    
`
const Head = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: var(--border-radius-light);
    background-color: var(--White);
    overflow: hidden;
    padding: 0 0 0 0.2em;
    transition-duration: 20s;
    transition-timing-function: ease-in-out;
    transition-property: all; 
`
const Body = styled.div`

    min-width: 300px;
    width: 100%;
    max-height: 200px;
    position: absolute;
    top: 2.3em;
    z-index: 3;
    background-color: #ffffff;
    overflow: hidden;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.200);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.200);
    ${(props) => {
        switch (props.placement) {
            case 'top':
                return `
                top: -600%;
            `
            default:
                return null
        }
    }}
`
const List = styled.ul`
    z-index: 1;
    display: block;
    padding: 0;
    height: 200px;
    overflow-y: scroll;
`
const Group = styled.div`
    height: 2em;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap:10px;
    transition: 1s display ease-in-out;
    padding-right: 0.5em;

    h3{
        margin: 0 0 0 10px;
        font-weight: 500;
        font-size: 1em;
        color: rgb(66, 66, 66);
        width: 100%;
        font-size: 12px;
        line-height: 1pc;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;  
        //white-space: nowrap;
        text-transform: uppercase;
        text-overflow: ellipsis;
        overflow: hidden;
    }
`

const Item = styled.p`
        list-style: none;
        padding: 0 1em;
        display: flex;
        align-items: center;
        height: 2em;
        background-color: var(--White2);
    &:hover{
        background-color: var(--color);
        color: white;
    }

    ${(props) => {
        if (props.selected) {
            return `
                background-color: #4081d6;
                color: white;
            `
        }
    }}

    
`
const InputText = styled.input.attrs({
    type: 'text'
})`
   
    border: 1px solid rgba(0, 0, 0, 0);
    height: 1.6em;
    border-radius: 6px;
    width: 100%;
    padding: 0 0.4em;
    &:focus{
        outline: 2px solid #00000052;
    }
    

  `

const Button = styled.button`
    background-color: white;
    border: none;
    display: flex;
    align-items: center;
    padding: 0;
    justify-content: right;
`
