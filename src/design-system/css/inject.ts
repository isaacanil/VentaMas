import { semantic } from '../tokens/semantic';
import { typography } from '../tokens/typography';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { scrollbar } from '../tokens/scrollbar';
import { zIndex } from '../tokens/zIndex';

type NestedRecord = { readonly [k: string]: string | NestedRecord };

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function flattenTokens(
  obj: NestedRecord,
  prefix: string,
): Array<[string, string]> {
  const entries: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(obj)) {
    const cssKey = `${prefix}-${camelToKebab(key)}`;
    if (typeof value === 'string') {
      entries.push([cssKey, value]);
    } else {
      entries.push(...flattenTokens(value, cssKey));
    }
  }

  return entries;
}

function buildCSSVariables(): string {
  const vars: Array<[string, string]> = [];

  // Semantic colors → --ds-color-*
  vars.push(...flattenTokens(semantic.color as unknown as NestedRecord, '--ds-color'));

  // Typography → --ds-font-*
  vars.push(
    ...flattenTokens(typography.fontFamily as unknown as NestedRecord, '--ds-font-family'),
  );
  vars.push(
    ...flattenTokens(typography.fontSize as unknown as NestedRecord, '--ds-font-size'),
  );
  vars.push(
    ...flattenTokens(typography.fontWeight as unknown as NestedRecord, '--ds-font-weight'),
  );
  vars.push(
    ...flattenTokens(typography.lineHeight as unknown as NestedRecord, '--ds-line-height'),
  );
  vars.push(
    ...flattenTokens(
      typography.letterSpacing as unknown as NestedRecord,
      '--ds-letter-spacing',
    ),
  );
  vars.push(
    ...flattenTokens(typography.typeScale as unknown as NestedRecord, '--ds-type-scale'),
  );

  // Spacing → --ds-space-*
  vars.push(...flattenTokens(spacing as unknown as NestedRecord, '--ds-space'));

  // Radius → --ds-radius-*
  vars.push(...flattenTokens(radius as unknown as NestedRecord, '--ds-radius'));

  // Shadows → --ds-shadow-*
  vars.push(...flattenTokens(shadows as unknown as NestedRecord, '--ds-shadow'));

  // Scrollbar → --ds-scrollbar-*
  vars.push(...flattenTokens(scrollbar as unknown as NestedRecord, '--ds-scrollbar'));

  // zIndex → --ds-z-*
  vars.push(...flattenTokens(zIndex as unknown as NestedRecord, '--ds-z'));

  return vars.map(([key, value]) => `${key}:${value}`).join(';');
}

let injected = false;

export function injectTokens(): void {
  if (injected) return;
  injected = true;

  const style = document.createElement('style');
  style.setAttribute('data-ds', 'tokens');
  style.textContent = `:root{${buildCSSVariables()}}`;
  document.head.appendChild(style);
}
