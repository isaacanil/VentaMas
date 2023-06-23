
import styled from 'styled-components'
import { Button } from '../../../../../templates/system/Button/Button'

export const Footer = ({onSubmit, onCancel}) => {
  return (
    <Component>
        <Button title={'Cancelar'} onClick={onCancel}/>
        <Button title={'Guardar'} bgcolor={'primary'} onClick={onSubmit}/>
    </Component>
  )
}
const Component = styled.div`
    display: flex;
    justify-content: end;
    gap: 0.4em;
   
`