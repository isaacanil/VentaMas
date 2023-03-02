import React from 'react'
import styled from 'styled-components'

export const SelectBody = ({ 
    isOpen, 
    setIsOpen, 
    placement, 
    data, 
    selectedId, 
    setSelectedId, 
    setShowSelectTitle,
    property, 
    setValue 
}) => {
    const handleSelect = select => {
        console.log(select)
        setSelectedId(select.id);
        setValue(select);
        setShowSelectTitle(select[property]);
        setIsOpen(false);
      };
    return (
        isOpen ? (
            <Body placement={placement}>
              {data.Items.length > 0 ? (
                <List>
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
          ) : null
    )
}

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
