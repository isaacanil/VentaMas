import { faCircleDot, faCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useDispatch } from 'react-redux'

import { Button } from '../../../../../templates/system/Button/Button'


export const ProductVisibilityButton = ({product, setProduct}) => {
    const dispatch = useDispatch()
    const handleToggle = () => {
        dispatch(setProduct({ ...product, isVisible: !product.isVisible }))
    }
    return (
        <Button
            borderRadius={'normal'}
            alignText={'left'}
            title={product?.isVisible !== false ? 'Facturable' : 'No facturable'}
            isActivated={product?.isVisible !== false }            iconOn={<FontAwesomeIcon icon={faCircleDot} />}
            iconOff={<FontAwesomeIcon icon={faCircle} />}
            onClick={handleToggle}
        />
    )
}
