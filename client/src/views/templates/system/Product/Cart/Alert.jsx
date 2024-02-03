import { IoMdTrash } from 'react-icons/io'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { totalTaxes, deleteProduct, totalPurchase, setChange, totalShoppingItems } from '../../../../../features/cart/cartSlice'
import { Button, ButtonGroup } from '../../Button/Button'
export const Alert = ({ isOpen, handleIsOpen, id }) => {
    const dispatch = useDispatch()
    const handleDelete = (id) => {
        handleIsOpen(false)
        dispatch(deleteProduct(id))
        dispatch(totalShoppingItems())
        dispatch(totalTaxes()
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
      
            <Component isOpen={isOpen ? 'true' : 'false'}>
                <h1>¿Quieres Eliminar?</h1>
                <ButtonGroup>
                    <Button
                    borderRadius='normal'
                        title={<IoMdTrash />}
                        width='icon32'
                        onClick={() => handleDelete(id)}
                    />
                    <Button
                        title='Cancelar'
                        borderRadius='normal'
                        onClick={() => close()}
                    />
                </ButtonGroup>
            </Component>
     
    )
}

const Component = styled.div`
    width: 100%;
    height: 100%;
    background-color: #d32929;
    border-radius: 4px;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1em;
    transition: transform 500ms ease-in-out;
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
              
                transition: transform 390ms ease-in-out;
                transform: scale(1) translateY(0);
                
                `
            case 'false':
                return `
                transition: transform 200ms ease-in-out;
                transform: scale(0) translateY(-200%);
                  
                `


            default:
                break;
        }
    }}
`