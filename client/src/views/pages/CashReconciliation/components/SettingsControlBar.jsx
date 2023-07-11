import React, { useState } from 'react'
import styled from 'styled-components'
import { icons } from '../../../../constants/icons/icons'
import Select from '../../../templates/system/SelectV3/SelectV3'
import { DatePicker } from '../../../templates/system/DatePicker/DatePicker'

export const SettingsControlBar = () => {
    const [settings, setSettings] = useState({
        status: '',
    })
    const [datesSelected, setDatesSelected] = useState({})
    const cashReconciliationStatus = [
        {
            id: 1, name: 'Abierto'
        },
        {
            id: 2, name: 'En Proceso de Cierre'
        },
        {
            id: 3, name: 'Guardando'
        },
        {
            id: 4, name: 'Cerrado'
        },
    ]
    return (
        <Container>
            {/* {icons.operationModes.filter} */}
            <Select
                options={cashReconciliationStatus}
                onChange={ (selectedItem) => setSettings({...settings, status: selectedItem})}
                value={settings.status}
                optionsLabel={'name'}
                label
                title={'Estado'}
                maxWidth={'small'}
            />
             <Select
                options={cashReconciliationStatus}
                onChange={ (selectedItem) => setSettings({...settings, status: selectedItem})}
                value={settings.status}
                optionsLabel={'name'}
                title={'Usuario'}
               
                label
            />
            <DatePicker dates={setDatesSelected} data={datesSelected}  />
        </Container>
    )
}
const Container = styled.div`
max-width: 1300px;
width: 100%;
border-radius: var(--border-radius);
margin: 0 auto;
height: 3.6em;
align-items: center;
padding: 0 0.5em;
    display: flex;
    gap: 1em;
    background-color: var(--White);
`