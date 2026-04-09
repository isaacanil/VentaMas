import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import styled from 'styled-components';

import { AppIcon } from '@/components/ui/AppIcon';
import type { AccountingPostingProfile } from '@/types/accounting';
import {
  ACCOUNTING_EVENT_TYPE_LABELS,
  ACCOUNTING_MODULE_LABELS,
} from '@/utils/accounting/accountingEvents';
import {
  ACCOUNTING_POSTING_AMOUNT_SOURCE_LABELS,
  ACCOUNTING_POSTING_PAYMENT_TERM_LABELS,
  ACCOUNTING_POSTING_SETTLEMENT_KIND_LABELS,
  ACCOUNTING_POSTING_TAX_TREATMENT_LABELS,
} from '@/utils/accounting/postingProfiles';
import type { AccountingEventCoverageItem } from '../../AccountingEventCoverageList';

interface PostingProfileInspectorProps {
  availablePostingAccountsCount: number;
  eventItem: AccountingEventCoverageItem;
  loading: boolean;
  profile: AccountingPostingProfile | null;
  onCreate: () => void;
  onEdit: (profile: AccountingPostingProfile) => void;
  onToggleStatus: (
    postingProfileId: string,
    status: AccountingPostingProfile['status'],
  ) => void;
}

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

const getLinesCountLabel = (linesCount: number) =>
  linesCount === 1 ? '1 línea' : `${linesCount} líneas`;

export const PostingProfileInspector = ({
  availablePostingAccountsCount,
  eventItem,
  loading,
  profile,
  onCreate,
  onEdit,
  onToggleStatus,
}: PostingProfileInspectorProps) => {
  if (!profile) {
    return (
      <Panel>
        <EmptyState>
          <EmptyIcon>
            <AppIcon name="buildingColumns" tone="muted" sizeToken="lg" />
          </EmptyIcon>
          <EmptyTitle>{eventItem.label}</EmptyTitle>
          <EmptyCopy>
            Selecciona un perfil existente o crea uno nuevo para revisar sus
            condiciones y líneas contables.
          </EmptyCopy>
          <Button
            disabled={availablePostingAccountsCount === 0}
            type="primary"
            onClick={onCreate}
          >
            Nuevo perfil
          </Button>
        </EmptyState>
      </Panel>
    );
  }

  const isActive = profile.status === 'active';
  const description = profile.description?.trim();

  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'toggle-status',
      label: isActive ? 'Desactivar perfil' : 'Activar perfil',
      danger: isActive,
      onClick: () =>
        void onToggleStatus(profile.id, isActive ? 'inactive' : 'active'),
    },
  ];

  return (
    <Panel>
      <Header>
        <HeaderTop>
          <HeaderCopy>
            <Eyebrow>
              Prioridad {profile.priority} ·{' '}
              {ACCOUNTING_EVENT_TYPE_LABELS[profile.eventType]}
            </Eyebrow>
            <Title>{profile.name}</Title>
            <Subtitle>{ACCOUNTING_MODULE_LABELS[profile.moduleKey]}</Subtitle>
            {!isActive ? (
              <StatusNotice>
                <AppIcon name="ban" sizeToken="xs" />
                Perfil inactivo
              </StatusNotice>
            ) : null}
          </HeaderCopy>

          <HeaderActions>
            <Button disabled={loading} onClick={() => onEdit(profile)}>
              Editar perfil
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

        <HeaderContext>
          <SectionHeading>
            <AppIcon name="circleInfo" sizeToken="sm" tone="muted" />
            <SectionLabel>Evento contable</SectionLabel>
          </SectionHeading>
          <HeaderContextCopy>
            {eventItem.moduleLabel} · {eventItem.description}
          </HeaderContextCopy>
        </HeaderContext>
      </Header>

      <ScrollBody>
        <Section>
          <SectionHeader>
            <SectionHeading>
              <AppIcon name="circleInfo" sizeToken="sm" tone="muted" />
              <SectionLabel>Ficha del perfil</SectionLabel>
            </SectionHeading>
          </SectionHeader>

          <DefinitionGrid>
            <DefinitionItem>
              <DefinitionLabel>Evento</DefinitionLabel>
              <DefinitionValue>
                {ACCOUNTING_EVENT_TYPE_LABELS[profile.eventType]}
              </DefinitionValue>
            </DefinitionItem>
            <DefinitionItem>
              <DefinitionLabel>Módulo</DefinitionLabel>
              <DefinitionValue>
                {ACCOUNTING_MODULE_LABELS[profile.moduleKey]}
              </DefinitionValue>
            </DefinitionItem>
            <DefinitionItem>
              <DefinitionLabel>Prioridad</DefinitionLabel>
              <DefinitionValue>{profile.priority}</DefinitionValue>
            </DefinitionItem>
            <DefinitionItem>
              <DefinitionLabel>Líneas</DefinitionLabel>
              <DefinitionValue>
                {getLinesCountLabel(profile.linesTemplate.length)}
              </DefinitionValue>
            </DefinitionItem>
          </DefinitionGrid>
        </Section>

        <Section>
          <SectionHeader>
            <SectionHeading>
              <AppIcon name="listUl" sizeToken="sm" tone="muted" />
              <SectionLabel>Condiciones</SectionLabel>
            </SectionHeading>
          </SectionHeader>

          <BodyCopy>{buildProfileConditionsSummary(profile)}</BodyCopy>
        </Section>

        {description ? (
          <Section>
            <SectionHeader>
              <SectionHeading>
                <AppIcon name="circleInfo" sizeToken="sm" tone="muted" />
                <SectionLabel>Descripción operativa</SectionLabel>
              </SectionHeading>
            </SectionHeader>

            <BodyCopy>{description}</BodyCopy>
          </Section>
        ) : null}

        <Section>
          <SectionHeader>
            <SectionHeading>
              <AppIcon name="listUl" sizeToken="sm" tone="muted" />
              <SectionLabel>Líneas contables</SectionLabel>
            </SectionHeading>
          </SectionHeader>

          <LinesList>
            {profile.linesTemplate.map((line) => (
              <LineRow key={line.id}>
                <LineHeader>
                  <LineSide $side={line.side}>
                    {line.side === 'debit' ? 'Débito' : 'Crédito'}
                  </LineSide>
                  <LineAmountSource>
                    {ACCOUNTING_POSTING_AMOUNT_SOURCE_LABELS[line.amountSource]}
                  </LineAmountSource>
                </LineHeader>
                <LineAccount>
                  {line.accountCode ?? 'Sin código'} ·{' '}
                  {line.accountName ?? 'Cuenta sin nombre'}
                </LineAccount>
                {line.description ? (
                  <LineNote>{line.description}</LineNote>
                ) : null}
                {!line.omitIfZero ? (
                  <LineNote>Se mantiene incluso con monto 0.</LineNote>
                ) : null}
              </LineRow>
            ))}
          </LinesList>
        </Section>
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

  @media (max-width: 1280px) {
    grid-column: 1 / -1;
  }
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
  background: var(--ds-color-state-warning-subtle);
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

const HeaderContextCopy = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
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

const BodyCopy = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

const LinesList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
`;

const LineRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3);
  border-bottom: 1px solid var(--ds-color-border-subtle);
  background: var(--ds-color-bg-surface);

  &:last-child {
    border-bottom: 0;
  }
`;

const LineHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const LineSide = styled.span<{ $side: 'debit' | 'credit' }>`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 4px var(--ds-space-2);
  border-radius: var(--ds-radius-pill);
  background: ${(props) =>
    props.$side === 'debit'
      ? 'var(--ds-color-state-info-subtle)'
      : 'var(--ds-color-state-warning-subtle)'};
  color: ${(props) =>
    props.$side === 'debit'
      ? 'var(--ds-color-state-info-text)'
      : 'var(--ds-color-state-warning-text)'};
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
`;

const LineAmountSource = styled.span`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;

const LineAccount = styled.strong`
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text-primary);
`;

const LineNote = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
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
