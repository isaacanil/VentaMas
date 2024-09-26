import React from 'react'
import { Button } from '../../../../../system/Button/Button'
import { faFileImport } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export const ImportProductsButton = () => {
    return (
        <Button
            title="Importar"
            startIcon={<FontAwesomeIcon icon={faFileImport} />}
        />
    )
}
