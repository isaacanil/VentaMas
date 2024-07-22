import styled from "styled-components"
import { useFormatNumber } from "../../../../hooks/useFormatNumber";
import { useFormatPrice } from "../../../../hooks/useFormatPrice";

export function Showcase({
    title,
    value,
    valueType = 'none',
    description,
    color = false
}) {
    const determineColor = () => {
        if (typeof color === 'boolean' && color === true) {
            return value >= 0 ? 'success-contained' : 'error-contained';
        }
        if (typeof color === 'string') {
            return color;
        }
        return ""
    }

    const formatting = (value) => {
        switch (valueType) {
            case 'number':
                return useFormatNumber(value)
            case 'percent':
                return `${value}%`
            case 'price':
                return useFormatPrice(value)
            default:
        }
        return value
    }

    return (
        <Container color={determineColor()}>
            <Title>{title}</Title>
            <Value>{formatting(value)}</Value>
            {
                description && <Description>{description}</Description>
            }
        </Container>
    )
}
const Container = styled.div`
    background-color:  var(--White2);
    display: grid;
    padding: 0.3em 0.6em;
    justify-content: center;

    text-align: center; 
    border-radius: 0.4em;
    /* color: ${(props) => {
        if (props.color === 'success-contained' || props.color === 'error-contained') {
            return `red`;
        } else if (props.color === 'default') {
            return 'var(--Black)';
        } else {
            return props.color; // Esto manejará cualquier string de color CSS directamente
        }
    }}; */
    color: ${(props) => props?.theme?.colors[props?.color]?.text ?? ''};
    background-color: ${(props) => props?.theme?.colors[props?.color]?.bg ?? ''};

`
const Value = styled.h2`
    font-size: 1.4em;
    margin: 0;
`
const Title = styled.span`
    font-size: 1em;
    font-weight: 500;
    margin: 0;
`
const Description = styled.span`
    font-size: 0.9em;
    margin: 0;
`