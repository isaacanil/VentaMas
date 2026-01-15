import type { ReactNode } from 'react';
import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  padding: 3mm;
  margin: 0;
  font-family: 'Poppins', sans-serif;
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

type Align = 'left' | 'center' | 'right';
type SpacingSize = 'small' | 'medium' | 'large';

type HiddenPrintWrapperProps = {
  ignoreHidden?: boolean;
};

export const HiddenPrintWrapper = styled.div<HiddenPrintWrapperProps>`
  display: ${({ ignoreHidden }: HiddenPrintWrapperProps) => !ignoreHidden && 'none'};
`;

type InfoItemProps = {
  label?: ReactNode;
  value?: ReactNode;
  align?: Align;
  textTransform?: string;
  justifyContent?: string;
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
type GroupProps = {
  justifyContent?: string;
  textTransform?: string;
};

const Group = styled.div<GroupProps>`
  display: flex;
  gap: 12px;
  justify-content: ${(props) => props.justifyContent};
  text-transform: ${(props) => props.textTransform};
`;

type SubtitleProps = {
  align?: Align;
};

export const Subtitle = styled.p<SubtitleProps>`
  display: flex;
  justify-content: ${({ align }: SubtitleProps) => align};
  padding: 0;
  margin: 0;
  font-weight: 600;
  line-height: 12px;
  white-space: nowrap;
`;

type ParagraphProps = {
  align?: Align;
};

export const Paragraph = styled.p<ParagraphProps>`
  margin: 0;
  padding: 0.2em 0;
  text-transform: uppercase;
  ${({ align }: ParagraphProps) => {
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

type SpacingProps = {
  size?: SpacingSize;
};

export const Spacing = styled.div<SpacingProps>`
  margin-bottom: 0.8em;
  ${({ size }: SpacingProps) => {
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
