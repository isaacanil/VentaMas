import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: Record<string, Record<string, string>>;
    text?: Record<string, string>;
    divider?: string;
    bg?: Record<string, string>;
    border?: Record<string, string>;
    action?: Record<string, string | number>;
    [key: string]: unknown;
  }
}
