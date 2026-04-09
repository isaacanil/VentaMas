import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  padding: 3mm;
  margin: 0;
  font-family: Poppins, sans-serif;
  font-size: 11px;
  line-height: 20px;
  text-transform: uppercase;
  pointer-events: none;
  background-color: white;

  p {
    line-height: 16px;
  }

  @media print {
    margin: 0;
    pointer-events: auto;
  }
`;

export const HiddenPrintWrapper = styled.div<{ ignoreHidden?: boolean }>`
  display: ${({ ignoreHidden }) => (!ignoreHidden ? 'none' : 'block')};
`;

interface InfoItemProps {
  label?: string | null;
  value?: string | number | null;
  align?: 'left' | 'center' | 'right';
  textTransform?: string;
  justifyContent?: string;
}

export function InfoItem({
  label,
  value,
  align = 'left',
  textTransform = '',
  justifyContent = '',
}: InfoItemProps) {
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
const Group = styled.div<{ textTransform?: string; justifyContent?: string }>`
  display: flex;
  gap: 12px;
  justify-content: ${(props: { justifyContent?: string }) =>
    props.justifyContent};
  text-transform: ${(props: { textTransform?: string }) => props.textTransform};
`;

export const Subtitle = styled.p<{ align?: string }>`
  display: flex;
  justify-content: ${({ align }: { align?: string }) => align};
  padding: 0;
  margin: 0;
  font-weight: 600;
  line-height: 12px;
  white-space: nowrap;
`;

export const Paragraph = styled.p<{ align?: string }>`
  margin: 0;
  padding: 0.2em 0;
  text-transform: uppercase;
  ${({ align }: { align?: string }) => {
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

export const Spacing = styled.div<{ size?: 'small' | 'medium' | 'large' }>`
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
