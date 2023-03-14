import React from 'react'
import { IoMdClose } from 'react-icons/io'
import styled from 'styled-components'
import { Button } from '../../../../templates/system/Button/Button'

const ModalHeader = ({close, title}) => {
  
  const handleCloseModal = () => {
    close()
  }
  return (
    <Container>
      <HeadWrapper>
        <h3>{title}</h3>
        <Button
          bgcolor='gray'
          borderRadius='normal'
          endIcon={<IoMdClose />}
          title='Cerrar'
          onClick={handleCloseModal}
        />
      </HeadWrapper>
    </Container>
  )
}

export default ModalHeader

const Container = styled.div`
 width: 100%;
        padding: 0 1em;
        background-color: var(--Gray8);
        color: white;
`
const HeadWrapper = styled.div`
    max-width: var(--max-width);
            margin: 0 auto;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
`
