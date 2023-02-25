import { Button } from "./Button";
import { useDispatch } from "react-redux";
import { openModalAddProd } from "../../../../features/modals/modalSlice";
import { CgMathPlus } from "react-icons/cg";
export const AddProductButton = () => {
    const dispatch = useDispatch()
    const Open = () => {
        dispatch(
            openModalAddProd()
        )
    }
    return(
        <Button
            borderRadius='normal'
            startIcon={<CgMathPlus/>}
            title="Producto"
            onClick={Open}>
        </Button>
    )
}