import React, { useState } from 'react'
import { IoMdTrash } from 'react-icons/io'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { Button } from '../Button/Button'

export const DeleteProductFromCartAlert = () => {
    const [ isOpen, setIsOpen ] = useState(false)
    const dispatch = useDispatch()
    const handleCancel = () => {
        dispatch(
            handleDeleteProductAlert()
        )
    }
    const handleSuccess = () => {
        dispatch(
            handleDeleteProductAlertSuccess()
        )
        dispatch(
            handleDeleteProductAlert()
        )
    }
  return (
    isOpen ? (
        <Backdrop>
            <Container>
                <Head>
                    <h1>Quitar de Factura</h1>
                </Head>
               
                <Footer>
                    <Button
                        bgcolor='error'
                        startIcon={<IoMdTrash />}
                        title='Eliminar'
                        onClick={handleSuccess}
                    />
                    <Button
                        bgcolor='gray'
                        title='Cancelar'
                        onClick={() => handleCancel()}
                    />
                </Footer>
            </Container>
        </Backdrop>

    ) : null
  )
}

const Backdrop = styled.div`
    position: absolute;
    top: 0;
    
    backdrop-filter: blur(5px);
    z-index: 20;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    display: grid;
    align-items: center;
    justify-items: right;
    justify-content: right;
    align-content: center;
    grid-template-columns: 1fr;
 `
const Container = styled.div`
    max-width: 400px;
    border-radius: 8px;
    width: 100%;
    height: auto;
    padding: 0.2em 0;
    background-color: white;
    display: grid;
    grid-template-rows: 1fr 1fr;
    `
const Head = styled.div`
display: flex;

align-items: center;
gap: 1em;
padding: 0 1em;
    h1{
        font-size: 1.4rem;
        margin: 0;
        display: block;
        width: 100%;
    
    }
   
`

const Footer = styled.div`
    display: flex;
    justify-content: end;
    gap: 1.1em;
    padding: 0.5em 1em;
    align-items: flex-end;
`