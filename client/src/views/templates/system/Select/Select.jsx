import React, { useState } from 'react'
import styled from 'styled-components'
import { IoIosArrowDown } from 'react-icons/io'
import { Button } from '../../../index'
export const Select = ({ title, data }) => {
    const [isOpen, setIsOpen] = useState(false)
    const handleClose = () => {
        setIsOpen(false)
    }
    return (
        <Container>
            <Head>
                {isOpen === false ? (
                    <Group onClick={() => setIsOpen(true)}>
                        <h3>{title}</h3>
                        <IoIosArrowDown></IoIosArrowDown>
                    </Group>
                ) : null}
                {
                    isOpen ? (
                        <Group>
                            <InputText size='small' placeholder='Bucar Productos'></InputText>
                            <Button color='black' onClick={() => handleClose()}>X</Button>
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
                                                <Item key={index} >
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
    top: 2.3em;
    position: absolute;
    z-index: 1;
    background-color: #ffffff;
    min-width: 200px;
    max-width: 260px;
    max-height: 200px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.200);
    border-radius: 6px;
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
    
    h3{
        margin: 0 0 0 10px;
        font-weight: 500;
        font-size: 1em;
    }
`

const Item = styled.p`
        list-style: none;
        padding: 0 1em;
    &:hover{
        background-color: #4081d6;
        color: white;
    }

    
`
const InputText = styled.input.attrs({
    type: 'text'
  })`
   
    border: 1px solid rgba(0, 0, 0, 0);
    height: 1.6em;
    border-radius: 6px;
    &:focus{
        outline: 2px solid #00000052;
    }
    

  `
  

