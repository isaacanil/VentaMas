export interface FormattedValueProps {
  type?: string;
  value?: string | number | null | undefined;
  size?: string | number;
  bold?: boolean;
  noWrap?: boolean;
  color?: string;
  transformValue?: boolean;
  align?: string;
}
