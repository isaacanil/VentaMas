import React from 'react'
import styled from 'styled-components'

const StyledH1 = styled.h1`
  font-family: Roboto, sans-serif;
  font-weight: 300;
  line-height: 1;
  margin: 0;
  padding: 0;
  color: ${props => props.color };
  font-size: ${props => {
        switch (props.size) {
            case 'small':
                return '24px'
            case 'medium':
                return '36px'
            case 'big':
                return '48px'
            default:
                return '36px'
        }
    }};
`

const StyledH2 = styled.h2`
  font-family: Roboto, sans-serif;
  font-weight: 300;
  line-height: 1;
  margin: 0;
  padding: 0;
  color: ${props => props.color };
  font-size: ${props => {
        switch (props.size) {
            case 'small':
                return '20px'
            case 'medium':
                return '32px'
            case 'big':
                return '44px'
            default:
                return '32px'
        }
    }};
`

const StyledH3 = styled.h3`
  font-family: Roboto, sans-serif;
  font-weight: 400;
  line-height: 1;
  margin: 0;
  padding: 0;
  color: ${props => props.color };
  font-size: ${props => {
        switch (props.size) {
            case 'small':
                return '20px'
            case 'medium':
                return '32px'
            case 'big':
                return '44px'
            default:
                return '32px'
        }
    }};
`

const StyledH4 = styled.h4`
  font-weight: 400;
  line-height: 1;
  margin: 0;
  padding: 0;
  color: ${props => props.color };
  font-size: ${props => {
        switch (props.size) {
            case 'small':
                return '14px'
            case 'medium':
                return '24px'
            case 'big':
                return '36px'
            default:
                return '24px'
        }
    }};
`

const StyledH5 = styled.h5`
  font-weight: 400;
  line-height: 1;
  margin: 0;
  color: ${props => props.color };
  font-size: ${props => {
        switch (props.size) {
            case 'small':
                return '12px'
            case 'medium':
                return '20px'
            case 'big':
                return '32px'
            default:
                return '20px'
        }
    }};
  
`

const StyledH6 = styled.h6`
  font-weight: 500;
  line-height: 1;
  color: ${props => props.color };
  font-size: ${props => {
        switch (props.size) {
            case 'small':
                return '10px'
            case 'medium':
                return '16px'
            case 'big':
                return '28px'
            default:
                return '16px'
        }
    }};
`

const StyledP = styled.p`
  font-weight: 400;
  line-height: 1.5;
  color: ${props => props.color };
  font-size: ${props => {
        switch (props.size) {
            case 'small':
                return '12px'
            case 'medium':
                return '14px'
            case 'big':
                return '20px'
            default:
                return '16px'
        }
    }};
`

export const Typography = ({ children, variant = 'body1', color, size }) => {
    switch (variant) {
        case 'h1':
            return <StyledH1 color={color} size={size}>{children}</StyledH1>
        case 'h2':
            return <StyledH2 color={color} size={size}>{children}</StyledH2>
        case 'h3':
            return <StyledH3 color={color} size={size}>{children}</StyledH3>
        case 'h4':
            return <StyledH4 color={color} size={size}>{children}</StyledH4>
        case 'h5':
            return <StyledH5 color={color} size={size}>{children}</StyledH5>
        case 'h6':
            return <StyledH6 color={color} size={size}>{children}</StyledH6>
        default:
            return <StyledP color={color} size={size}>{children}</StyledP>
    }
}

