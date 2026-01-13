import type { ComponentType } from 'react';
import type { TreeConfig, TreeNodeData, TreeNodeId, TreeFooterPlacement } from './types';

export type { TreeConfig, TreeNodeData, TreeNodeId, TreeFooterPlacement } from './types';

export interface TreeProps {
  data?: TreeNodeData[];
  config?: TreeConfig<TreeNodeData>;
  selectedId?: TreeNodeId | null;
  loading?: boolean;
  loadingText?: string;
}

declare const Tree: ComponentType<TreeProps>;
export default Tree;
