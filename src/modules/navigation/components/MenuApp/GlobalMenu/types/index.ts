import type { ComponentType, LazyExoticComponent } from 'react';
import type { PathPattern } from 'react-router-dom';

export type ToolbarSide = 'left' | 'right';

export type ToolbarComponentProps = {
  side: ToolbarSide;
} & Record<string, unknown>;

export type ToolbarLoader = () => Promise<{
  default: ComponentType<ToolbarComponentProps>;
}>;

export type ToolbarComponent = LazyExoticComponent<
  ComponentType<ToolbarComponentProps>
>;

export interface ToolbarModule {
  default?: unknown;
  [exportName: string]: unknown;
}

export type ToolbarImportFn = () => Promise<ToolbarModule>;

export type MatchConfig = string | PathPattern;

export type MatchArray = MatchConfig | MatchConfig[];

export interface RegisterToolbarArgs {
  id: string;
  routes: MatchArray;
  importFn: ToolbarImportFn;
  exportName?: string;
}

export interface ToolbarRegistryEntry {
  id: string;
  matches: PathPattern[];
  loader: ToolbarLoader;
}

export interface ToolbarEntryWithMatchers extends ToolbarRegistryEntry {
  matchers: ((pathname: string) => boolean)[];
  Component: ToolbarComponent;
}
