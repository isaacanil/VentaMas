import {
  faBoxOpen,
  faBoxesStacked,
  faCircleInfo,
  faTimes,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal, Button, Tooltip } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

import { getTotalPrice } from '@/utils/pricing';

import {
  getCategoryName,
  getPrimaryActiveIngredient,
  getCategoryStats,
} from './productDataUtils';
import { ProductFilterToolbar } from './ProductFilterToolbar';
import { StyledProductTable } from './ProductTables.styles';


const totalPrice = (product) => getTotalPrice(product);

export const ProductListModal = ({
  isVisible,
  onClose,
  products,
  onAddProduct,
  isReadOnly = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (isReadOnly && isVisible) {
      onClose();
    }
  }, [isReadOnly, isVisible, onClose]);

  const sortOptions = useMemo(
    () => [
      { label: 'Producto', value: 'name' },
      { label: 'Precio', value: 'price' },
      { label: 'Stock', value: 'stock' },
    ],
    [],
  );

  const categoryStats = useMemo(() => getCategoryStats(products), [products]);

  const safeCategoryFilter = useMemo(() => {
    if (categoryFilter === 'all') return 'all';
    const hasSelectedCategory = categoryStats.entries.some(
      (entry) => entry.name === categoryFilter,
    );
    return hasSelectedCategory ? categoryFilter : 'all';
  }, [categoryFilter, categoryStats]);

  const displayProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filteredBySearch = normalizedSearch
      ? list.filter((product) => {
          const name = product?.name?.toLowerCase() ?? '';
          return name.includes(normalizedSearch);
        })
      : [...list];

    const filtered =
      safeCategoryFilter === 'all'
        ? filteredBySearch
        : filteredBySearch.filter(
            (product) =>
              getCategoryName(product?.category) === safeCategoryFilter,
          );

    const directionMultiplier = sortDirection === 'desc' ? -1 : 1;

    const sorted = [...filtered].sort((a, b) => {
      switch (sortField) {
        case 'price':
          return (getTotalPrice(a) - getTotalPrice(b)) * directionMultiplier;
        case 'stock':
          return ((a?.stock ?? 0) - (b?.stock ?? 0)) * directionMultiplier;
        case 'name':
        default:
          return (
            (a?.name ?? '').localeCompare(b?.name ?? '') * directionMultiplier
          );
      }
    });

    return sorted;
  }, [products, searchTerm, safeCategoryFilter, sortField, sortDirection]);

  const columns = [
    {
      title: 'Producto',
      dataIndex: ['name'],
      key: 'name',
      width: 360,
      ellipsis: true,
      sorter: (a, b) => (a?.name ?? '').localeCompare(b?.name ?? ''),
      render: (text, record) => {
        const category = getCategoryName(record?.category);
        const activeIngredient = getPrimaryActiveIngredient(
          record?.activeIngredients,
        );
        const hasMeta = Boolean(category || activeIngredient);

        return (
          <ProductName>
            <ProductPrimaryText title={record.name}>
              {record.name}
            </ProductPrimaryText>
            {hasMeta && (
              <ProductMeta>
                {category ? (
                  <CategoryPill title={category}>{category}</CategoryPill>
                ) : null}
                {activeIngredient ? (
                  <ActiveIngredientPill title={activeIngredient}>
                    {activeIngredient}
                  </ActiveIngredientPill>
                ) : null}
              </ProductMeta>
            )}
          </ProductName>
        );
      },
    },
    {
      title: 'Stock',
      dataIndex: ['stock'],
      key: 'stock',
      width: 120,
      sorter: (a, b) => (a?.stock ?? 0) - (b?.stock ?? 0),
      render: (_, record) => {
        const stockValue = Number(record?.stock ?? 0);
        return <StockBadge $isLow={stockValue <= 0}>{stockValue}</StockBadge>;
      },
    },
    {
      title: 'Precio Unitario',
      dataIndex: ['pricing', 'price'],
      key: 'price',
      width: 160,
      align: 'right',
      sorter: (a, b) => getTotalPrice(a) - getTotalPrice(b),
      render: (text, record) => formatPrice(totalPrice(record)),
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Tooltip title={isReadOnly ? 'Edición deshabilitada' : 'Agregar'}>
          <ActionButton
            type="button"
            onClick={() => {
              if (isReadOnly) return;
              onAddProduct(record);
            }}
            aria-label={`Agregar ${record.name}`}
            disabled={isReadOnly}
          >
            <ActionIcon icon={faPlus} />
          </ActionButton>
        </Tooltip>
      ),
    },
  ];

  const paginationConfig = {
    pageSize: 15,
    position: ['bottomCenter'],
    showSizeChanger: false,
  };

  return (
    <StyledModal
      title={null}
      open={isVisible && !isReadOnly}
      onCancel={onClose}
      footer={null}
      width={860}
    >
      <ModalContent>
        <Header>
          <TitleGroup>
            <HeaderIcon icon={faBoxOpen} />
            <HeaderText>
              <Title>Agregar Producto a la Factura</Title>
            </HeaderText>
          </TitleGroup>
        </Header>

        <ProductFilterToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar producto"
          categoryFilter={safeCategoryFilter}
          onCategoryChange={setCategoryFilter}
          categoryStats={categoryStats}
          sortField={sortField}
          sortOptions={sortOptions}
          onSortFieldChange={setSortField}
          sortDirection={sortDirection}
          onToggleSortDirection={() =>
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
          }
        />

        <StyledProductTable
          dataSource={displayProducts}
          columns={columns}
          pagination={paginationConfig}
          rowKey="id"
          scroll={{ y: 400 }}
        />

        <SummaryRow>
          <SummaryChip>
            <SummaryIcon icon={faBoxesStacked} />
            {displayProducts.length} productos
          </SummaryChip>
        </SummaryRow>

        <ModalFooter>
          <FooterNote>
            <NoteIcon icon={faCircleInfo} />
            Los precios reflejan los impuestos configurados en tu catálogo.
          </FooterNote>
          <CloseButton onClick={onClose}>
            <CloseIcon icon={faTimes} />
            Cerrar
          </CloseButton>
        </ModalFooter>
      </ModalContent>
    </StyledModal>
  );
};

const StyledModal = styled(Modal)`
  top: 10px;

  .ant-modal-content {
    padding: 0;
    overflow: hidden;
    border-radius: 18px;
    box-shadow: 0 26px 60px rgb(15 23 42 / 18%);
  }

  .ant-modal-body {
    padding: 28px;
    background: #f9fafb;
  }
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1em;
`;

const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  justify-content: space-between;
`;

const TitleGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const HeaderIcon = styled(FontAwesomeIcon)`
  padding: 12px;
  font-size: 32px;
  color: #1d4ed8;
  background: rgb(29 78 216 / 12%);
  border-radius: 16px;
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
`;

const SummaryChip = styled.div`
  display: inline-flex;
  gap: 10px;
  align-items: center;
  padding: 10px 18px;
  font-weight: 600;
  color: #0c4a6e;
  background: #e0f2fe;
  border-radius: 999px;
`;

const SummaryIcon = styled(FontAwesomeIcon)`
  font-size: 18px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ProductName = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  max-width: 100%;
  font-weight: 600;
  color: #1f2937;
`;

const ProductPrimaryText = styled.span`
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProductMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const MetaPill = styled.span`
  display: inline-flex;
  align-items: center;
  max-width: 200px;
  padding: 4px 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 999px;
`;

const CategoryPill = styled(MetaPill)`
  color: #3730a3;
  background: #eef2ff;
`;

const ActiveIngredientPill = styled(MetaPill)`
  color: #047857;
  background: #ecfdf5;
`;

const StockBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ $isLow }) => ($isLow ? '#991b1b' : '#047857')};
  background: ${({ $isLow }) => ($isLow ? '#fee2e2' : '#ecfdf5')};
  border-radius: 999px;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 0;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  background: #f3f4f6;
  border: none;
  border-radius: 999px;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  transition:
    background 0.2s ease,
    transform 0.2s ease;

  &:hover {
    ${(props) =>
      props.disabled
        ? ''
        : `
    background: #e5e7eb;
    transform: translateY(-1px);
    `}
  }

  &:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  &:active {
    ${(props) => (props.disabled ? '' : 'transform: translateY(0);')}
  }
`;

const ActionIcon = styled(FontAwesomeIcon)`
  font-size: 16px;
  color: #1f2937;
`;

const ModalFooter = styled.footer`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
`;

const FooterNote = styled.div`
  display: inline-flex;
  gap: 10px;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
`;

const NoteIcon = styled(FontAwesomeIcon)`
  font-size: 16px;
  color: #2563eb;
`;

const CloseButton = styled(Button)`
  && {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    font-weight: 600;
  }
`;

const CloseIcon = styled(FontAwesomeIcon)`
  font-size: 14px;
`;
