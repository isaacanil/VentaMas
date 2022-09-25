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
        <Button onClick={Open}>
            Crear Producto
        </Button>
    )
}