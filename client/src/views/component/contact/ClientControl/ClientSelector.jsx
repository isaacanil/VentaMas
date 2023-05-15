import React, { useEffect, useState } from 'react'
import { MdClose, MdPersonAdd } from 'react-icons/md'
import styled from 'styled-components'
import { Button } from '../../../templates/system/Button/Button'
import { Client } from '../../../templates/system/client/Client'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsOpen, setIsOpen } from '../../../../features/clientCart/clientCartSlice'

export const ClientSelector = ({  filteredClients, searchTerm, createClientMode, updateClientMode }) => {
    const [clients, setClients] = useState([])
    const isOpen = useSelector(selectIsOpen)
    const dispatch = useDispatch()
    useEffect(() => {
        setClients(filteredClients)
    }, [filteredClients])
    return (
        <Container isOpen={isOpen}>
            <Head>
                <Group>
                    <Button
                        startIcon={<MdPersonAdd />}
                        borderRadius='normal'
                        width='icon24'
                        onClick={createClientMode}
                    />
                </Group>
                <Group>
                    <Button
                        title={<MdClose />}
                        width='icon24'
                        bgcolor='op1'
                        borderRadius='normal'
                        onClick={(e) => dispatch(setIsOpen(false))}

                    />
                </Group>

            </Head>
            <Body isEmpty={clients.length > 0 ? true : false}>
                {
                    clients.length > 0 ? (
                        clients.map(({ client }, index) => (
                            <Client
                                updateClientMode={updateClientMode}
                                key={index}
                                client={client}
                                Close={() => dispatch(setIsOpen(false))}
                                searchTerm={searchTerm}
                            />
                        ))
                    ) : null

                }
                {
                    clients.length === 0 ? (<h3>cliente no encontrado</h3>) : null
                }
            </Body>
        </Container >




    )
}
const Container = styled.div`
    position: absolute;
    border-radius: 10px;
    top: 3em;
    overflow: hidden;
    width: 100%;
    background-color: rgb(80, 80, 80);
    display: grid;
    grid-template-rows: 2em 1fr;
    z-index: 1000;
    transform: translateY(-600px) scaleY(0);
    transition: transform 4s ease-in-out;
    transition-property: transform, z-index;
    transition-timing-function: ease-in-out, ease-in-out;
    transition-duration: 1s, 40ms, 1s;
    
    ${props => {
        switch (props.isOpen) {
            case true:
                return `
                    
                    transform: translateY(0px) scaleY(1);
                    
                `


            default:
                break;
        }
    }
    }
`
const Head = styled.div`
    background-color: #7a7a7a;
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
   max-height: calc(100vh - 18em);
   min-height: 300px;
   width: 100%;
   background-color: #575757;
   overflow-y: scroll;
   padding: 0.5em;
   display: grid;
   grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
   gap: 0.5em;
   align-items: center;
   align-content: flex-start;
   ${props => {
        switch (props.isEmpty) {
            case false:
                return `
                grid-template-columns: 1fr;
            `
            default:
                break;
        }
    }}
   h3{
    color: white;
   }
`
const Group = styled.div`
    
`
