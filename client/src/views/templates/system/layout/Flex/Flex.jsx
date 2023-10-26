import styled from 'styled-components'

const gap = {
    none: '0em',
    small: '0.5em',
    medium: '0.8em',
    base: '1em',
    large: '1.2em',
}
const wrap ={
    nowrap: 'nowrap',
    wrap: 'wrap',
}


const Flex = styled.div`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  justify-content: ${props => props.justify || 'flex-start'};
  align-items: ${props => props.align || 'flex-start'};
  flex-wrap: ${props => props.wrap || 'nowrap'};
  gap: ${props => props.gap ? gap[props.gap] || gap.base : gap.none};
`;

export default Flex;
