
import React, { useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { OPERATION_MODES } from '../../../../constants/modes'
import { toggleClientModal } from '../../../../features/modals/modalSlice'
import { Button } from '../../../templates/system/Button/Button'
import { InputV4 } from '../../../templates/system/Inputs/InputV4'
import { OrderFilter } from './components/OrderFilter/OrderFilter'

export const ToolBar = ({ searchTerm, setSearchTerm }) => {
    const createMode = OPERATION_MODES.CREATE.id
    const dispatch = useDispatch()

    const openModal = () => dispatch(toggleClientModal({ mode: createMode, data: null }))

    return (
        <Container>
            <Wrapper>
                <InputV4
                    placeholder={'Buscar Cliente ...'}
                    deleteBtn icon={<FaSearch />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button
                    borderRadius='normal'
                    bgcolor='primary'
                    title='Nuevo Cliente'
                    onClick={openModal}
                />
            </Wrapper>
        </Container>
    )
}
const Container = styled.div`
    height: 2.50em;
    width: 100vw;
    background-color: rgb(255, 255, 255);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1em;
`
const Wrapper = styled.div`
    max-width: 1000px;
    width: 100%;
    padding: 0 1em;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1em;
`