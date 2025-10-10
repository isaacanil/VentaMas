import React from 'react'
import styled from 'styled-components'

import { icons } from '../../../../constants/icons/icons';

import { InputV4 } from './GeneralInput/InputV4'

export const SearchInput = ({ onClear, ...props }) => {

  return (

    <Input
      {...props}
      onClear={onClear}
      icon={icons.operationModes.search}
      clearButton={true}
      expandable={true}

    />
  )
}

const Input = styled(InputV4)`

`
