export type ComponentContractStatus = 'ready' | 'legacy' | 'planned';

export type ComponentContractCategory =
  | 'action'
  | 'display'
  | 'feedback'
  | 'form'
  | 'layout'
  | 'navigation'
  | 'overlay';

export type ComponentPropKind =
  | 'array'
  | 'boolean'
  | 'callback'
  | 'enum'
  | 'node'
  | 'number'
  | 'object'
  | 'string';

export type TokenFamily =
  | 'border'
  | 'radius'
  | 'semantic.color'
  | 'shadow'
  | 'spacing'
  | 'typography'
  | 'zIndex';

export interface DesignTokenReference {
  family: TokenFamily;
  path: string;
  cssVar: `--ds-${string}`;
  role: string;
}

export interface ComponentPropContract {
  name: string;
  kind: ComponentPropKind;
  description: string;
  required?: boolean;
  values?: readonly string[];
}

export interface ComponentVariantContract {
  name: string;
  prop: string;
  values: readonly string[];
  defaultValue?: string;
}

export interface ComponentContract {
  id: string;
  displayName: string;
  importPath: string;
  namedExport?: string;
  category: ComponentContractCategory;
  status: ComponentContractStatus;
  description: string;
  sourcePath: string;
  tags: readonly string[];
  props: readonly ComponentPropContract[];
  variants?: readonly ComponentVariantContract[];
  states?: readonly string[];
  layoutRules?: readonly string[];
  examples?: readonly string[];
  antiExamples?: readonly string[];
  designTokens?: readonly DesignTokenReference[];
}

export interface UiSchemaNode {
  componentId: string;
  key: string;
  props?: Record<string, unknown>;
  children?: readonly UiSchemaNode[];
}

export interface UiPlan {
  id: string;
  recipeId: string;
  designSystemChecks: readonly string[];
  tree: readonly UiSchemaNode[];
}

export interface ScreenRecipeSlot {
  key: string;
  description: string;
  allowedComponents: readonly string[];
  required?: boolean;
  maxItems?: number;
}

export interface ScreenRecipe {
  id: string;
  displayName: string;
  description: string;
  layout: string;
  tags: readonly string[];
  requiredComponents: readonly string[];
  optionalComponents?: readonly string[];
  forbiddenComponents?: readonly string[];
  states: readonly string[];
  compositionRules: readonly string[];
  slots: readonly ScreenRecipeSlot[];
  examplePlan: UiPlan;
}

export interface TokenFamilySummary {
  family: TokenFamily;
  prefix: `--ds-${string}`;
  guidance: string;
  examples: readonly string[];
}

export interface IconPolicy {
  library: 'font-awesome';
  importSources: readonly string[];
  guidance: readonly string[];
  antiExamples: readonly string[];
}

export interface DesignSystemContextPack {
  version: string;
  generatedAt: string;
  iconPolicy: IconPolicy;
  generationWorkflow: readonly string[];
  rules: readonly string[];
  tokenFamilies: readonly TokenFamilySummary[];
  componentRegistry: readonly ComponentContract[];
  screenRecipes: readonly ScreenRecipe[];
}
