import type { ComponentType } from 'react'
import type { PathPattern } from 'react-router-dom'

export type ToolbarSide = 'left' | 'right'

export type ToolbarComponentProps = { side: ToolbarSide } & Record<string, unknown>

export type ToolbarComponent = ComponentType<ToolbarComponentProps>

export type ToolbarModule = {
  default?: unknown
  [exportName: string]: unknown
}

export type ToolbarImportFn = () => Promise<ToolbarModule>

export type ToolbarLoader = () => Promise<{ default: ToolbarComponent }>

export type MatchConfig = string | PathPattern

export type MatchArray = MatchConfig | MatchConfig[]

export interface RegisterToolbarArgs {
  id: string
  routes: MatchArray
  importFn: ToolbarImportFn
  exportName?: string
}

export interface ToolbarRegistryEntry {
  id: string
  matches: PathPattern[]
  loader: ToolbarLoader
}

export interface ToolbarEntryWithMatchers extends ToolbarRegistryEntry {
  matchers: Array<(pathname: string) => boolean>
}
