export type WarehouseTreePathNode<Node> = {
  id: string;
  name?: string;
  children?: Node[];
};

export type WarehouseFormPathNode = {
  id: string;
  name?: string;
};

const EMPTY_NODE_PATH: never[] = [];
const EMPTY_LOCATION_PATH: never[] = [];

export const findWarehouseNodePath = <
  Node extends WarehouseTreePathNode<Node>,
>(
  nodes: readonly Node[] | null | undefined,
  targetId: string,
  path: readonly Node[] = EMPTY_NODE_PATH,
): Node[] | null => {
  if (!nodes?.length) {
    return null;
  }

  for (const node of nodes) {
    const currentPath = [...path, node];
    if (node.id === targetId) {
      return currentPath;
    }

    const childPath = findWarehouseNodePath(
      node.children,
      targetId,
      currentPath,
    );
    if (childPath) {
      return childPath;
    }
  }

  return null;
};

export const collectWarehouseLocationPaths = <
  Node extends WarehouseTreePathNode<Node>,
>(
  nodes: readonly Node[] | null | undefined,
  parentPath: readonly string[] = EMPTY_LOCATION_PATH,
): string[] => {
  if (!nodes?.length) {
    return [];
  }

  const paths: string[] = [];

  for (const node of nodes) {
    const currentPath = [...parentPath, node.id];
    paths.push(currentPath.join('/'));

    if (node.children?.length) {
      paths.push(...collectWarehouseLocationPaths(node.children, currentPath));
    }
  }

  return paths;
};

export const toWarehouseFormPath = <Node extends WarehouseFormPathNode>(
  path: readonly Node[] | null | undefined,
): WarehouseFormPathNode[] =>
  (path ?? []).map((pathNode) => ({
    id: pathNode.id,
    name: pathNode.name,
  }));

export const buildWarehouseLocationPath = <Node extends { id: string }>(
  path: readonly Node[] | null | undefined,
): string => (path ?? []).map((pathNode) => pathNode.id).join('/');
