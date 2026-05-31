import { createGlobalStyle } from 'styled-components';

export const SearchHighlightStyles = createGlobalStyle`
  [data-config-section] {
    scroll-margin-top: 120px;
  }

  .config-search-highlight {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: 0;
    border-radius: 12px;
    box-shadow: var(--ds-shadow-focus);
    transition: box-shadow 0.25s ease;
  }
`;
