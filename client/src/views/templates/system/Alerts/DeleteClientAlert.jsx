import React from 'react'
import styled from 'styled-components'
import { Button } from '../Button/Button'
import { IoMdTrash } from 'react-icons/io'
import { useSelector } from 'react-redux'
import { selectDeleteProductAlert, handleDeleteProductAlertSuccess, handleDeleteProductAlert } from '../../../../features/Alert/AlertSlice'
import { useDispatch } from 'react-redux'
import { GoAlert } from 'react-icons/go'
export const DeleteClientAlert = ({ 
    success, 
    title = 'Eliminar Producto', 
    message='Esta acción borrara permanentemente todos los datos' }) => {
    const dispatch = useDispatch()
    const isOpen = useSelector(selectDeleteProductAlert)

    const handleCancel = () => {
        dispatch(handleDeleteProductAlert())
    }
    const handleSuccess = () => {
        dispatch(handleDeleteProductAlertSuccess())
        dispatch(handleDeleteProductAlert())
    }
    return (
        isOpen ? (
            <Backdrop>
                <Container>
                    <Head>
                        <h1>{title}</h1>
                    </Head>
                    <Body>
                        <Message>
                           <GoAlert/> <p>{message}</p>
                        </Message>
                    </Body>
                    <Footer>
                        <Button
                            borderRadius='normal'
                            bgcolor='error'
                            startIcon={<IoMdTrash />}
                            title='Eliminar'
                            onClick={handleSuccess}
                        />
                        <Button
                            borderRadius='normal'
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
    backdrop-filter: blur(2px);
    z-index: 20;
    width: 100%;
    height: 100%;
    background-color: rgba(16, 16, 16, 0.300);
    display: grid;
    align-items: center;
    justify-items: center;
    justify-content: center;
    align-content: center;
    grid-template-columns: 1fr;
 `
const Message = styled.div`
    background-color: rgb(251,233,231);
    color: rgb(211,47,47);
    display: flex;
    align-items: center;
    gap: 1em;
    height: 3em;
    padding: 0 1.4em;
    font-size: 1.3em;
    p{
        font-size: 14px;
    }
 `
const Container = styled.div`
    max-width: 650px;
    border-radius: 8px;
    width: 100%;
    height: 18em;
    background-color: white;
    display: grid;
    grid-template-rows: 1fr 3fr 1fr;
    `
const Head = styled.div`
display: flex;
align-items: center;
gap: 1em;
padding: 0 1em;
    h1{
        font-size: 1.25em;
        margin: 0;
    }
    svg{
        font-size: 1.5em;
        fill: #f7f7f7;
        height: 2.2em;
        width: 2.2em;
        padding: 0.4em;
        clip-path: circle();
        background-color: #d33232;
    }
`
const Body = styled.div`
    padding: 0.5em 1.5em;
    `
const Footer = styled.div`
    display: flex;
    justify-content: end;
    gap: 1.1em;
    padding: 0.5em 1em;
`