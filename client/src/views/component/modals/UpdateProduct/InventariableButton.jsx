
import React, { useEffect, useState } from 'react'
import { MdRadioButtonChecked, MdRadioButtonUnchecked } from 'react-icons/md'
import { useDispatch } from 'react-redux'
import { Button } from '../../../templates/system/Button/Button'

export const InventariableButton = ({ product, setProduct }) => {

    const dispatch = useDispatch();

    const handleToggle = () => {
        dispatch(setProduct({...product, trackInventory: !product?.trackInventory}))
    };

    return (
        <Button
            borderRadius={'normal'}
            title={'Invetariable'}
            isActivated={product?.trackInventory}
            iconOn={<MdRadioButtonChecked />}
            iconOff={<MdRadioButtonUnchecked />}
            onClick={handleToggle}
        />
    )
}
