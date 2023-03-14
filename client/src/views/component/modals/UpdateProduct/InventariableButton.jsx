
import React, { useEffect, useState } from 'react'
import { MdRadioButtonChecked, MdRadioButtonUnchecked } from 'react-icons/md'
import { Button } from '../../../templates/system/Button/Button'

export const InventariableButton = ({ product, setProduct }) => {
    const [isActive, setIsActive] = useState(false)
    useEffect(() => {
        setIsActive('trackInventory' in product && product.trackInventory || false);
      }, [product]);
   


    return (
        <Button
            borderRadius={'normal'}
            title={'Invetariable'}
            isActivated={isActive === true ? true : false}
            iconOn={<MdRadioButtonChecked />}
            iconOff={<MdRadioButtonUnchecked />}
            onClick={() => setProduct({
                ...product,
                trackInventory: !product.trackInventory
            })}
        />
    )
}
