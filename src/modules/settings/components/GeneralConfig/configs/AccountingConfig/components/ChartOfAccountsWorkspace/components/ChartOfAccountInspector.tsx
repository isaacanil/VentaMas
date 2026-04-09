import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import styled from 'styled-components';

import { AppIcon } from '@/components/ui/AppIcon';
import type { ChartOfAccount } from '@/types/accounting';
import {
  CHART_OF_ACCOUNT_CURRENCY_MODE_LABELS,
  CHART_OF_ACCOUNT_NORMAL_SIDE_LABELS,
  CHART_OF_ACCOUNT_TYPE_LABELS,
  buildChartOfAccountLabel,
} from '@/utils/accounting/chartOfAccounts';

interface ChartOfAccountInspectorProps {
  account: ChartOfAccount | null;
  childAccounts: ChartOfAccount[];
  childCount: number;
  depth: number;
  loading: boolean;
  parentAccount: ChartOfAccount | null;
  path: ChartOfAccount[];
  onEditChartOfAccountClick: (account: ChartOfAccount) => void;
  onSelectAccount: (accountId: string) => void;
  onToggleChartOfAccountStatus: (
    chartOfAccountId: string,
    status: ChartOfAccount['status'],
  ) => void;
}

const getHierarchyLabel = (account: ChartOfAccount) => {
  if (!account.parentId) {
    return 'Cuenta raíz';
  }

  return account.postingAllowed ? 'Cuenta posteable' : 'Cuenta encabezado';
};

const getChildCountLabel = (childCount: number) =>
  childCount === 1 ? '1 subcuenta' : `${childCount} subcuentas`;

export const ChartOfAccountInspector = ({
  account,
  childAccounts,
  childCount,
  loading,
  parentAccount,
  path,
  onEditChartOfAccountClick,
  onSelectAccount,
  onToggleChartOfAccountStatus,
}: ChartOfAccountInspectorProps) => {
  if (!account) {
    return (
      <Panel>
        <EmptyState>
          <EmptyIcon>
            <AppIcon name="buildingColumns" tone="muted" sizeToken="lg" />
          </EmptyIcon>
          <EmptyTitle>Inspector de cuenta</EmptyTitle>
          <EmptyCopy>
            Selecciona una cuenta en el explorador para revisar sus datos
            contables antes de editarla.
          </EmptyCopy>
        </EmptyState>
      </Panel>
    );
  }

  const isActive = account.status === 'active';

  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'toggle-status',
      label: isActive ? 'Desactivar cuenta' : 'Activar cuenta',
      danger: isActive,
      onClick: () =>
        onToggleChartOfAccountStatus(
          account.id,
          isActive ? 'inactive' : 'active',
        ),
    },
  ];

  return (
    <Panel>
      <Header>
        <HeaderTop>
          <HeaderCopy>
            <Eyebrow>{account.code}</Eyebrow>
            <Title>{account.name}</Title>
            <Subtitle>{getHierarchyLabel(account)}</Subtitle>
            {!isActive ? (
              <StatusNotice>
                <AppIcon name="ban" sizeToken="xs" />
                Cuenta inactiva
              </StatusNotice>
            ) : null}
          </HeaderCopy>

          <HeaderActions>
            <Button
              disabled={loading}
              onClick={() => onEditChartOfAccountClick(account)}
            >
              Editar cuenta
            </Button>
            <Dropdown
              disabled={loading}
              menu={{ items: moreMenuItems }}
              trigger={['click']}
            >
              <Button
                aria-label="Más acciones"
                icon={<AppIcon name="ellipsisVertical" />}
              />
            </Dropdown>
          </HeaderActions>
        </HeaderTop>

        {path.length > 1 ? (
          <HeaderContext>
            <SectionHeading>
              <AppIcon name="codeBranch" sizeToken="sm" tone="muted" />
              <SectionLabel>Ubicación</SectionLabel>
            </SectionHeading>

            <PathList>
              {path.map((item, index) => (
                <PathCrumb key={item.id}>
                  {index > 0 && <PathSeparator>›</PathSeparator>}
                  <PathButton
                    type="button"
                    $isLast={index === path.length - 1}
                    onClick={() => onSelectAccount(item.id)}
                  >
                    {item.code} {item.name}
                  </PathButton>
                </PathCrumb>
              ))}
            </PathList>
          </HeaderContext>
        ) : null}
      </Header>

      <ScrollBody>
        <Section>
          <SectionHeader>
            <SectionHeading>
              <AppIcon name="circleInfo" sizeToken="sm" tone="muted" />
              <SectionLabel>Ficha contable</SectionLabel>
            </SectionHeading>
          </SectionHeader>

          <DefinitionGrid>
            <DefinitionItem>
              <DefinitionLabel>Tipo</DefinitionLabel>
              <DefinitionValue>
                {CHART_OF_ACCOUNT_TYPE_LABELS[account.type]}
              </DefinitionValue>
            </DefinitionItem>
            <DefinitionItem>
              <DefinitionLabel>Lado normal</DefinitionLabel>
              <DefinitionValue>
                {CHART_OF_ACCOUNT_NORMAL_SIDE_LABELS[account.normalSide]}
              </DefinitionValue>
            </DefinitionItem>
            <DefinitionItem>
              <DefinitionLabel>Moneda</DefinitionLabel>
              <DefinitionValue>
                {CHART_OF_ACCOUNT_CURRENCY_MODE_LABELS[account.currencyMode]}
              </DefinitionValue>
            </DefinitionItem>
            {account.subtype ? (
              <DefinitionItem>
                <DefinitionLabel>Subtipo</DefinitionLabel>
                <DefinitionValue>{account.subtype}</DefinitionValue>
              </DefinitionItem>
            ) : null}
          </DefinitionGrid>
        </Section>

        <Section>
          <SectionHeader>
            <SectionHeading>
              <AppIcon name="listUl" sizeToken="sm" tone="muted" />
              <SectionLabel>Relaciones</SectionLabel>
            </SectionHeading>
          </SectionHeader>

          <DefinitionGrid>
            <DefinitionItem>
              <DefinitionLabel>Cuenta superior</DefinitionLabel>
              {parentAccount ? (
                <DefinitionLinkButton
                  type="button"
                  onClick={() => onSelectAccount(parentAccount.id)}
                >
                  {buildChartOfAccountLabel(parentAccount)}
                </DefinitionLinkButton>
              ) : (
                <DefinitionValue>Sin cuenta superior</DefinitionValue>
              )}
            </DefinitionItem>
            <DefinitionItem>
              <DefinitionLabel>Subcuentas</DefinitionLabel>
              <DefinitionValue>{getChildCountLabel(childCount)}</DefinitionValue>
            </DefinitionItem>
          </DefinitionGrid>

          {childAccounts.length ? (
            <RelatedList>
              {childAccounts.map((childAccount) => (
                <RelatedButton
                  key={childAccount.id}
                  type="button"
                  onClick={() => onSelectAccount(childAccount.id)}
                >
                  <RelatedAccount>
                    <RelatedCode>{childAccount.code}</RelatedCode>
                    <RelatedName>{childAccount.name}</RelatedName>
                  </RelatedAccount>
                  <RelatedChevron>
                    <AppIcon name="chevronRight" sizeToken="xs" tone="muted" />
                  </RelatedChevron>
                </RelatedButton>
              ))}
            </RelatedList>
          ) : (
            <SecondaryCopy>Esta cuenta no tiene subcuentas vinculadas.</SecondaryCopy>
          )}
        </Section>

        {account.systemKey ? (
          <Section>
            <SectionHeader>
              <SectionHeading>
                <AppIcon name="key" sizeToken="sm" tone="muted" />
                <SectionLabel>Referencia interna</SectionLabel>
              </SectionHeading>
            </SectionHeader>

            <TechnicalNote>
              Esta clave se usa para mapeos internos del sistema. No afecta la
              lectura contable diaria.
            </TechnicalNote>

            <SystemKeyRow>
              <SystemKeyValue>{account.systemKey}</SystemKeyValue>
              <CopyButton
                disabled={loading}
                type="button"
                title="Copiar clave del sistema"
                onClick={() =>
                  void navigator.clipboard.writeText(account.systemKey ?? '')
                }
              >
                <AppIcon name="copy" sizeToken="xs" />
              </CopyButton>
            </SystemKeyRow>
          </Section>
        ) : null}
      </ScrollBody>
    </Panel>
  );
};

const Panel = styled.aside`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-subtle);
  background:
    linear-gradient(
      180deg,
      var(--ds-color-bg-surface) 0%,
      var(--ds-color-bg-subtle) 100%
    );
  flex-shrink: 0;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-3);

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const HeaderCopy = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--ds-space-1);
  min-width: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
  flex-shrink: 0;
`;

const Eyebrow = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  font-family: var(--ds-font-family-mono);
  font-variant-numeric: tabular-nums;
  color: var(--ds-color-text-secondary);
`;

const Title = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-xl);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const StatusNotice = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  width: fit-content;
  margin-top: var(--ds-space-1);
  padding: 6px var(--ds-space-3);
  border: 1px solid var(--ds-color-state-warning);
  border-radius: var(--ds-radius-pill);
  background: var(--ds-color-state-warning-subtle, var(--ds-color-bg-subtle));
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-state-warning);
`;

const HeaderContext = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding-top: var(--ds-space-1);
`;

const ScrollBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--ds-space-3);
  min-height: 0;
  overflow-y: auto;
  padding: var(--ds-space-3);
  background: var(--ds-color-bg-subtle);
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-bg-surface);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
`;

const SectionHeading = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  min-width: 0;
`;

const SectionLabel = styled.h4`
  margin: 0;
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--ds-letter-spacing-wide);
`;

const PathList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
`;

const PathCrumb = styled.span`
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
`;

const PathSeparator = styled.span`
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const PathButton = styled.button<{ $isLast?: boolean }>`
  padding: 0;
  border: 0;
  background: transparent;
  font-size: var(--ds-font-size-sm);
  font-weight: ${({ $isLast }) =>
    $isLast
      ? 'var(--ds-font-weight-semibold)'
      : 'var(--ds-font-weight-regular)'};
  color: ${({ $isLast }) =>
    $isLast ? 'inherit' : 'var(--ds-color-text-secondary)'};
  cursor: pointer;

  &:hover {
    color: var(--ds-color-action-primary);
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: 2px;
    border-radius: var(--ds-radius-sm);
  }
`;

const DefinitionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-2);

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const DefinitionItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  min-height: 68px;
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const DefinitionLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-regular);
  color: var(--ds-color-text-secondary);
`;

const DefinitionValue = styled.span`
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-normal);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text-primary);
`;

const DefinitionLinkButton = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-normal);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-action-primary);
  text-align: left;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: 2px;
    border-radius: var(--ds-radius-sm);
  }
`;

const TechnicalNote = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

const SystemKeyRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  min-width: 0;
`;

const SystemKeyValue = styled.code`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  padding: var(--ds-space-2) var(--ds-space-2);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);
  font-size: var(--ds-font-size-sm);
  font-family: var(--ds-font-family-mono);
  color: var(--ds-color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);
  color: var(--ds-color-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    border-color 0.12s ease,
    background 0.12s ease,
    color 0.12s ease;

  &:hover:not(:disabled) {
    color: var(--ds-color-action-primary);
    border-color: var(--ds-color-action-primary);
    background: var(--ds-color-action-primarySubtle);
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.65;
  }
`;

const RelatedList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
`;

const RelatedButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  width: 100%;
  min-height: 44px;
  padding: var(--ds-space-3);
  border: 0;
  border-bottom: 1px solid var(--ds-color-border-subtle);
  background: var(--ds-color-bg-surface);
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: var(--ds-color-interactive-hover-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: -2px;
  }
`;

const RelatedAccount = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  min-width: 0;
  flex: 1;
`;

const RelatedCode = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  font-family: var(--ds-font-family-mono);
  font-variant-numeric: tabular-nums;
  color: var(--ds-color-text-secondary);
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-sm);
  padding: 1px 6px;
  flex-shrink: 0;
`;

const RelatedName = styled.span`
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RelatedChevron = styled.span`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const EmptyState = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-6);
`;

const EmptyIcon = styled.span`
  display: inline-flex;
  align-items: center;
`;

const EmptyTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const EmptyCopy = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

const SecondaryCopy = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;
