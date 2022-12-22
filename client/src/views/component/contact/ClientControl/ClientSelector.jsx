import React, { useEffect, useState } from 'react'
import { MdClose, MdPersonAdd } from 'react-icons/md'
import styled from 'styled-components'
import { Button } from '../../../templates/system/Button/Button'
import { Client } from '../../../templates/system/client/Client'

export const ClientSelector = ({ isOpen, setIsOpen, filteredClients}) => {
    const [clients, setClients] = useState([])
    useEffect(()=>{
        setClients(filteredClients)
    }, [filteredClients])
    return (
        isOpen ? (
            <Container>
                <Head>
                    <Group>
                        <Button
                            startIcon={<MdPersonAdd />}
                            borderRadius='normal'
                            width='icon24'
                           
                           
                        />
                    </Group>
                    <Group>
                        <Button
                            title={<MdClose />}
                            width='icon24'
                            bgcolor='op1'
                            borderRadius='normal'
                            onClick={(e)=> setIsOpen(false)}
                        
                        />
                    </Group>
                    
                </Head>
                <Body>
                    {
                        clients.length > 0 ? (
                            clients.map(({client}) => (
                                <Client
                                    client={client}
                                    Close={setIsOpen}
                                />
                            ))
                        ) : null
                    }
                </Body>
            </Container >
        ) : null


    )
}
const Container = styled.div`
    position: absolute;
    border-radius: 10px;
    top: 3em;
    overflow: hidden;
    width: 24em;
    background-color: rgb(80, 80, 80);
    display: grid;
    grid-template-rows: 2em 1fr;
    z-index: 1000;
`
const Head = styled.div`
    background-color: #ffffffae;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.4em;
`
const Body = styled.div`

   z-index: 1;
   top: 3em;
   left: 0;
   width: 100%;
   height: 300px;
   background-color: rgb(112,112,112);
   overflow-y: scroll;
   padding: 0.5em;
   display: grid;
   grid-template-columns: repeat(2, 1fr);
   gap: 0.5em;
   align-items: center;
   align-content: flex-start;
`
const Group = styled.div`
    
`
