import React from 'react'
import { MdRadioButtonChecked, MdRadioButtonUnchecked } from 'react-icons/md'
import { Button } from '../../../../../templates/system/Button/Button'
import { useDispatch } from 'react-redux'

export const ProductVisibilityButton = ({product, setProduct}) => {
    const dispatch = useDispatch()
    const handleToggle = () => {
        dispatch(setProduct({ ...product, isVisible: !product.isVisible }))
    }
    return (
        <Button
            borderRadius={'normal'}
            title={product?.isVisible !== false ? 'Visible' : 'Oculto'}
            isActivated={product?.isVisible !== false }
            iconOn={<MdRadioButtonChecked />}
            iconOff={<MdRadioButtonUnchecked />}
            onClick={handleToggle}
        />
    )
}
