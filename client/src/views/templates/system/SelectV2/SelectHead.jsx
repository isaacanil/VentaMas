import React from 'react'
import { IoIosArrowDown } from 'react-icons/io'
import { MdClear } from 'react-icons/md'
import styled from 'styled-components'

export const SelectHead = ({isOpen, setIsOpen, showSelectTitle, data }) => {
    return (
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
    )
}
const Head = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    border: 1px solid rgba(0, 0, 0, 0.200);
    border-radius: var(--border-radius-light);
    overflow: hidden;
    padding: 0 0 0 0.2em;
    transition-duration: 20s;
    transition-timing-function: ease-in-out;
    transition-property: all; 
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
