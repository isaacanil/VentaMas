import { Button } from "./Button";
import { useDispatch, useSelector } from "react-redux";
import { openModalAddProd, openModalUpdateProd } from "../../../../features/modals/modalSlice";
import { ChangeProductData, selectUpdateProductData } from "../../../../features/updateProduct/updateProductSlice";
import { OPERATION_MODES } from "../../../../constants/modes";
import { icons } from "../../../../constants/icons/icons";
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
            startIcon={icons.operationModes.add}
            title="Producto"
            onClick={Open}>
        </Button>
    )
}