import { IoMdTrash } from 'react-icons/io'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { totalTaxes, deleteProduct, totalPurchase, setChange, totalShoppingItems } from '../../../../../features/cart/cartSlice'
import { Button, ButtonGroup } from '../../Button/Button'
export const Alert = ({ isOpen, handleIsOpen, id }) => {
    const dispatch = useDispatch()
    const handleDelete = (id) => {
        handleIsOpen(false)
        dispatch(
            deleteProduct(id)
        )
        dispatch(
            totalShoppingItems()
        )
        dispatch(
            totalTaxes()
        )
        dispatch(
            totalPurchase()
        )
        dispatch(
            setChange()
        )
        dispatch(
            totalShoppingItems()
        )
        
    }
    const close = () => {
        handleIsOpen(false)
    }
    return (
        isOpen ? (
            <Component isOpen={isOpen ? 'true' : 'false'}>
                <h1>¿Quieres Eliminar?</h1>
                <ButtonGroup>
                    <Button
                        title={<IoMdTrash />}
                        width='icon32'
                        onClick={() => handleDelete(id)}
                    />
                    <Button
                        title='Cancelar'
                        onClick={() => close()}
                    />
                </ButtonGroup>
            </Component>
        ) : null
    )
}

const Component = styled.div`
    width: 100%;
    height: 100%;
    background-color: #d32929;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1em;
    transition: all 4s ease;
    z-index: 20;
    h1{
        font-size: 1em;
        margin: 0;
        color: white;
    }
    ${(props) => {
        switch (props.isOpen) {
            case 'true':
                return `
                    trasnform: translateX(0);
                
                `
            case 'false':
                return `
                    transform: translateX(200px);
                  
                `


            default:
                break;
        }
    }}
`