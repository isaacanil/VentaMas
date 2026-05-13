import { Button, Tooltip } from '@heroui/react';
import { faGrip } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import useViewportWidth from '@/hooks/windows/useViewportWidth';

import { ShortcutIcon } from './ModuleLauncher/ModuleShortcutGrid';

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

const DOCK_LABEL_OVERRIDES: Record<string, string> = {
  'Asientos Manuales': 'Asientos',
  'Bancos y cajas': 'Bancos',
  'Cierre de Periodo': 'Cierre',
  'Control Inventario': 'Control',
  'Cuadre de Caja': 'Caja',
  'Cumplimiento Fiscal': 'Fiscal',
  'Cuentas por Cobrar': 'CxC',
  'Cuentas por Pagar': 'CxP',
  'Notas de Crédito': 'Notas',
  'Reportes Contables': 'Reportes',
  'Resumen Inventario': 'Resumen',
  'Revisión de sesiones de usuarios': 'Sesiones',
};

const getDockLabel = (shortcut: LauncherShortcut): string =>
  DOCK_LABEL_OVERRIDES[shortcut.title] ?? shortcut.title.split(' ')[0];

const normalizeRoute = (route: string): string => {
  const normalized = route.split('?')[0].replace(/\/+$/, '');
  return normalized || '/';
};

const isShortcutActive = (pathname: string, route: string): boolean => {
  const currentPath = normalizeRoute(pathname);
  const shortcutRoute = normalizeRoute(route);

  return (
    currentPath === shortcutRoute ||
    (shortcutRoute !== '/' && currentPath.startsWith(`${shortcutRoute}/`))
  );
};

export const ModuleLauncherDock = ({
  alertCount = 0,
  controller,
  onOpenModules,
}: ModuleLauncherDockProps): JSX.Element => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
        className="pointer-events-auto flex max-w-[calc(100vw-1rem)] items-stretch gap-1 overflow-x-auto rounded-[22px] border border-neutral-200/80 bg-white/95 p-1.5 shadow-xl shadow-neutral-900/10 backdrop-blur-xl md:max-w-none md:flex-col md:overflow-visible"
      >
        {controller.pinnedShortcuts.map((shortcut) => {
          const isActive = isShortcutActive(pathname, shortcut.route);
          const label = getDockLabel(shortcut);

          return (
            <Tooltip key={shortcut.key}>
              <Tooltip.Trigger>
                <span className="inline-flex">
                  <Button
                    aria-label={shortcut.title}
                    className={[
                      'flex h-[58px] w-[58px] min-w-[58px] flex-col justify-center gap-1 rounded-[14px] border px-1.5 shadow-sm transition md:w-[66px] md:min-w-[66px]',
                      isActive
                        ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-blue-900/10'
                        : 'border-neutral-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
                    ].join(' ')}
                    onPress={() => navigateToShortcut(shortcut)}
                    size="sm"
                    variant={isActive ? 'secondary' : 'ghost'}
                  >
                    <ShortcutIcon>{shortcut.icon}</ShortcutIcon>
                    <span className="max-w-full truncate text-[10px] font-semibold leading-none tracking-normal">
                      {label}
                    </span>
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

        <div className="mx-0.5 h-10 w-px self-center bg-neutral-200 md:mx-0 md:my-0.5 md:h-px md:w-12" />

        <Tooltip>
          <Tooltip.Trigger>
            <span className="relative inline-flex h-[58px] min-w-[60px] md:w-[66px] md:min-w-[66px]">
              <Button
                aria-label="Ver módulos"
                className="flex h-[58px] w-[60px] min-w-[60px] flex-col justify-center gap-1 rounded-[14px] bg-blue-600 px-1.5 text-white shadow-md shadow-blue-900/20 hover:bg-blue-700 md:w-[66px] md:min-w-[66px]"
                onPress={onOpenModules}
                size="sm"
                variant="primary"
              >
                <FontAwesomeIcon icon={faGrip} />
                <span className="max-w-full truncate text-[10px] font-semibold leading-none tracking-normal">
                  Módulos
                </span>
              </Button>
              {alertCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white md:right-0 md:top-0">
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
