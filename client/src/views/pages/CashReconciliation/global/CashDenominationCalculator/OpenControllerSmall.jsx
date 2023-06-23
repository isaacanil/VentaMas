import React from 'react'
import { icons } from '../../../../../constants/icons/icons'
import styled from 'styled-components'

export const OpenControllerSmall = ({isExpanded, onClick}) => {
  return (
    <Container onClick={onClick}>
        {isExpanded ? icons.arrows.chevronUp : icons.arrows.chevronDown}
    </Container>
  )
}
const Container = styled.div``