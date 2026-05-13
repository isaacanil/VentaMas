import { Button, Tooltip } from '@heroui/react';
import { faGrip } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import useViewportWidth from '@/hooks/windows/useViewportWidth';

import {
  ShortcutIcon,
} from './ModuleLauncher/ModuleShortcutGrid';

import type { JSX } from 'react';
import type {
  LauncherShortcut,
  ModuleShortcutsController,
} from './ModuleLauncher/types';

interface ModuleLauncherDockProps {
  alertCount?: number;
  controller: ModuleShortcutsController;
  onOpenModules?: () => void;
}

export const ModuleLauncherDock = ({
  alertCount = 0,
  controller,
  onOpenModules,
}: ModuleLauncherDockProps): JSX.Element => {
  const navigate = useNavigate();
  const viewportWidth = useViewportWidth();
  const isMobileLauncher = viewportWidth <= 768;

  const navigateToShortcut = useCallback(
    (shortcut: LauncherShortcut) => {
      navigate(shortcut.route);
    },
    [navigate],
  );

  return (
    <div className="heroui-scope pointer-events-none fixed bottom-4 left-1/2 z-[260] -translate-x-1/2 md:bottom-auto md:left-auto md:right-5 md:top-1/2 md:-translate-y-1/2 md:translate-x-0">
      <nav
        aria-label="Dock de módulos"
        className="pointer-events-auto flex max-w-[calc(100vw-1rem)] items-center gap-1.5 overflow-x-auto rounded-full border border-slate-200/80 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl md:max-w-none md:flex-col md:overflow-visible"
      >
        {controller.pinnedShortcuts.map((shortcut) => {
          const isPinned = controller.pinnedKeys.includes(shortcut.key);

          return (
            <Tooltip key={shortcut.key}>
              <Tooltip.Trigger>
                <span className="inline-flex">
                  <Button
                    aria-label={shortcut.title}
                    className="h-11 w-11 min-w-11 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    isIconOnly
                    onPress={() => navigateToShortcut(shortcut)}
                    size="sm"
                    variant={isPinned ? 'secondary' : 'ghost'}
                  >
                    <ShortcutIcon>{shortcut.icon}</ShortcutIcon>
                  </Button>
                </span>
              </Tooltip.Trigger>
              <Tooltip.Content placement={isMobileLauncher ? 'top' : 'left'}>
                <Tooltip.Arrow />
                {shortcut.title}
              </Tooltip.Content>
            </Tooltip>
          );
        })}

        <div className="mx-1 h-7 w-px bg-slate-200 md:mx-0 md:my-1 md:h-px md:w-7" />

        <Tooltip>
          <Tooltip.Trigger>
            <span className="relative inline-flex h-11 w-11">
              <Button
                aria-label="Ver módulos"
                className="h-11 w-11 min-w-11 rounded-full bg-blue-600 text-white shadow-md shadow-blue-900/20 hover:bg-blue-700"
                isIconOnly
                onPress={onOpenModules}
                size="sm"
                variant="primary"
              >
                <FontAwesomeIcon icon={faGrip} />
              </Button>
              {alertCount > 0 ? (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                  {alertCount}
                </span>
              ) : null}
            </span>
          </Tooltip.Trigger>
          <Tooltip.Content placement={isMobileLauncher ? 'top' : 'left'}>
            <Tooltip.Arrow />
            Módulos
          </Tooltip.Content>
        </Tooltip>
      </nav>
    </div>
  );
};
