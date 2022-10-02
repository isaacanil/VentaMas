import React from 'react'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'

import { SelectAddOrderModal, openModalAddOrder  } from '../../../../features/modals/modalSlice'
import { Button } from '../../../templates/system/Button/Button'

export const AddOrderModal = () => {
    const dispatch = useDispatch();
    const isOpen = useSelector(SelectAddOrderModal);
    const handleModal = () => {
        dispatch(
            openModalAddOrder()
        )
        console.log('Hola')
    }
  return (
    isOpen ? (
        <ModalContainer>
            <Modal>
                <ModalHeader>
                    <h3>Creación Pedido</h3>
                    <Button color='error' onClick={handleModal}>X</Button>
                </ModalHeader>
                <ModalBody>

                </ModalBody>
                <ModalFooter>

                </ModalFooter>
            </Modal>
        </ModalContainer>

    ) : null
  )
}

const ModalContainer = styled.div`
    z-index: 2;
    position: absolute;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.200);
    backdrop-filter: blur(10px);
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
`
const Modal = styled.div`
    max-width: 800px;
    width: 100%;
    height: 600px;
    background-color: white;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.300);
    overflow: hidden;
`
const ModalHeader = styled.header`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1em;
    background-color: #494949;
    color: white;
`
const ModalBody = styled.div`
    background-color: white;
    border: 1px solid rgba(0, 0, 0, 0.300);
    
`
const ModalFooter = styled.footer``