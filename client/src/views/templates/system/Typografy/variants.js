import { css } from "styled-components";
const boldScale = {
    small: 400,
    medium: 500,
    large: 600,
    xlarge: 700,
    xxlarge: 800,
    xxxlarge: 900,
}
export const variants = {  
    h1: css`
      margin: 0.6rem 0;
      line-height: 1.2;
      font-weight: 600;
    `,
    h2: css`
      margin: 0.6rem 0;
      line-height: 1.3;
      font-weight: 500;
    `,
    h3: css`
      margin: 0.4rem 0;
      line-height: 1.4;
      font-weight: 500;
    `,
    h4: css`
      margin: 0.35rem 0;
      line-height: 1.5;
      font-weight: 400;
    `,
    h5: css`
      margin: 0.3rem 0;
      line-height: 1.6;
      font-weight: 400;
    `,
    
    h6: css`
      margin: 0.25rem 0;
      line-height: 1.7;
      font-weight: 400;
    `,
    subtitle1: css`
      margin: 0.35rem 0;
      line-height: 1.5;
      font-weight: 400;
    `,
    subtitle2: css`
      margin: 0.3rem 0;
      line-height: 1.6;
      font-weight: 400;
    `,
    body1: css`
      font-size: 1rem;
      margin: 0.35rem 0;
      line-height: 1.5;
      font-weight: 400;
    `,
    body2: css`
      font-size: 1rem;
      margin: 0.3rem 0;
      line-height: 1.6;
      font-weight: 400;
    `,
    caption: css`
      margin: 0.25rem 0;
      line-height: 1.7;
      font-weight: 300;
    `,
    overline: css`
      text-transform: uppercase;
      margin: 0.25rem 0;
      line-height: 1.7;
      font-weight: 300;
    `,
  };