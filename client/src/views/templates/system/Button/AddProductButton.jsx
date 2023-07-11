import { Button } from "./Button";
import { useDispatch, useSelector } from "react-redux";
import { openModalAddProd, openModalUpdateProd } from "../../../../features/modals/modalSlice";
import { CgMathPlus } from "react-icons/cg";
import { ChangeProductData, selectUpdateProductData } from "../../../../features/updateProduct/updateProductSlice";
import { OPERATION_MODES } from "../../../../constants/modes";
export const AddProductButton = () => {
    const dispatch = useDispatch()
    const {product} = useSelector(selectUpdateProductData)
    const Open = () => {
        dispatch(openModalUpdateProd());
        dispatch(ChangeProductData({ product, status: OPERATION_MODES.CREATE.label }));
    }
    return (
        <Button
            borderRadius='light'
            startIcon={<CgMathPlus />}
            title="Producto"
            onClick={Open}>
        </Button>
    )
}