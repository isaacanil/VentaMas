import {
  PlusOutlined,
  EditOutlined,
  MoreOutlined,
  CloseOutlined,
} from '@/constants/icons/antd';
import { Form, Input, Button, Drawer, Dropdown, Tooltip } from 'antd';
import type { FormItemProps, MenuProps, InputRef } from 'antd';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { normalizeText } from '@/utils/text';
import type { ProviderDataItem, ProviderInfo } from '@/utils/provider/types';
import { comprobantesOptions } from '@/modules/contacts/pages/Contact/Provider/components/CreateContact/constants';

const Wrapper = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 8px;
  height: 100%;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 0 1em;

  .search-container {
    flex: 1;
  }
`;

const ProvidersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  align-content: start;
  padding: 0 1em;
  overflow-y: auto;
`;

const ProviderCard = styled.div<{ $isSelected?: boolean }>`
  padding: 12px;
  cursor: pointer;
  background-color: ${(props) => (props.$isSelected ? '#e6f7ff' : 'white')};
  border: 1px solid ${(props) => (props.$isSelected ? '#1890ff' : '#e8e8e8')};
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .actions {
    padding: 4px;
    color: #8c8c8c;
    border-radius: 4px;

    &:hover {
      background-color: rgb(0 0 0 / 4%);
    }
  }

  .name {
    font-size: 14px;
    font-weight: 500;
    color: #262626;
  }

  .rnc {
    font-size: 12px;
    color: #8c8c8c;
  }
`;

const ProviderInfo = styled.div`
  padding: 0.4em 0.6em 0.6em;
  cursor: pointer;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #40a9ff;
  }

  &.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100px;
    color: #8c8c8c;
  }

  .provider-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .provider-name {
    font-size: 16px;
    font-weight: 500;
    color: #262626;
  }

  .provider-details {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1.3em;
    font-size: 14px;
    line-height: 1.1pc;
    color: #595959;
  }

  .detail-item {
    gap: 4px;
  }

  .detail-label {
    font-size: 12px;
    color: #40a9ff;
  }
`;

interface ProviderSelectorProps {
  providers?: ProviderDataItem[];
  selectedProvider?: ProviderInfo | null;
  onSelectProvider?: (provider: ProviderInfo | null) => void;
  onAddProvider?: () => void;
  onEditProvider?: (provider: ProviderInfo) => void;
  validateStatus?: FormItemProps['validateStatus'];
  help?: FormItemProps['help'];
}

const ProviderSelector = ({
  providers = [],
  selectedProvider,
  onSelectProvider,
  onAddProvider,
  onEditProvider,
  validateStatus,
  help,
}: ProviderSelectorProps) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<InputRef | null>(null);

  useEffect(() => {
    if (visible && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  const filteredProviders = search
    ? providers.filter(({ provider }) =>
      normalizeText(provider.name || '').includes(normalizeText(search)) ||
        normalizeText(provider.rnc || '').includes(normalizeText(search)),
    )
    : providers;

  const handleProviderSelect = (providerData: ProviderDataItem) => {
    onSelectProvider?.(providerData.provider);
    setVisible(false);
    setSearch('');
  };

  const handleAddProvider = () => {
    onAddProvider?.();
  };

  const handleCardClick = (
    event: React.MouseEvent<HTMLDivElement>,
    providerData: ProviderDataItem,
  ) => {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.dropdown-container')) {
      handleProviderSelect(providerData);
    }
  };

  const openModalUpdateMode = (provider: ProviderInfo) => {
    onEditProvider?.(provider);
    setVisible(false);
  };

  const getMenuItems = (provider: ProviderInfo): MenuProps['items'] => [
    {
      key: 'edit',
      label: 'Editar',
      icon: <EditOutlined />,
      onClick: () => openModalUpdateMode(provider),
    },
  ];

  const handleClearProvider = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onSelectProvider?.(null);
  };

  const selectedVoucherType = comprobantesOptions.find(
    (voucherType) => voucherType?.value === selectedProvider?.voucherType,
  )?.label;

  return (
    <Form.Item required validateStatus={validateStatus} help={help}>
      <ProviderInfo
        className={!selectedProvider ? 'empty' : ''}
        onClick={() => setVisible(true)}
      >
        {!selectedProvider ? (
          <div>
            <PlusOutlined style={{ marginRight: 8 }} />
            Seleccionar Proveedor
          </div>
        ) : (
          <>
            <div className="provider-header">
              <span className="provider-name">{selectedProvider.name}</span>
              <CloseOutlined
                onClick={handleClearProvider}
                style={{ cursor: 'pointer', color: '#8c8c8c' }}
              />
            </div>
            <div className="provider-details">
              <div className="detail-item">
                <div className="detail-label">RNC:</div>
                {selectedProvider.rnc || 'N/A'}
              </div>
              <div className="detail-item">
                <div className="detail-label">Tipo de Comprobante:</div>
                {selectedVoucherType || 'N/A'}
              </div>
            </div>
          </>
        )}
      </ProviderInfo>

      <Drawer
        title="Lista de Proveedores"
        placement="bottom"
        onClose={() => setVisible(false)}
        open={visible}
        height={'80%'}
        styles={{
          body: { padding: '1em' },
        }}
      >
        <Wrapper>
          <Header>
            <div className="search-container">
              <Input
                ref={searchInputRef}
                placeholder="Buscar proveedores..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Tooltip title="Agregar proveedor">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddProvider}
              >
                Proveedor
              </Button>
            </Tooltip>
          </Header>
          <ProvidersContainer>
            {filteredProviders.map((providerData) => (
              <ProviderCard
                key={providerData.provider.id}
                onClick={(event) => handleCardClick(event, providerData)}
                $isSelected={selectedProvider?.id === providerData.provider.id}
              >
                <div className="card-header">
                  <div className="name">{providerData.provider.name}</div>
                  <div
                    className="dropdown-container"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Dropdown
                      menu={{ items: getMenuItems(providerData.provider) }}
                      trigger={['click']}
                    >
                      <Button
                        type="text"
                        className="actions"
                        icon={<MoreOutlined />}
                      />
                    </Dropdown>
                  </div>
                </div>
                <div className="rnc">
                  RNC: {providerData.provider.rnc || 'N/A'}
                </div>
              </ProviderCard>
            ))}
          </ProvidersContainer>
        </Wrapper>
      </Drawer>
    </Form.Item>
  );
};

export default ProviderSelector;
