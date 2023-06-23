import styled from "styled-components"
import { ConfirmCancelButtons } from "../../../../global/ConfirmCancelButtons/ConfirmCancelButtons"

export const Footer = ({onSubmit, onCancel}) => {
    return (
      <Container>
           <ConfirmCancelButtons onSubmit={onSubmit} onCancel={onCancel} />
      </Container>
    )
  }

  const Container = styled.div`
      background-color: #ffffff96;
      backdrop-filter: blur(5px);
      padding: 0.4em;
      position: sticky;
      bottom: 0;
      /* position: absolute;
      bottom: 4px;
      right: 0; */
      border-radius: var(--border-radius);
      border: var(--border-primary);
  `