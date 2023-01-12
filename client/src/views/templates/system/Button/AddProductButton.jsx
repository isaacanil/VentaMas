import { Button } from "./Button";
import { useDispatch } from "react-redux";
import { openModalAddProd } from "../../../../features/modals/modalSlice";
export const AddProductButton = () => {
    const dispatch = useDispatch()
    const Open = () => {
        dispatch(
            openModalAddProd()
        )
    }
    return(
        <Button
            bgcolor='primary'
            borderRadius='normal'
            title="Agregar Producto"
            onClick={Open}>
            
         
        </Button>
    )
}