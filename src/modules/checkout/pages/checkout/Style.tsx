import type { CSSProperties, ReactNode } from 'react';
import styled from 'styled-components';

type Align = 'left' | 'center' | 'right';

type HiddenPrintWrapperProps = {
  ignoreHidden?: boolean;
};

export const Container = styled.div`
  width: 100%;
  width: 100vw;
  padding: 3mm;
  margin: 0;
  font-family: 'Poppins', sans-serif;
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

export const HiddenPrintWrapper = styled.div<HiddenPrintWrapperProps>`
  display: ${({ ignoreHidden }) => (ignoreHidden ? 'block' : 'none')};
`;

type InfoItemProps = {
  label?: ReactNode;
  value?: ReactNode;
  align?: Align;
  textTransform?: CSSProperties['textTransform'];
  justifyContent?: CSSProperties['justifyContent'];
};

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

const Group = styled.div<{
  justifyContent?: CSSProperties['justifyContent'];
  textTransform?: CSSProperties['textTransform'];
}>`
  display: flex;
  gap: 12px;
  justify-content: ${({ justifyContent }) => justifyContent};
  text-transform: ${({ textTransform }) => textTransform};
`;

export const Subtitle = styled.p<{ align?: Align }>`
  display: flex;
  justify-content: ${({ align }) => align};
  padding: 0;
  margin: 0;
  font-weight: 600;
  line-height: 12px;
  white-space: nowrap;
`;

export const Paragraph = styled.p<{ align?: Align }>`
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

type SpacingSize = 'small' | 'medium' | 'large';

export const Spacing = styled.div<{ size?: SpacingSize }>`
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
