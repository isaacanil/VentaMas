import { Button, Drawer, Empty, Input, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useDeferredValue, useMemo, useState } from 'react';
import styled from 'styled-components';

import { useWindowWidth } from '@/hooks/useWindowWidth';
import type {
  AccountingEventType,
  AccountingPostingProfile,
  ChartOfAccount,
} from '@/types/accounting';
import {
  ACCOUNTING_EVENT_DEFINITIONS,
  ACCOUNTING_MODULE_LABELS,
  getAccountingEventDefinition,
} from '@/utils/accounting/accountingEvents';
import {
  ACCOUNTING_POSTING_PAYMENT_TERM_LABELS,
  ACCOUNTING_POSTING_PROFILE_STATUS_LABELS,
  ACCOUNTING_POSTING_SETTLEMENT_KIND_LABELS,
  ACCOUNTING_POSTING_TAX_TREATMENT_LABELS,
  type AccountingPostingProfileDraft,
} from '@/utils/accounting/postingProfiles';
import {
  AccountingEventCoverageList,
  type AccountingEventCoverageItem,
} from '../AccountingEventCoverageList';
import { AddPostingProfileModal } from '../AddPostingProfileModal';
import { PostingProfileInspector } from './components/PostingProfileInspector';

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
  { label: 'Todos los estados', value: 'all' },
  { label: 'Activos', value: 'active' },
  { label: 'Inactivos', value: 'inactive' },
] as const;

const buildProfileConditionsSummary = (
  profile: AccountingPostingProfile,
) => {
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
  const isInlineInspectorLayout = useWindowWidth(980);
  const isCompactEventContext = !isInlineInspectorLayout;
  const [selectedEventType, setSelectedEventType] = useState<AccountingEventType>(
    ACCOUNTING_EVENT_DEFINITIONS[0].eventType,
  );
  const [isEventsDrawerOpen, setIsEventsDrawerOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<AccountingPostingProfile | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | AccountingPostingProfile['status']
  >('all');
  const deferredSearch = useDeferredValue(search);

  const availablePostingAccountsCount = useMemo(
    () =>
      chartOfAccounts.filter(
        (account) => account.status === 'active' && account.postingAllowed,
      ).length,
    [chartOfAccounts],
  );

  const coverageItems = useMemo<AccountingEventCoverageItem[]>(
    () =>
      ACCOUNTING_EVENT_DEFINITIONS.map((definition) => {
        const profilesForEvent = postingProfiles.filter(
          (profile) => profile.eventType === definition.eventType,
        );
        const activeProfilesCount = profilesForEvent.filter(
          (profile) => profile.status === 'active',
        ).length;

        return {
          activeProfilesCount,
          description: definition.description,
          eventType: definition.eventType,
          label: definition.label,
          moduleLabel: ACCOUNTING_MODULE_LABELS[definition.moduleKey],
          totalProfilesCount: profilesForEvent.length,
        };
      }),
    [postingProfiles],
  );

  const selectedEvent =
    coverageItems.find((item) => item.eventType === selectedEventType) ??
    coverageItems[0];

  const profilesForEvent = useMemo(
    () =>
      postingProfiles.filter(
        (profile) => profile.eventType === selectedEvent.eventType,
      ),
    [postingProfiles, selectedEvent.eventType],
  );

  const filteredProfiles = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return profilesForEvent.filter((profile) => {
      if (statusFilter !== 'all' && profile.status !== statusFilter) {
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
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [deferredSearch, profilesForEvent, statusFilter]);

  const selectedProfile = useMemo(() => {
    return (
      filteredProfiles.find((profile) => profile.id === selectedProfileId) ??
      filteredProfiles[0] ??
      null
    );
  }, [filteredProfiles, selectedProfileId]);

  const activeProfilesCount = profilesForEvent.filter(
    (profile) => profile.status === 'active',
  ).length;

  const handleEventSelect = (eventType: AccountingEventType) => {
    setSelectedEventType(eventType);
    setSelectedProfileId(null);
    setIsEventsDrawerOpen(false);
    setIsInspectorOpen(false);
    setSearch('');
    setStatusFilter('all');
  };

  const handleCloseModal = () => {
    setEditingProfile(null);
    setIsModalOpen(false);
  };

  const handleCreateProfile = () => {
    setEditingProfile(null);
    setIsModalOpen(true);
  };

  const handleEditProfile = (profile: AccountingPostingProfile) => {
    setSelectedProfileId(profile.id);
    setIsInspectorOpen(true);
    setEditingProfile(profile);
    setIsModalOpen(true);
  };

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);

    if (!isInlineInspectorLayout) {
      setIsInspectorOpen(true);
    }
  };

  const inspectorContent = (
    <PostingProfileInspector
      availablePostingAccountsCount={availablePostingAccountsCount}
      eventItem={selectedEvent}
      loading={loading}
      profile={selectedProfile}
      onCreate={handleCreateProfile}
      onEdit={handleEditProfile}
      onToggleStatus={onUpdatePostingProfileStatus}
    />
  );

  const handleSubmitProfile = async (
    draft: Partial<AccountingPostingProfileDraft>,
    postingProfileId?: string,
  ) => {
    const targetProfileId = postingProfileId ?? editingProfile?.id;
    const eventType = editingProfile?.eventType ?? selectedEvent.eventType;
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
      {isInlineInspectorLayout ? (
        <CoverageColumn>
          <AccountingEventCoverageList
            items={coverageItems}
            selectedEventType={selectedEvent.eventType}
            onSelect={handleEventSelect}
          />

          <CoverageFooter>
            <Button loading={seeding} onClick={onSeedDefaultPostingProfiles}>
              Completar plantilla base
            </Button>
          </CoverageFooter>
        </CoverageColumn>
      ) : null}

      <ProfilesColumn>
        {!isInlineInspectorLayout ? (
          <MobileEventBar>
            <MobileEventCopy>
              <MobileEventLabel>Evento actual</MobileEventLabel>
              <MobileEventTitle>{selectedEvent.label}</MobileEventTitle>
              <MobileEventMeta>{selectedEvent.moduleLabel}</MobileEventMeta>
            </MobileEventCopy>

            <Button onClick={() => setIsEventsDrawerOpen(true)}>
              Cambiar evento
            </Button>
          </MobileEventBar>
        ) : null}

        <ProfilesHeader $compact={isCompactEventContext}>
          {isCompactEventContext ? null : (
            <ProfilesHeaderCopy>
              <ProfilesTitle>{selectedEvent.label}</ProfilesTitle>
            </ProfilesHeaderCopy>
          )}

          <ProfilesHeaderActions>
            <Button
              disabled={availablePostingAccountsCount === 0}
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateProfile}
            >
              perfil
            </Button>
          </ProfilesHeaderActions>
        </ProfilesHeader>

        <StatsStrip>
          <StatItem>
            <StatValue>{profilesForEvent.length}</StatValue>
            <StatLabel>Perfiles</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{activeProfilesCount}</StatValue>
            <StatLabel>Activos</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{profilesForEvent.length - activeProfilesCount}</StatValue>
            <StatLabel>Inactivos</StatLabel>
          </StatItem>
        </StatsStrip>

        <Controls>
          <Search
            allowClear
            placeholder="Buscar dentro del evento"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
          />
        </Controls>

        <ProfilesList aria-busy={loading}>
          {filteredProfiles.length ? (
            filteredProfiles.map((profile) => {
              const isSelected = selectedProfile?.id === profile.id;

              return (
                <ProfileRow
                  key={profile.id}
                  type="button"
                  $selected={isSelected}
                  onClick={() => {
                    handleSelectProfile(profile.id);
                  }}
                >
                  <ProfileRowMain>
                    <ProfileHeading>
                      <ProfileTitleBlock>
                        <strong>
                          {profile.priority} · {profile.name}
                        </strong>
                      </ProfileTitleBlock>
                    </ProfileHeading>

                    <ProfileMeta>
                      Condición: {buildProfileConditionsSummary(profile)}
                    </ProfileMeta>
                  </ProfileRowMain>

                  <ProfileAside>
                    {profile.status !== 'active' ? (
                      <StatusBadge>
                        {ACCOUNTING_POSTING_PROFILE_STATUS_LABELS[profile.status]}
                      </StatusBadge>
                    ) : null}
                    <LinesCount>{profile.linesTemplate.length} líneas</LinesCount>
                  </ProfileAside>
                </ProfileRow>
              );
            })
          ) : profilesForEvent.length ? (
            <EmptyState>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No hay perfiles para ese filtro."
              />
            </EmptyState>
          ) : (
            <EmptyState>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Este evento todavía no tiene perfiles activos ni inactivos."
              />
            </EmptyState>
          )}
        </ProfilesList>
      </ProfilesColumn>

      {isInlineInspectorLayout ? inspectorContent : null}

      {!isInlineInspectorLayout ? (
        <Drawer
          destroyOnHidden
          open={Boolean(selectedProfile) && isInspectorOpen}
          placement="right"
          title={
            selectedProfile
              ? `${selectedProfile.priority} · ${selectedProfile.name}`
              : 'Detalle del perfil'
          }
          width="100%"
          onClose={() => setIsInspectorOpen(false)}
          styles={{
            body: {
              padding: 0,
              height: '100%',
            },
          }}
        >
          {inspectorContent}
        </Drawer>
      ) : null}

      {!isInlineInspectorLayout ? (
        <Drawer
          destroyOnHidden
          open={isEventsDrawerOpen}
          placement="left"
          title="Eventos contables"
          width="100%"
          onClose={() => setIsEventsDrawerOpen(false)}
          styles={{
            body: {
              padding: 0,
              height: '100%',
            },
          }}
        >
          <MobileCoverageDrawerContent>
            <AccountingEventCoverageList
              items={coverageItems}
              selectedEventType={selectedEvent.eventType}
              onSelect={handleEventSelect}
            />

            <CoverageFooter>
              <Button loading={seeding} onClick={onSeedDefaultPostingProfiles}>
                Completar plantilla base
              </Button>
            </CoverageFooter>
          </MobileCoverageDrawerContent>
        </Drawer>
      ) : null}

      <AddPostingProfileModal
        chartOfAccounts={chartOfAccounts}
        editingProfile={editingProfile}
        loading={loading}
        lockedEventType={editingProfile?.eventType ?? selectedEvent.eventType}
        open={isModalOpen}
        onCancel={handleCloseModal}
        onSubmit={handleSubmitProfile}
      />
    </Workspace>
  );
};

const Workspace = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 0.68fr) minmax(0, 1fr) minmax(340px, 0.86fr);
  align-items: stretch;
  flex: 1;
  min-height: 0;

  @media (max-width: 1280px) {
    grid-template-columns: minmax(260px, 0.72fr) minmax(0, 1fr);
  }

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const CoverageColumn = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
`;

const CoverageFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border-top: 1px solid var(--ds-color-border-subtle);
`;

const MobileCoverageDrawerContent = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: var(--ds-color-bg-surface);
`;

const FooterCopy = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

const ProfilesColumn = styled.section`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
  overflow: hidden;
  min-height: 0;
`;

const MobileEventBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4) var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border-subtle);
  background: var(--ds-color-bg-subtle);
`;

const MobileEventCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const MobileEventLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text-secondary);
`;

const MobileEventTitle = styled.strong`
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MobileEventMeta = styled.span`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;

const ProfilesHeader = styled.div<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.$compact ? 'flex-end' : 'space-between')};
  gap: var(--ds-space-4);
  min-height: ${(props) => (props.$compact ? '44px' : '52px')};
  padding: ${(props) =>
    props.$compact ? 'var(--ds-space-2) var(--ds-space-5)' : '0 var(--ds-space-5)'};
  border-bottom: 1px solid var(--ds-color-border-subtle);
  flex-shrink: 0;
`;

const ProfilesHeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
`;

const ProfilesTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const ProfilesDescription = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

const ProfilesHeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
`;

const StatsStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-bottom: 1px solid var(--ds-color-border-subtle);
`;

const StatItem = styled.div`
  padding: var(--ds-space-4) var(--ds-space-5);
  border-right: 1px solid var(--ds-color-border-subtle);

  &:last-child {
    border-right: 0;
  }
`;

const StatValue = styled.div`
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const StatLabel = styled.div`
  margin-top: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;

const Controls = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4) var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border-subtle);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const ProfilesList = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
`;

const ProfileRow = styled.button<{ $selected: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  width: 100%;
  padding: var(--ds-space-4) var(--ds-space-5);
  border: 0;
  border-bottom: 1px solid var(--ds-color-border-subtle);
  background: ${(props) =>
    props.$selected ? 'var(--ds-color-interactive-selected-bg)' : 'transparent'};
  box-shadow: inset 3px 0 0
    ${(props) =>
      props.$selected
        ? 'var(--ds-color-interactive-selected-border)'
        : 'transparent'};
  text-align: left;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    background: ${(props) =>
      props.$selected
        ? 'var(--ds-color-interactive-selected-bg)'
        : 'var(--ds-color-interactive-hover-bg)'};
  }
`;

const ProfileRowMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  min-width: 0;
`;

const ProfileHeading = styled.div`
  display: flex;
  align-items: flex-start;
`;

const ProfileTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong {
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-color-text-primary);
  }
`;

const ProfileMeta = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const ProfileAside = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-wrap: wrap;
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 var(--ds-space-2);
  border: 1px solid var(--ds-color-state-warning);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-state-warning-subtle);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-state-warning-text);
`;

const LinesCount = styled.span`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  padding: var(--ds-space-6);
`;
