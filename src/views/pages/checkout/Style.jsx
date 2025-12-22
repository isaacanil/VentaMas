import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  width: 100vw;
  padding: 3mm;
  margin: 0;
  font-family: Lato, sans-serif;
  font-size: 11px;
  line-height: 20px;
  text-transform: uppercase;
  pointer-events: none;

  p {
    line-height: 16px;
  }

  @media print {
    margin: 0;
    pointer-events: auto;
  }
`;

export const HiddenPrintWrapper = styled.div`
  display: ${({ ignoreHidden }) => !ignoreHidden && 'none'};
`;

export function InfoItem({
  label,
  value,
  align = 'left',
  textTransform = '',
  justifyContent = '',
}) {
  return (
    <Group textTransform={textTransform} justifyContent={justifyContent}>
      {label && (
        <Paragraph align={align}>
          {label} {value && ': '}
        </Paragraph>
      )}
      {value && <span>{value}</span>}
    </Group>
  );
}
const Group = styled.div`
  display: flex;
  gap: 12px;
  justify-content: ${(props) => props.justifyContent};
  text-transform: ${(props) => props.textTransform};
`;

export const Subtitle = styled.p`
  display: flex;
  justify-content: ${({ align }) => align};
  padding: 0;
  margin: 0;
  font-weight: 600;
  line-height: 12px;
  white-space: nowrap;
`;

export const Paragraph = styled.p`
  margin: 0;
  padding: 0.2em 0;
  text-transform: uppercase;
  ${({ align }) => {
    switch (align) {
      case 'center':
        return 'text-align: center;';
      case 'right':
        return 'text-align: right;';
      default:
        return 'text-align: left;';
    }
  }}
`;

export const Divider = styled.div`
  border: none;
  border-top: 1px dashed black;
`;

export const Spacing = styled.div`
  margin-bottom: 0.8em;
  ${({ size }) => {
    switch (size) {
      case 'small':
        return 'margin-bottom: 0.2em;';
      case 'medium':
        return 'margin-bottom: 0.8em;';
      case 'large':
        return 'margin-bottom: 1.6em;';
      default:
        return 'margin-bottom: 0.8em;';
    }
  }}
`;
