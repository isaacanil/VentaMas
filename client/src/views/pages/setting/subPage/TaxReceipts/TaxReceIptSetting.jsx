import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMatch } from 'react-router-dom'
import styled from 'styled-components'
import { getTaxReceiptData, IncreaseEndConsumer, selectTaxReceiptEnabled, toggleTaxReceiptSettings } from '../../../../../features/taxReceipt/taxReceiptSlice'
import { Button, MenuApp } from '../../../../index'
import { TableTaxReceipt } from './components/TableTaxReceipt/TableTaxReceipt'
import { fbGetTaxReceipt } from '../../../../../firebase/taxReceipt/fbGetTaxReceipt'
import { fbUpdateTaxReceipt } from '../../../../../firebase/taxReceipt/fbUpdateTaxReceipt'
import { selectUser } from '../../../../../features/auth/userSlice'
import { FormattedValue } from '../../../../templates/system/FormattedValue/FormattedValue'
import { useCompareArrays } from '../../../../../hooks/useCompareArrays'
import { ButtonGroup } from '../../../../templates/system/Button/Button'
import { fbEnabledTaxReceipt } from '../../../../../firebase/Settings/taxReceipt/fbEnabledTaxReceipt'
import Typography from '../../../../templates/system/Typografy/Typografy'
// Aquí separamos los botones en sus propios componentes
const UpdateButton = ({ arrayAreEqual, handleSubmit }) => (
  <Button
    title='Actualizar'
    borderRadius={'normal'}
    onClick={handleSubmit}
    disabled={arrayAreEqual ? true : false}
  />
);

const CancelButton = ({ arrayAreEqual, handleCancel }) => (
  <Button
    title='Cancelar'
    borderRadius={'normal'}
    onClick={handleCancel}
    disabled={arrayAreEqual ? true : false}
  />
);

const ToggleReceiptButton = ({ taxReceiptEnabled, handleTaxReceiptEnabled }) => (
  <Button
    title={taxReceiptEnabled ? 'Deshabilitar' : 'Habilitar'}
    borderRadius={'normal'}
    bgcolor={taxReceiptEnabled ? 'primary' : 'gray'}
    isActivated={taxReceiptEnabled}
    onClick={handleTaxReceiptEnabled}
  />
);

// Aquí separamos las secciones en sus propios componentes
const ReceiptSettingsSection = ({ taxReceiptEnabled, handleTaxReceiptEnabled }) => (
  <DisabledSettingContainer>
    <div>
      <Typography variant='h5' bold={'true'} >
        Opción para Deshabilitar Comprobantes
      </Typography>
      <Typography variant='body2' size='small' >
        Activa o desactiva los comprobantes en el punto de venta
      </Typography>
      {/* <FormattedValue value={'Opción para Deshabilitar Comprobantes'} type={'title'} size={'small'} /> */}
      {/* <FormattedValue value={'Activa o desactiva los comprobantes en el punto de venta'} type={'paragraph'} /> */}
    </div>
    <div>
      <ToggleReceiptButton taxReceiptEnabled={taxReceiptEnabled} handleTaxReceiptEnabled={handleTaxReceiptEnabled} />
    </div>
  </DisabledSettingContainer>
);

const ReceiptTableSection = ({ taxReceiptEnabled, taxReceiptLocal, setTaxReceiptLocal, handleSubmit, handleCancel, arrayAreEqual }) => (
  taxReceiptEnabled && (
    <Container>
      <TableTaxReceipt array={taxReceiptLocal} setData={setTaxReceiptLocal} />
      <ButtonGroup>
        <UpdateButton arrayAreEqual={arrayAreEqual} handleSubmit={handleSubmit} />
        <CancelButton arrayAreEqual={arrayAreEqual} handleCancel={handleCancel} />
      </ButtonGroup>
    </Container>
  )
);

export const TaxReceiptSetting = () => {
  const dispatch = useDispatch()
  const [taxReceiptLocal, setTaxReceiptLocal] = useState([])
  const user = useSelector(selectUser)
  const { taxReceipt } = fbGetTaxReceipt()
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled)

  useEffect(() => {
    dispatch(getTaxReceiptData(taxReceipt))
    setTaxReceiptLocal(taxReceipt)
  }, [taxReceipt])

  const handleSubmit = () => fbUpdateTaxReceipt(user, taxReceiptLocal);

  const handleCancel = () => setTaxReceiptLocal(taxReceipt);

  const handleTaxReceiptEnabled = () => {
    fbEnabledTaxReceipt(user)
  };

  const arrayAreEqual = useCompareArrays(taxReceiptLocal, taxReceipt)

  return (
    <Container>
      <MenuApp sectionName={'Comprobantes'}></MenuApp>
      <Main>
        <Head>
          <Typography variant='h2'>
            Configuración de Comprobantes
          </Typography>
          {/* <FormattedValue value={'Configuración de Comprobantes'} type={'title'} /> */}
          <FormattedValue value={'Ajusta cómo se generan y muestran los comprobantes en el punto de venta.'} type={'paragraph'} />
        </Head>

        <ReceiptSettingsSection taxReceiptEnabled={taxReceiptEnabled} handleTaxReceiptEnabled={handleTaxReceiptEnabled} />
        <ReceiptTableSection taxReceiptEnabled={taxReceiptEnabled} taxReceiptLocal={taxReceiptLocal} setTaxReceiptLocal={setTaxReceiptLocal} handleSubmit={handleSubmit} handleCancel={handleCancel} arrayAreEqual={arrayAreEqual} />


      </Main>
    </Container>
  )
}
const Container = styled.div`
  display: grid;
  gap: 1.6em;
`
const Footer = styled.div``
const Head = styled.div`
  display: grid;
 
  width: 100%;

`
const DisabledSettingContainer = styled.div`
display: flex;
justify-content: space-between;
align-items: center;
gap: 1em;
`

const Main = styled.div`
  display: grid;
  gap: 2.6em;
  margin: 0 auto;
  max-width: 800px;
  width: 100%;
  padding: 1em;
  h4{
    padding: 0 1em;
  }
`
