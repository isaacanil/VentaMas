import { FileTextOutlined, CloseOutlined } from '@ant-design/icons';
import { Input, Drawer, Tag, Pagination } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { DatePicker } from '../../../../../components/common/DatePicker/DatePicker';
import DateUtils from '../../../../../utils/date/dateUtils';
import { formatPrice } from '../../../../../utils/formatPrice';
import { normalizeText } from '../../../../../utils/text';

/*
  Selector de Facturas
  --------------------
  Permite seleccionar la factura asociada. Uso similar a ClientSelector.
*/

const Wrapper = styled.div`
  height: 100%;
  display: grid;
  /* Header | List | Footer */
  grid-template-rows: min-content 1fr min-content;
  gap: 8px;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 0 1em;

  .search-container {
    width: 280px;
    max-width: 100%;
  }
`;

const InvoicesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  padding: 0 1em 1.5em;
  overflow-y: auto;
  align-content: start;
`;

const InvoiceCard = styled.div`
  background-color: ${({ $isSelected }) => ($isSelected ? '#F0F5FF' : '#fff')};
  border: 1px solid
    ${({ $isSelected }) => ($isSelected ? '#1890ff' : '#d9d9d9')};
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .number {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .date {
    font-size: 12px;
    color: #8c8c8c;
  }

  .details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    font-size: 12px;
    color: #595959;
  }

  .detail-label {
    font-size: 11px;
    color: #8c8c8c;
  }

  .ncf {
    font-family: monospace;
  }

  .total {
    font-weight: 600;
    color: #262626;
  }
`;

const InvoiceInfo = styled.div`
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  background: #fff;
  transition: border-color 0.2s;
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};

  &:hover {
    border-color: ${({ $disabled }) => ($disabled ? '#d9d9d9' : '#1890ff')};
  }

  &.empty {
    justify-content: center;
    align-items: center;
    color: #8c8c8c;
    min-height: 64px;
  }

  .invoice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .invoice-number {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .invoice-details {
    display: grid;
    grid-template-columns: auto 1fr auto 1fr;
    gap: 6px 16px;
    font-size: 13px;
    color: #595959;

    .detail-label {
      font-size: 11px;
      color: #8c8c8c;
    }
  }

  .ncf-value {
    font-family: monospace;
  }
`;

const SelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.span`
  font-size: 12px;
  color: #8c8c8c;
`;

const PaginationFooter = styled.div`
  display: flex;
  justify-content: center;
  padding: 0.75rem 0 0.25rem;
  border-top: 1px solid #f0f0f0;
`;

const InvoiceSelector = ({
  invoices = [],
  selectedInvoice,
  onSelectInvoice,
  loading = false,
  disabled = false,
  label = 'Factura',
  dateRange,
  onDateRangeChange,
}) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const searchRef = useRef(null);

  useEffect(() => {
    if (visible && searchRef.current) {
      setTimeout(() => searchRef.current.focus(), 120);
    }
  }, [visible]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, visible]);

  const filteredInvoices = search
    ? invoices.filter((inv) =>
        [inv.numberID?.toString(), inv.ncf, inv.NCF]
          .filter(Boolean)
          .some((field) =>
            normalizeText(field).includes(normalizeText(search)),
          ),
      )
    : invoices;

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const openDrawer = () => {
    if (!disabled) setVisible(true);
  };

  const handleDateRangeChange = (range) => {
    const finalRange =
      !range || !range[0]
        ? [dayjs().startOf('month'), dayjs().endOf('month')]
        : range;
    onDateRangeChange?.(finalRange);
  };

  const closeDrawer = () => setVisible(false);

  const handleSelect = (invoice) => {
    onSelectInvoice?.(invoice);
    closeDrawer();
    setSearch('');
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onSelectInvoice?.(null);
  };

  return (
    <SelectorContainer>
      <Label>{label}</Label>
      <InvoiceInfo
        onClick={openDrawer}
        className={!selectedInvoice ? 'empty' : ''}
        $disabled={disabled}
      >
        {!selectedInvoice ? (
          <>
            <FileTextOutlined style={{ marginRight: 8 }} /> Seleccionar Factura
          </>
        ) : (
          <>
            <div className="invoice-header">
              <span className="invoice-number">
                <FileTextOutlined /> #{selectedInvoice.numberID}
              </span>
              {!disabled && (
                <CloseOutlined
                  style={{ color: '#8c8c8c' }}
                  onClick={clearSelection}
                />
              )}
            </div>

            <div className="invoice-details">
              <span className="detail-label">Fecha:</span>
              <span>
                {selectedInvoice.date
                  ? DateUtils.formatLuxonDate(selectedInvoice.date)
                  : 'N/A'}
              </span>
              <span className="detail-label">NCF:</span>
              <span className="ncf-value">
                {selectedInvoice.ncf || selectedInvoice.NCF || 'N/A'}
              </span>
              <span className="detail-label">Total:</span>
              <span>
                {formatPrice(selectedInvoice.totalPurchase?.value || 0)}
              </span>
            </div>
          </>
        )}
      </InvoiceInfo>

      <Drawer
        title="Seleccionar Factura"
        placement="bottom"
        open={visible}
        onClose={closeDrawer}
        height="100%"
        styles={{ body: { padding: '1em' } }}
      >
        <Wrapper>
          <Header>
            <div className="search-container">
              <Input
                placeholder="Buscar factura..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
                ref={searchRef}
                loading={loading}
              />
            </div>
            <div style={{ width: '220px' }}>
              <DatePicker
                mode="range"
                value={dateRange}
                onChange={handleDateRangeChange}
                placeholder="Rango fechas"
                size="middle"
              />
            </div>
          </Header>

          <InvoicesContainer>
            {paginatedInvoices.map((inv) => (
              <InvoiceCard
                key={inv.id}
                onClick={() => handleSelect(inv)}
                $isSelected={selectedInvoice?.id === inv.id}
              >
                <div className="header">
                  <span className="number">
                    <FileTextOutlined /> #{inv.numberID}
                  </span>
                  <span className="date">
                    {inv.date
                      ? DateUtils.formatLuxonDate(inv.date)
                      : 'Sin fecha'}
                  </span>
                </div>

                <div className="details">
                  <div>
                    <span className="detail-label">NCF:</span>{' '}
                    <span className="ncf">{inv.ncf || inv.NCF || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="detail-label">Total:</span>{' '}
                    <span className="total">
                      {formatPrice(inv.totalPurchase?.value || 0)}
                    </span>
                  </div>
                </div>

                <Tag color="blue" style={{ marginTop: 8 }}>
                  {inv.products?.length || 0} productos
                </Tag>
              </InvoiceCard>
            ))}

            {filteredInvoices.length === 0 && !loading && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  color: '#8c8c8c',
                  padding: '1rem',
                }}
              >
                {search
                  ? 'No se encontraron facturas'
                  : 'No hay facturas disponibles'}
              </div>
            )}

            {/* Pagination se movió abajo */}
          </InvoicesContainer>

          {/* Footer Pagination */}
          {filteredInvoices.length > pageSize && (
            <PaginationFooter>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredInvoices.length}
                onChange={(page) => setCurrentPage(page)}
                size="small"
                showSizeChanger={false}
              />
            </PaginationFooter>
          )}
        </Wrapper>
      </Drawer>
    </SelectorContainer>
  );
};

export default InvoiceSelector;
