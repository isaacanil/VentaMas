import React from 'react'
import styled from 'styled-components'
import { Button } from '../../../../templates/system/Button/Button'
import { useNavigate } from 'react-router-dom'
export const ConfirmCancelButtons = ({ onSubmit, onCancel }) => {
  const navigate = useNavigate()
  const handleCancel = () => { onCancel && onCancel() }
  return (
    <Container>
      <Button
        title={onSubmit ? 'Cancelar' : 'Cerrar'}
        onClick={handleCancel}
        bgcolor={'gray'}
        borderRadius={'normal'}
      />
      {
        onSubmit && (
          <Button
            title={'Confirmar'}
            onClick={onSubmit}
            bgcolor={'primary'}
            borderRadius={'normal'}
          />)
      }
    </Container>

  )
}

const Container = styled.div`
    display: flex;
    gap: 1em;
    justify-content: flex-end;
`
