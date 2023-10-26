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
    z-index: 100;
    top: 3em;

    overflow: hidden;

    /* box */
  
    height: calc(100vh - 7em);
    display: grid;
    border-radius: 10px;
    width: 100%;
    background-color: rgb(80, 80, 80);

    /*animation */
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

const Body = styled.div`
    z-index: 1;
    width: 100%;
    height: 100%;
  
    overflow-y: scroll;
    padding: 0.5em;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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
