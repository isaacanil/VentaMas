import styled from 'styled-components'
import { icons } from '../../../../constants/icons/icons'
import { useNavigate } from 'react-router-dom'
import { ButtonIconMenu } from './ButtonIconMenu';
export const GoBackButton = () => {
    const navigate = useNavigate();
    const handleGoBack = () => navigate(-1);

    return (
        <ButtonIconMenu
            onClick={handleGoBack}
            icon={icons?.arrows?.chevronLeft}
        />
    )
}
