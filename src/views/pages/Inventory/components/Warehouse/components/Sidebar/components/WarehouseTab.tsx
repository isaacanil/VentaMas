import { PlusOutlined } from '@ant-design/icons';
import { Tree, Button, Tooltip } from 'antd';
import { AnimatePresence } from 'framer-motion';
import { useState, useMemo, useCallback, memo, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { useTransformedWarehouseData } from '@/firebase/warehouse/warehouseNestedServise';
import RowForm from '@/views/pages/Inventory/components/Warehouse/forms/RowShelfForm/RowShelfForm';
import SegmentForm from '@/views/pages/Inventory/components/Warehouse/forms/SegmentForm/SegmentForm';
import { ShelfForm } from '@/views/pages/Inventory/components/Warehouse/forms/ShelfForm/ShelfForm';
import { WarehouseForm } from '@/views/pages/Inventory/components/Warehouse/forms/WarehouseForm/WarehouseForm';

const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  padding: 16px;
`;

const TreeContainer = styled.div`
  flex: 1;
  overflow-y: auto;

  .ant-tree {
    background: transparent;
  }

  .ant-tree-treenode {
    padding: 4px 0;

    &:hover {
      background: rgb(0 0 0 / 4%);
    }
  }

  .ant-tree-node-content-wrapper {
    flex: 1;
  }
`;

const ActionButton = styled(Button)`
  width: 100%;
`;

type WarehouseTreeNode = {
  id: string;
  name?: string;
  type?: string;
  children?: WarehouseTreeNode[];
} & Record<string, unknown>;

type TreeNode = {
  title: ReactNode;
  key: string;
  children?: TreeNode[];
};

const WarehouseTab = memo(() => {
  const navigate = useNavigate();
  const { warehouseId, shelfId, rowId, segmentId } = useParams<{
    warehouseId?: string;
    shelfId?: string;
    rowId?: string;
    segmentId?: string;
  }>();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isWarehouseFormVisible, setIsWarehouseFormVisible] = useState(false);
  const [isShelfFormVisible, setIsShelfFormVisible] = useState(false);
  const [isRowFormVisible, setIsRowFormVisible] = useState(false);
  const [isSegmentFormVisible, setIsSegmentFormVisible] = useState(false);

  const { data: warehouseData } = useTransformedWarehouseData();

  const treeData = useMemo<TreeNode[]>(() => {
    const buildTree = (nodes: WarehouseTreeNode[]): TreeNode[] => {
      if (!Array.isArray(nodes)) return [];

      return nodes.map((node) => {
        const treeNode: TreeNode = {
          title: node.name ?? 'Sin nombre',
          key: `${node.type ?? 'node'}-${node.id}`,
        };

        if (node.children && node.children.length > 0) {
          treeNode.children = buildTree(node.children);
        }

        return treeNode;
      });
    };

    return buildTree((warehouseData || []) as WarehouseTreeNode[]);
  }, [warehouseData]);

  const handleSelect = useCallback(
    (keys: Array<string | number>) => {
      const nextKeys = keys.map((key) => String(key));
      const [type, id] = nextKeys[0]?.split('-') || [];
      let path = '/inventory/warehouses';

      if (type === 'warehouse') {
        path += `/warehouse/${id}`;
        if (shelfId) {
          path += `/shelf/${shelfId}`;
          if (rowId) {
            path += `/row/${rowId}`;
            if (segmentId) {
              path += `/segment/${segmentId}`;
            }
          }
        }
      } else if (type === 'shelf') {
        path += `/warehouse/${warehouseId}/shelf/${id}`;
        if (rowId) {
          path += `/row/${rowId}`;
          if (segmentId) {
            path += `/segment/${segmentId}`;
          }
        }
      } else if (type === 'row') {
        path += `/warehouse/${warehouseId}/shelf/${shelfId}/row/${id}`;
        if (segmentId) {
          path += `/segment/${segmentId}`;
        }
      } else if (type === 'segment') {
        path += `/warehouse/${warehouseId}/shelf/${shelfId}/row/${rowId}/segment/${id}`;
      }

      navigate(path);
      setSelectedKeys(nextKeys);
    },
    [navigate, warehouseId, shelfId, rowId, segmentId],
  );

  return (
    <TabContent>
      <ActionButton
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => setIsWarehouseFormVisible(true)}
      >
        Agregar Almacén
      </ActionButton>

      <TreeContainer>
        <Tree
          treeData={treeData}
          selectedKeys={selectedKeys}
          onSelect={handleSelect}
          showLine={{ showLeafIcon: false }}
        />
      </TreeContainer>

      <AnimatePresence>
        {isWarehouseFormVisible && (
          <WarehouseForm
            visible={isWarehouseFormVisible}
            onClose={() => setIsWarehouseFormVisible(false)}
          />
        )}
        {isShelfFormVisible && (
          <ShelfForm
            visible={isShelfFormVisible}
            onClose={() => setIsShelfFormVisible(false)}
            warehouseId={warehouseId}
          />
        )}
        {isRowFormVisible && (
          <RowForm
            visible={isRowFormVisible}
            onClose={() => setIsRowFormVisible(false)}
            shelfId={shelfId}
          />
        )}
        {isSegmentFormVisible && (
          <SegmentForm
            visible={isSegmentFormVisible}
            onClose={() => setIsSegmentFormVisible(false)}
            rowId={rowId}
          />
        )}
      </AnimatePresence>

      {warehouseId && (
        <Tooltip title="Agregar Estante">
          <ActionButton
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => setIsShelfFormVisible(true)}
          >
            Agregar Estante
          </ActionButton>
        </Tooltip>
      )}

      {shelfId && (
        <Tooltip title="Agregar Fila">
          <ActionButton
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => setIsRowFormVisible(true)}
          >
            Agregar Fila
          </ActionButton>
        </Tooltip>
      )}

      {rowId && (
        <Tooltip title="Agregar Segmento">
          <ActionButton
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => setIsSegmentFormVisible(true)}
          >
            Agregar Segmento
          </ActionButton>
        </Tooltip>
      )}
    </TabContent>
  );
});

WarehouseTab.displayName = 'WarehouseTab';

export default WarehouseTab;
