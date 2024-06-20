// AnimatedCounter.js
import React from 'react'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import AnimatedDigit from '../AnimatedDigit/AnimatedDigit'

export const AnimatedNumber = ({ value }) => {
    const digits = String(value).split('')
  
    return (
      <CounterContainer>
        {digits.map((digit, index) => (
          <AnimatedDigit key={index} digit={digit} />
        ))}
      </CounterContainer>
    )
  }
  
  const CounterContainer = styled.div`
    display: flex;
    padding: 0 0.4em;
  `