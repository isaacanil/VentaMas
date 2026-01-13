import type { ReactNode } from 'react';
import type { ButtonProps } from 'antd';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

export type TreeNodeId = string | number;

export type TreeNodeDetail = {
  text: string;
  type?: string;
};

export type TreeNodeTheme = {
  label?: string;
  labelBackground?: string;
  labelColor?: string;
  accentColor?: string;
};

export type TreeStockSummary = {
  totalLots?: number;
  totalUnits?: number;
  directLots?: number;
  directUnits?: number;
};

export type TreeNodeData = {
  id: TreeNodeId;
  name?: string;
  children?: TreeNodeData[];
  productStock?: Array<{ productName?: string | null }>;
  matchedStockCount?: number;
  stockSummary?: TreeStockSummary | string | null;
  stockSummaryLoading?: boolean;
  theme?: TreeNodeTheme;
  extraDetails?: TreeNodeDetail[] | TreeNodeDetail | string | null;
  tooltipDetails?:
    | Array<string | number | { text?: string }>
    | string
    | number
    | null;
  isLoading?: boolean;
  [key: string]: unknown;
};

export type TreeActionItem<Node extends TreeNodeData = TreeNodeData> = {
  name: string;
  icon: IconProp;
  handler: (node: Node, level: number, path?: TreeNodeId[]) => void;
};

export type TreeAction<Node extends TreeNodeData = TreeNodeData> =
  | {
      name: string;
      type: 'button';
      icon: IconProp;
      handler: (node: Node, level: number, path?: TreeNodeId[]) => void;
      show?: (node: Node, level: number) => boolean;
    }
  | {
      name: string;
      type: 'dropdown';
      icon: IconProp;
      items:
        | TreeActionItem<Node>[]
        | ((node: Node, level: number, path?: TreeNodeId[]) => TreeActionItem<Node>[]);
      show?: (node: Node, level: number) => boolean;
    };

export type TreeHeaderActionContext = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  allExpanded: boolean;
  handleToggleAll: () => void;
};

export type TreeHeaderAction = {
  key?: string;
  icon?: ReactNode | ((context: TreeHeaderActionContext) => ReactNode);
  label?: ReactNode | ((context: TreeHeaderActionContext) => ReactNode);
  tooltip?: ReactNode | ((context: TreeHeaderActionContext) => ReactNode);
  render?: (context: TreeHeaderActionContext) => ReactNode;
  onClick?: (context: TreeHeaderActionContext) => void;
  type?: ButtonProps['type'];
  buttonProps?: ButtonProps & {
    onClick?: (event: React.MouseEvent<HTMLElement>, context: TreeHeaderActionContext) => void;
  };
};

export type TreeFooterPlacement = 'static' | 'sticky' | 'overlay';

export type TreeFooterContext<Node extends TreeNodeData = TreeNodeData> = {
  data: Node[];
  filteredData: Node[];
  visibleData: Node[];
  searchTerm: string;
  selectedNode: TreeNodeId | null;
  loading: boolean;
  config: TreeConfig<Node>;
};

export type TreeConfig<Node extends TreeNodeData = TreeNodeData> = {
  showAllOnSearch?: boolean;
  initialVisibleCount?: number;
  showToggleAllButton?: boolean;
  headerActions?: TreeHeaderAction[];
  footer?: ReactNode;
  renderFooter?: (context: TreeFooterContext<Node>) => ReactNode;
  searchPlaceholder?: string;
  showInitialVisibleInfoMessage?: boolean;
  footerPlacement?: TreeFooterPlacement;
  filterNodes?: (data: Node[], searchTerm: string, config: TreeConfig<Node>) => Node[];
  onNodeClick?: (node: Node, level?: number) => void;
  resolveNodeTheme?: (
    node: Node,
    context: { level: number; isSelected: boolean; isExpanded: boolean },
  ) => TreeNodeTheme | null;
  actions?: TreeAction<Node>[];
  showMatchedStockCount?: boolean;
  showLocationStockSummary?: boolean;
  disableStockSummaryDetails?: boolean;
  disableStockSummaryTooltip?: boolean;
  disabledNodes?: TreeNodeId[];
  [key: string]: unknown;
};
