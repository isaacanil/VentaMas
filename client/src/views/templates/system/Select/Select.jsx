import React, { useState } from 'react'
import styled from 'styled-components'
import { IoIosArrowDown } from 'react-icons/io'
import {MdClear} from 'react-icons/md'

export const Select = ({ title, data }) => {
    const [isOpen, setIsOpen] = useState(false)
    const handleClose = () => {
        setIsOpen(false)
    }
    const [showSelectTitle, setShowSelectTitle] = useState(title)
    const [isSelect, setIsSelect] = useState({ status: false, id: '', value: '' })
    const dataSelected = (select) => {
        console.log(select)
        setIsSelect({
            id: select.id,
        })
        setTimeout(() => {
            setShowSelectTitle(select.name)
        }, 1)
        setIsOpen(false)
    }
    return (
        <Container>
            <Head>
                {isOpen === false ? (
                    <Group onClick={() => setIsOpen(true)}>
                        <h3>{showSelectTitle}</h3>
                        <IoIosArrowDown></IoIosArrowDown>
                    </Group>
                ) : null}
                {
                    isOpen ? (
                        <Group>
                            <InputText size='s' placeholder='Bucar Productos'></InputText>
                            <Button onClick={() => handleClose()}><MdClear/></Button>
                        </Group>

                    ) : null
                }


            </Head>
            {
                isOpen ? (
                    <Body>

                        {
                            data.length > 0 ?
                                (
                                    <List>
                                        {
                                            data.map((item, index) => (
                                                <Item key={index} style={isSelect.id == item.id ? { backgroundColor: 'blue', color: 'white' } : null} onClick={() => dataSelected(item)}>
                                                    {item.name}
                                                </Item>
                                            ))
                                        }
                                    </List>
                                ) : null
                        }

                    </Body>
                ) : null
            }

        </Container>
    )
}
const Container = styled.div`
    position: relative;
    max-width: min-content;
    z-index: 3;
`

const Head = styled.div`
    display: flex;
    align-items: center;
    border: 1px solid rgba(0, 0, 0, 0.200);
    border-radius: 10px;
    overflow: hidden;
    padding: 0 0 0 0.2em;
    transition-duration: 20s;
    transition-timing-function: ease-in-out;
    transition-property: all;
    
`
const Body = styled.div`
    min-width: 200px;
    max-width: 260px;
    max-height: 200px;
    position: absolute;
    top: 2.3em;
    z-index: 1;
    background-color: #ffffff;
    overflow: hidden;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.200);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.200);
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
    min-width: 10em;
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
        width: 120px;
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
    &:hover{
        background-color: #4081d6;
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
    width: 126px;
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
