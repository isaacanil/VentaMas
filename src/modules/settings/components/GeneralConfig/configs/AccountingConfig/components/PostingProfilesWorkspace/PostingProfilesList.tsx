import { Button, Empty, Input, Select, Spin, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useDeferredValue, useMemo, useState } from 'react';
import styled from 'styled-components';

import type {
  AccountingModuleKey,
  AccountingPostingProfile,
  ChartOfAccount,
} from '@/types/accounting';
import {
  ACCOUNTING_EVENT_TYPE_LABELS,
  ACCOUNTING_MODULE_LABELS,
  getAccountingEventDefinition,
} from '@/utils/accounting/accountingEvents';
import {
  ACCOUNTING_POSTING_AMOUNT_SOURCE_LABELS,
  ACCOUNTING_POSTING_PAYMENT_TERM_LABELS,
  ACCOUNTING_POSTING_PROFILE_STATUS_LABELS,
  ACCOUNTING_POSTING_SETTLEMENT_KIND_LABELS,
  ACCOUNTING_POSTING_TAX_TREATMENT_LABELS,
  type AccountingPostingProfileDraft,
} from '@/utils/accounting/postingProfiles';

import { AddPostingProfileModal } from '../AddPostingProfileModal';

const { Search } = Input;

interface PostingProfilesListProps {
  chartOfAccounts: ChartOfAccount[];
  loading: boolean;
  onAddPostingProfile: (
    draft: Partial<AccountingPostingProfileDraft>,
  ) => Promise<boolean>;
  onSeedDefaultPostingProfiles: () => void;
  onUpdatePostingProfile: (
    postingProfileId: string,
    draft: Partial<AccountingPostingProfileDraft>,
  ) => Promise<boolean>;
  onUpdatePostingProfileStatus: (
    postingProfileId: string,
    status: AccountingPostingProfile['status'],
  ) => Promise<boolean>;
  postingProfiles: AccountingPostingProfile[];
  seeding: boolean;
}

const STATUS_FILTER_OPTIONS = [
  { label: 'Todos', value: 'all' },
  { label: 'Activos', value: 'active' },
  { label: 'Inactivos', value: 'inactive' },
] as const;

const MODULE_ORDER: AccountingModuleKey[] = [
  'sales',
  'purchases',
  'accounts_receivable',
  'accounts_payable',
  'expenses',
  'banking',
  'cash',
  'fx',
  'general_ledger',
  'tax',
];

const toDate = (value: AccountingPostingProfile['updatedAt']): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value) {
    const date = value.toDate();
    return date instanceof Date ? date : null;
  }
  return null;
};

const formatRelativeTime = (
  value: AccountingPostingProfile['updatedAt'],
): string => {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return 'sin fecha';

  const minutes = Math.max(
    1,
    Math.round((Date.now() - date.getTime()) / 60000),
  );
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.round(hours / 24);
  return `hace ${days} d`;
};

const buildProfileCode = (profile: AccountingPostingProfile): string =>
  `PF-${profile.priority.toString().padStart(3, '0')}`;

const buildProfileConditionsSummary = (
  profile: AccountingPostingProfile,
): string => {
  const conditions = profile.conditions ?? {};
  const summary: string[] = [];

  if (conditions.paymentTerm && conditions.paymentTerm !== 'any') {
    summary.push(
      ACCOUNTING_POSTING_PAYMENT_TERM_LABELS[conditions.paymentTerm],
    );
  }

  if (conditions.settlementKind && conditions.settlementKind !== 'any') {
    summary.push(
      ACCOUNTING_POSTING_SETTLEMENT_KIND_LABELS[conditions.settlementKind],
    );
  }

  if (conditions.taxTreatment && conditions.taxTreatment !== 'any') {
    summary.push(
      ACCOUNTING_POSTING_TAX_TREATMENT_LABELS[conditions.taxTreatment],
    );
  }

  return summary.length ? summary.join(' · ') : 'Sin filtros condicionales';
};

export const PostingProfilesList = ({
  chartOfAccounts,
  loading,
  onAddPostingProfile,
  onSeedDefaultPostingProfiles,
  onUpdatePostingProfile,
  onUpdatePostingProfileStatus,
  postingProfiles,
  seeding,
}: PostingProfilesListProps) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [editingProfile, setEditingProfile] =
    useState<AccountingPostingProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | AccountingPostingProfile['status']
  >('all');
  const [moduleFilter, setModuleFilter] = useState<'all' | AccountingModuleKey>(
    'all',
  );
  const deferredSearch = useDeferredValue(search);

  const activeProfiles = postingProfiles.filter(
    (profile) => profile.status === 'active',
  );
  const inactiveProfilesCount = postingProfiles.length - activeProfiles.length;
  const configuredLinesCount = postingProfiles.reduce(
    (total, profile) => total + profile.linesTemplate.length,
    0,
  );
  const connectedModuleKeys = Array.from(
    new Set(activeProfiles.map((profile) => profile.moduleKey)),
  );
  const moduleOptions = MODULE_ORDER.filter((moduleKey) =>
    postingProfiles.some((profile) => profile.moduleKey === moduleKey),
  );

  const filteredProfiles = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return postingProfiles
      .filter((profile) => {
        if (statusFilter !== 'all' && profile.status !== statusFilter) {
          return false;
        }

        if (moduleFilter !== 'all' && profile.moduleKey !== moduleFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          profile.name,
          profile.description ?? '',
          profile.moduleKey,
          profile.eventType,
          ACCOUNTING_EVENT_TYPE_LABELS[profile.eventType],
        ].some((value) => value.toLowerCase().includes(normalizedSearch));
      })
      .sort((left, right) => {
        if (left.status !== right.status) {
          return left.status === 'active' ? -1 : 1;
        }
        return (
          left.priority - right.priority || left.name.localeCompare(right.name)
        );
      });
  }, [deferredSearch, moduleFilter, postingProfiles, statusFilter]);

  const selectedProfile = useMemo(
    () =>
      filteredProfiles.find((profile) => profile.id === selectedProfileId) ??
      filteredProfiles[0] ??
      null,
    [filteredProfiles, selectedProfileId],
  );

  const selectedEventType =
    selectedProfile?.eventType ??
    postingProfiles[0]?.eventType ??
    'invoice.committed';

  const handleCreateProfile = () => {
    setEditingProfile(null);
    setIsModalOpen(true);
  };

  const handleEditProfile = (profile: AccountingPostingProfile) => {
    setSelectedProfileId(profile.id);
    setEditingProfile(profile);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingProfile(null);
    setIsModalOpen(false);
  };

  const handleSubmitProfile = async (
    draft: Partial<AccountingPostingProfileDraft>,
    postingProfileId?: string,
  ) => {
    const targetProfileId = postingProfileId ?? editingProfile?.id;
    const eventType =
      editingProfile?.eventType ?? draft.eventType ?? selectedEventType;
    const eventDefinition = getAccountingEventDefinition(eventType);
    const nextDraft = {
      ...draft,
      eventType,
      moduleKey: eventDefinition.moduleKey,
    };
    const saved = targetProfileId
      ? await onUpdatePostingProfile(targetProfileId, nextDraft)
      : await onAddPostingProfile(nextDraft);

    if (saved) {
      handleCloseModal();
    }

    return saved;
  };

  return (
    <Workspace>
      <HeaderBar>
        <HeaderCopy>
          <Title>Perfiles contables</Title>
          <Subtitle>
            Plantillas de contabilización automática · {activeProfiles.length}{' '}
            activas de {postingProfiles.length}
          </Subtitle>
        </HeaderCopy>

        <HeaderActions>
          <Button
            onClick={() =>
              void message.info('Exportación de perfiles aún no disponible.')
            }
          >
            Exportar
          </Button>
          <Button
            disabled={loading || chartOfAccounts.length === 0}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateProfile}
          >
            Nuevo perfil
          </Button>
        </HeaderActions>
      </HeaderBar>

      <MetricGrid>
        <MetricCard>
          <MetricLabel>Perfiles activos</MetricLabel>
          <MetricValue>{activeProfiles.length}</MetricValue>
          <MetricMeta>{inactiveProfilesCount} inactivos</MetricMeta>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Líneas configuradas</MetricLabel>
          <MetricValue>{configuredLinesCount}</MetricValue>
          <MetricMeta>{postingProfiles.length} perfiles</MetricMeta>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Módulos conectados</MetricLabel>
          <MetricValue>{connectedModuleKeys.length}</MetricValue>
          <MetricMeta>
            {connectedModuleKeys
              .map((moduleKey) => ACCOUNTING_MODULE_LABELS[moduleKey])
              .join(', ') || 'Sin módulos'}
          </MetricMeta>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Cuentas disponibles</MetricLabel>
          <MetricValue>
            {
              chartOfAccounts.filter(
                (account) =>
                  account.status === 'active' && account.postingAllowed,
              ).length
            }
          </MetricValue>
          <MetricMeta>para plantillas</MetricMeta>
        </MetricCard>
      </MetricGrid>

      <FiltersBar>
        <Search
          allowClear
          placeholder="Buscar perfil..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <FilterGroup>
          <FilterLabel>Módulo</FilterLabel>
          <Select
            options={[
              { label: 'Todos', value: 'all' },
              ...moduleOptions.map((moduleKey) => ({
                label: ACCOUNTING_MODULE_LABELS[moduleKey],
                value: moduleKey,
              })),
            ]}
            value={moduleFilter}
            onChange={(value) => setModuleFilter(value)}
          />
        </FilterGroup>
        <Select
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
        />
        <ModuleChips>
          {moduleOptions.slice(0, 6).map((moduleKey) => (
            <ModuleChip
              key={moduleKey}
              type="button"
              $selected={moduleFilter === moduleKey}
              onClick={() => setModuleFilter(moduleKey)}
            >
              {ACCOUNTING_MODULE_LABELS[moduleKey]}
            </ModuleChip>
          ))}
        </ModuleChips>
      </FiltersBar>

      <ContentGrid>
        <ListPanel>
          <PanelHeader>
            <PanelTitle>Perfiles</PanelTitle>
            <PanelMeta>{filteredProfiles.length} resultados</PanelMeta>
          </PanelHeader>

          <ProfilesList aria-busy={loading}>
            {loading && postingProfiles.length === 0 ? (
              <LoadingState>
                <Spin tip="Cargando perfiles contables..." />
              </LoadingState>
            ) : filteredProfiles.length ? (
              filteredProfiles.map((profile) => {
                const isSelected = selectedProfile?.id === profile.id;

                return (
                  <ProfileRow
                    key={profile.id}
                    type="button"
                    $selected={isSelected}
                    onClick={() => setSelectedProfileId(profile.id)}
                  >
                    <ProfileIcon>
                      {profile.status === 'active' ? '•' : '-'}
                    </ProfileIcon>
                    <ProfileRowMain>
                      <ProfileTitleLine>
                        <strong>{profile.name}</strong>
                        {profile.status !== 'active' ? (
                          <StatusBadge>
                            {
                              ACCOUNTING_POSTING_PROFILE_STATUS_LABELS[
                                profile.status
                              ]
                            }
                          </StatusBadge>
                        ) : null}
                      </ProfileTitleLine>
                      <ProfileMeta>
                        {buildProfileCode(profile)} ·{' '}
                        {ACCOUNTING_MODULE_LABELS[profile.moduleKey]} ·{' '}
                        {profile.linesTemplate.length} líneas
                      </ProfileMeta>
                    </ProfileRowMain>
                    <ProfileAside>
                      <strong>{profile.priority}</strong>
                      <span>{formatRelativeTime(profile.updatedAt)}</span>
                    </ProfileAside>
                  </ProfileRow>
                );
              })
            ) : (
              <EmptyState>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No hay perfiles para los filtros actuales."
                />
              </EmptyState>
            )}
          </ProfilesList>

          {postingProfiles.length === 0 ? (
            <SeedFooter>
              <Button
                disabled={loading}
                loading={seeding}
                onClick={onSeedDefaultPostingProfiles}
              >
                Completar plantilla base
              </Button>
            </SeedFooter>
          ) : null}
        </ListPanel>

        <DetailPanel>
          {selectedProfile ? (
            <ProfileDetail
              profile={selectedProfile}
              loading={loading}
              onEdit={handleEditProfile}
              onToggleStatus={onUpdatePostingProfileStatus}
            />
          ) : (
            <DetailEmpty>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Selecciona un perfil para ver la plantilla contable."
              />
            </DetailEmpty>
          )}
        </DetailPanel>
      </ContentGrid>

      <AddPostingProfileModal
        chartOfAccounts={chartOfAccounts}
        editingProfile={editingProfile}
        loading={loading}
        lockedEventType={editingProfile?.eventType}
        open={isModalOpen}
        onCancel={handleCloseModal}
        onSubmit={handleSubmitProfile}
      />
    </Workspace>
  );
};

const ProfileDetail = ({
  loading,
  profile,
  onEdit,
  onToggleStatus,
}: {
  loading: boolean;
  profile: AccountingPostingProfile;
  onEdit: (profile: AccountingPostingProfile) => void;
  onToggleStatus: (
    postingProfileId: string,
    status: AccountingPostingProfile['status'],
  ) => Promise<boolean>;
}) => {
  const eventDefinition = getAccountingEventDefinition(profile.eventType);
  const isActive = profile.status === 'active';

  return (
    <>
      <DetailHeader>
        <DetailTitleGroup>
          <DetailTitle>
            {profile.name} <DetailCode>{buildProfileCode(profile)}</DetailCode>
          </DetailTitle>
          <DetailDescription>
            {profile.description ??
              'Perfil automático para generar el asiento desde el documento origen.'}
          </DetailDescription>
        </DetailTitleGroup>
        <DetailActions>
          <Button
            disabled={loading}
            onClick={() => void message.info('Prueba pendiente de integrar.')}
          >
            Probar
          </Button>
          <Button disabled={loading} onClick={() => onEdit(profile)}>
            Editar
          </Button>
          <Button
            disabled={loading}
            onClick={() =>
              void onToggleStatus(profile.id, isActive ? 'inactive' : 'active')
            }
          >
            {isActive ? 'Desactivar' : 'Activar'}
          </Button>
        </DetailActions>
      </DetailHeader>

      <DetailMetaGrid>
        <DetailMetaItem>
          <span>Disparador</span>
          <strong>{ACCOUNTING_EVENT_TYPE_LABELS[profile.eventType]}</strong>
        </DetailMetaItem>
        <DetailMetaItem>
          <span>Módulo origen</span>
          <strong>{ACCOUNTING_MODULE_LABELS[profile.moduleKey]}</strong>
        </DetailMetaItem>
        <DetailMetaItem>
          <span>Estado</span>
          <StatePill $active={isActive}>
            {ACCOUNTING_POSTING_PROFILE_STATUS_LABELS[profile.status]}
          </StatePill>
        </DetailMetaItem>
      </DetailMetaGrid>

      <TemplateSection>
        <SectionEyebrow>Plantilla de asiento</SectionEyebrow>
        <TemplateTable>
          <thead>
            <tr>
              <th>#</th>
              <th>D/H</th>
              <th>Cuenta</th>
              <th>Etiqueta</th>
              <th>Fórmula / campo origen</th>
            </tr>
          </thead>
          <tbody>
            {profile.linesTemplate.map((line, index) => (
              <tr key={line.id}>
                <td>{index + 1}</td>
                <td>
                  <SideBadge $side={line.side}>
                    {line.side === 'debit' ? 'D' : 'C'}
                  </SideBadge>
                </td>
                <td>
                  {line.accountCode ?? 'Sin código'} ·{' '}
                  {line.accountName ?? 'Cuenta sin nombre'}
                </td>
                <td>{line.description ?? 'Sin etiqueta'}</td>
                <FormulaCell>
                  {ACCOUNTING_POSTING_AMOUNT_SOURCE_LABELS[line.amountSource]}
                </FormulaCell>
              </tr>
            ))}
          </tbody>
        </TemplateTable>
        <TemplateNote>
          Las variables se resuelven al ejecutar el perfil con datos del
          documento origen.
        </TemplateNote>
      </TemplateSection>

      <DetailBottomGrid>
        <SideCard>
          <SideCardTitle>Condiciones</SideCardTitle>
          <RuleList>
            <RuleRow>
              <RuleDot $tone="success" />
              <span>{buildProfileConditionsSummary(profile)}</span>
            </RuleRow>
            <RuleRow>
              <RuleDot $tone="success" />
              <span>{eventDefinition.description}</span>
            </RuleRow>
          </RuleList>
        </SideCard>
        <SideCard>
          <SideCardTitle>Reglas de validación</SideCardTitle>
          <RuleList>
            <RuleRow>
              <RuleDot $tone="success" />
              <span>Débitos = Créditos en cada ejecución</span>
            </RuleRow>
            <RuleRow>
              <RuleDot $tone="success" />
              <span>Todas las cuentas existen y están activas</span>
            </RuleRow>
            <RuleRow>
              <RuleDot $tone="neutral" />
              <span>Bloqueado si el periodo contable está cerrado</span>
            </RuleRow>
          </RuleList>
        </SideCard>
      </DetailBottomGrid>
    </>
  );
};

const Workspace = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  min-height: 0;
  padding: var(--ds-space-1) 0 var(--ds-space-6);
`;

const HeaderBar = styled.section`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);
  flex-wrap: wrap;
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Title = styled.h2`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: clamp(1.25rem, 1.4vw, 1.5rem);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const Subtitle = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled.div`
  min-height: 88px;
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const MetricLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
`;

const MetricValue = styled.strong`
  display: block;
  margin-top: var(--ds-space-2);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const MetricMeta = styled.p`
  margin: var(--ds-space-1) 0 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FiltersBar = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 260px) minmax(150px, 170px) 150px minmax(
      0,
      1fr
    );
  gap: var(--ds-space-3);
  align-items: end;
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);

  @media (max-width: 980px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const FilterGroup = styled.label`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
`;

const FilterLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
`;

const ModuleChips = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
`;

const ModuleChip = styled.button<{ $selected: boolean }>`
  min-height: 28px;
  padding: 0 var(--ds-space-3);
  border: 1px solid
    ${({ $selected }) =>
      $selected
        ? 'var(--ds-color-interactive-default)'
        : 'var(--ds-color-border-default)'};
  border-radius: var(--ds-radius-pill);
  background: ${({ $selected }) =>
    $selected
      ? 'var(--ds-color-interactive-selected-bg)'
      : 'var(--ds-color-bg-subtle)'};
  color: ${({ $selected }) =>
    $selected
      ? 'var(--ds-color-interactive-default)'
      : 'var(--ds-color-text-secondary)'};
  font: inherit;
  font-size: var(--ds-font-size-xs);
  cursor: pointer;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(340px, 0.92fr) minmax(0, 1.85fr);
  gap: var(--ds-space-4);
  min-height: 0;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const ListPanel = styled.section`
  min-height: 560px;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
  overflow: hidden;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--ds-space-2);
  padding: var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-default);
`;

const PanelTitle = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-semibold);
`;

const PanelMeta = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

const ProfilesList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 620px;
  overflow-y: auto;
`;

const ProfileRow = styled.button<{ $selected: boolean }>`
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: var(--ds-space-3);
  align-items: center;
  width: 100%;
  padding: var(--ds-space-3) var(--ds-space-4);
  border: 0;
  border-bottom: 1px solid var(--ds-color-border-subtle);
  background: ${({ $selected }) =>
    $selected ? 'var(--ds-color-interactive-selected-bg)' : 'transparent'};
  box-shadow: inset 3px 0 0
    ${({ $selected }) =>
      $selected
        ? 'var(--ds-color-interactive-selected-border)'
        : 'transparent'};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${({ $selected }) =>
      $selected
        ? 'var(--ds-color-interactive-selected-bg)'
        : 'var(--ds-color-interactive-hover-bg)'};
  }
`;

const ProfileIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-interactive-default);
  font-weight: var(--ds-font-weight-semibold);
`;

const ProfileRowMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const ProfileTitleLine = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  min-width: 0;

  strong {
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-semibold);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const ProfileMeta = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

const ProfileAside = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);

  strong {
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-sm);
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 var(--ds-space-2);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

const DetailPanel = styled.section`
  min-height: 560px;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
  overflow: hidden;
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-default);

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const DetailTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  min-width: 0;
`;

const DetailTitle = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-semibold);
`;

const DetailCode = styled.span`
  margin-left: var(--ds-space-2);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

const DetailDescription = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const DetailActions = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
`;

const DetailMetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-4);
  padding: var(--ds-space-4);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const DetailMetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    letter-spacing: var(--ds-letter-spacing-wide);
    text-transform: uppercase;
  }

  strong {
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-semibold);
  }
`;

const StatePill = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 24px;
  padding: 0 var(--ds-space-2);
  border-radius: var(--ds-radius-md);
  background: ${({ $active }) =>
    $active
      ? 'var(--ds-color-state-success-subtle)'
      : 'var(--ds-color-bg-subtle)'};
  color: ${({ $active }) =>
    $active
      ? 'var(--ds-color-state-success-text)'
      : 'var(--ds-color-text-secondary)'};
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
`;

const TemplateSection = styled.section`
  padding: 0 var(--ds-space-4) var(--ds-space-4);
`;

const SectionEyebrow = styled.div`
  margin-bottom: var(--ds-space-2);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
`;

const TemplateTable = styled.table`
  width: 100%;
  border: 1px solid var(--ds-color-border-default);
  border-collapse: collapse;

  th,
  td {
    padding: var(--ds-space-3);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    text-align: left;
    vertical-align: top;
    font-size: var(--ds-font-size-sm);
  }

  th {
    color: var(--ds-color-text-secondary);
    background: var(--ds-color-bg-subtle);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-semibold);
    letter-spacing: var(--ds-letter-spacing-wide);
    text-transform: uppercase;
  }
`;

const SideBadge = styled.span<{ $side: 'debit' | 'credit' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--ds-radius-md);
  background: ${({ $side }) =>
    $side === 'debit'
      ? 'var(--ds-color-state-success-subtle)'
      : 'var(--ds-color-state-danger-subtle)'};
  color: ${({ $side }) =>
    $side === 'debit'
      ? 'var(--ds-color-state-success-text)'
      : 'var(--ds-color-state-danger-text)'};
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
`;

const FormulaCell = styled.td`
  color: var(--ds-color-interactive-default);
  font-family: var(--ds-font-family-mono, monospace);
`;

const TemplateNote = styled.p`
  margin: var(--ds-space-3) 0 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

const DetailBottomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-4);
  padding: 0 var(--ds-space-4) var(--ds-space-4);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const SideCard = styled.section`
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
  overflow: hidden;
`;

const SideCardTitle = styled.h4`
  margin: 0;
  padding: var(--ds-space-3) var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-default);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-semibold);
`;

const RuleList = styled.div`
  display: flex;
  flex-direction: column;
`;

const RuleRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-subtle);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);

  &:last-child {
    border-bottom: 0;
  }
`;

const RuleDot = styled.span<{ $tone: 'success' | 'neutral' }>`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === 'success'
      ? 'var(--ds-color-state-success-text)'
      : 'var(--ds-color-text-disabled)'};
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  padding: var(--ds-space-6);
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  padding: var(--ds-space-6);
`;

const DetailEmpty = styled(EmptyState)`
  height: 100%;
`;

const SeedFooter = styled.div`
  padding: var(--ds-space-4);
  border-top: 1px solid var(--ds-color-border-default);
`;
