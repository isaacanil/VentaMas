import { Button, Chip, SearchField } from '@heroui/react';
import {
  faEllipsisVertical,
  faMagnifyingGlass,
  faThumbtack,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { VmCard, VmDropdown } from '@/components/heroui';

import {
  findSearchMatchRange,
  MAX_PINNED_SHORTCUTS,
} from './moduleLauncherUtils';

import type { JSX, ReactNode } from 'react';
import type { LauncherShortcut, ModuleShortcutsController } from './types';

interface ModuleShortcutGridProps {
  className?: string;
  controller: ModuleShortcutsController;
  onOpenShortcut: (shortcut: LauncherShortcut) => void;
  showSearchField?: boolean;
  showScopeTabs?: boolean;
}

const resolveShortcutGridColumns = (shortcutCount: number): string => {
  if (shortcutCount <= 3) return '';
  if (shortcutCount <= 6) return 'sm:grid-cols-2';
  return 'sm:grid-cols-2 lg:grid-cols-3';
};

const resolveShortcutGroupSpan = (shortcutCount: number): string => {
  if (shortcutCount <= 3) return '';
  if (shortcutCount <= 6) return 'md:col-span-2';
  return 'md:col-span-2 xl:col-span-3';
};

export const ModuleShortcutGrid = ({
  className,
  controller,
  onOpenShortcut,
  showSearchField = true,
  showScopeTabs = true,
}: ModuleShortcutGridProps): JSX.Element => (
  <div className={['grid gap-4', className].filter(Boolean).join(' ')}>
    {showScopeTabs && controller.canShowDeveloperTools ? (
      <div
        aria-label="Tipo de módulo"
        className="grid grid-cols-2 gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1"
        role="tablist"
      >
        {controller.launcherTabs.map((tab) => (
          <button
            aria-controls={tab.panelId}
            aria-selected={controller.selectedTab === tab.key}
            className={[
              'flex min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition',
              controller.selectedTab === tab.key
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-neutral-600 hover:bg-white/70 hover:text-neutral-950',
            ].join(' ')}
            id={tab.tabId}
            key={tab.key}
            onClick={() => {
              controller.setActiveTab(tab.key);
              controller.setSearchValue('');
            }}
            role="tab"
            type="button"
          >
            <span className="truncate">{tab.label}</span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
              {tab.count}
            </span>
          </button>
        ))}
      </div>
    ) : null}

    {showSearchField ? (
      <SearchField
        aria-label={`Buscar módulo de ${controller.activeTabDefinition?.label ?? 'usuario'}`}
        className="w-full"
        onChange={controller.setSearchValue}
        onClear={() => controller.setSearchValue('')}
        value={controller.searchValue}
        variant="secondary"
      >
        <SearchField.Group>
          <FontAwesomeIcon
            className="mx-2 text-sm text-neutral-400"
            icon={faMagnifyingGlass}
          />
          <SearchField.Input
            autoComplete="off"
            placeholder="Buscar módulo o acción"
          />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
    ) : null}

    <section
      aria-labelledby={
        showScopeTabs && controller.canShowDeveloperTools
          ? controller.activeTabDefinition?.tabId
          : undefined
      }
      className="grid gap-4"
      id={
        showScopeTabs && controller.canShowDeveloperTools
          ? controller.activeTabDefinition?.panelId
          : undefined
      }
      role={
        showScopeTabs && controller.canShowDeveloperTools
          ? 'tabpanel'
          : undefined
      }
      tabIndex={
        showScopeTabs && controller.canShowDeveloperTools ? 0 : undefined
      }
    >
      {controller.shortcutGroups.length > 0 ? (
        <div className="grid grid-flow-dense gap-4 md:grid-cols-2 xl:grid-cols-3">
          {controller.shortcutGroups.map(([category, group]) => {
            const groupSpanClass = resolveShortcutGroupSpan(group.length);

            return (
              <VmCard
                className={[
                  'grid content-start gap-3 p-3 shadow-none',
                  groupSpanClass,
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={category}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-blue-700">
                    {category}
                  </h3>
                  <Chip size="sm" variant="soft">
                    <Chip.Label>{group.length}</Chip.Label>
                  </Chip>
                </div>
                <div
                  className={[
                    'grid gap-2',
                    resolveShortcutGridColumns(group.length),
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {group.map((shortcut) => (
                    <ModuleLauncherTile
                      canPin={controller.selectedTab === 'user'}
                      isDockFull={
                        !controller.pinnedKeys.includes(shortcut.key) &&
                        controller.pinnedShortcuts.length >=
                          MAX_PINNED_SHORTCUTS
                      }
                      isPinned={controller.pinnedKeys.includes(shortcut.key)}
                      key={shortcut.key}
                      onOpen={() => onOpenShortcut(shortcut)}
                      onTogglePin={() => controller.handleTogglePin(shortcut)}
                      searchValue={controller.searchValue}
                      shortcut={shortcut}
                    />
                  ))}
                </div>
              </VmCard>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          Sin módulos
        </div>
      )}
    </section>
  </div>
);

export const ShortcutIcon = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => (
  <span className="flex size-5 items-center justify-center text-base [&_svg]:size-4">
    {children}
  </span>
);

export const ModuleLauncherTile = ({
  canPin = true,
  isDockFull = false,
  isPinned,
  onOpen,
  onTogglePin,
  searchValue = '',
  shortcut,
}: {
  canPin?: boolean;
  isDockFull?: boolean;
  isPinned: boolean;
  onOpen: () => void;
  onTogglePin: () => void;
  searchValue?: string;
  shortcut: LauncherShortcut;
}): JSX.Element => {
  const actionLabel = isPinned ? 'Quitar del dock' : 'Fijar en dock';

  return (
    <div className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-neutral-50/80 p-2 transition hover:bg-blue-50/80">
      <button
        className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-center gap-2 text-left"
        onClick={onOpen}
        type="button"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-neutral-100 text-blue-700 group-hover:bg-blue-100 [&_svg]:size-4">
          {shortcut.icon}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-neutral-900">
            <HighlightedShortcutTitle
              searchValue={searchValue}
              title={shortcut.title}
            />
          </span>
        </span>
      </button>
      {canPin ? (
        <VmDropdown>
          <Button
            aria-label={`Opciones de ${shortcut.title}`}
            className={[
              'size-8 min-w-8 rounded-lg',
              isPinned ? 'text-blue-700' : 'text-neutral-400',
            ].join(' ')}
            isIconOnly
            size="sm"
            variant="ghost"
          >
            <FontAwesomeIcon icon={faEllipsisVertical} />
          </Button>
          <VmDropdown.Popover
            className="z-[320] min-w-44"
            placement="bottom end"
          >
            <VmDropdown.Menu
              aria-label={`Acciones de ${shortcut.title}`}
              onAction={(key) => {
                if (key === 'toggle-pin') onTogglePin();
              }}
            >
              <VmDropdown.Item
                id="toggle-pin"
                isDisabled={isDockFull}
                textValue={isDockFull ? 'Dock completo' : actionLabel}
              >
                <span
                  className="inline-flex items-center gap-2"
                  data-slot="label"
                >
                  <FontAwesomeIcon icon={faThumbtack} fixedWidth />
                  {isDockFull ? 'Dock completo' : actionLabel}
                </span>
              </VmDropdown.Item>
            </VmDropdown.Menu>
          </VmDropdown.Popover>
        </VmDropdown>
      ) : null}
    </div>
  );
};

const HighlightedShortcutTitle = ({
  searchValue,
  title,
}: {
  searchValue: string;
  title: string;
}): JSX.Element => {
  const match = findSearchMatchRange(title, searchValue);
  if (!match) return <>{title}</>;

  return (
    <>
      {title.slice(0, match.start)}
      <mark
        className="rounded px-0.5 font-semibold"
        style={{
          backgroundColor: 'var(--ds-color-action-primary-subtle)',
          color: 'var(--ds-color-action-on-primary-subtle)',
        }}
      >
        {title.slice(match.start, match.end)}
      </mark>
      {title.slice(match.end)}
    </>
  );
};
