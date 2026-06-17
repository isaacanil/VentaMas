import { faGrip, faThumbtack } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { VmButton, VmDropdown } from '@/components/heroui';

import { ShortcutIcon } from './ModuleLauncher/ModuleShortcutGrid';

import type { JSX, MouseEvent } from 'react';
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
  const [openShortcutMenuKey, setOpenShortcutMenuKey] = useState<string | null>(
    null,
  );

  const navigateToShortcut = useCallback(
    (shortcut: LauncherShortcut) => {
      navigate(shortcut.route);
    },
    [navigate],
  );
  const handleShortcutMenuOpenChange = useCallback(
    (shortcutKey: string, isOpen: boolean) => {
      setOpenShortcutMenuKey(isOpen ? shortcutKey : null);
    },
    [],
  );
  const handleShortcutContextMenu = useCallback(
    (event: MouseEvent, shortcutKey: string) => {
      event.preventDefault();
      setOpenShortcutMenuKey(shortcutKey);
    },
    [],
  );
  const handleUnpinShortcut = useCallback(
    (shortcut: LauncherShortcut) => {
      controller.handleTogglePin(shortcut);
      setOpenShortcutMenuKey(null);
    },
    [controller],
  );

  return (
    <div className="heroui-scope pointer-events-none fixed bottom-4 left-1/2 z-[260] -translate-x-1/2 min-[1300px]:bottom-auto min-[1300px]:left-auto min-[1300px]:right-5 min-[1300px]:top-1/2 min-[1300px]:-translate-y-1/2 min-[1300px]:translate-x-0">
      <nav
        aria-label="Dock de módulos"
        className="pointer-events-auto flex max-w-[calc(100vw-1rem)] items-stretch gap-1 overflow-x-auto rounded-[22px] border border-neutral-200/80 bg-white/95 p-1.5 shadow-xl shadow-neutral-900/10 backdrop-blur-xl min-[1300px]:max-w-none min-[1300px]:flex-col min-[1300px]:overflow-visible"
      >
        {controller.pinnedShortcuts.map((shortcut) => {
          const isActive = isShortcutActive(pathname, shortcut.route);
          const label = getDockLabel(shortcut);

          return (
            <VmDropdown
              key={shortcut.key}
              isOpen={openShortcutMenuKey === shortcut.key}
              onOpenChange={(isOpen) =>
                handleShortcutMenuOpenChange(shortcut.key, isOpen)
              }
              trigger="longPress"
            >
              <VmButton
                aria-label={shortcut.title}
                className={[
                  'flex h-[58px] w-[58px] min-w-[58px] flex-col justify-center gap-1 rounded-[14px] border px-1.5 shadow-sm transition min-[1300px]:w-[66px] min-[1300px]:min-w-[66px]',
                  isActive
                    ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-blue-900/10'
                    : 'border-neutral-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
                ].join(' ')}
                onContextMenu={(event) =>
                  handleShortcutContextMenu(event, shortcut.key)
                }
                onPress={() => navigateToShortcut(shortcut)}
                size="sm"
                variant={isActive ? 'secondary' : 'ghost'}
              >
                <ShortcutIcon>{shortcut.icon}</ShortcutIcon>
                <span className="max-w-full truncate text-[10px] font-semibold leading-none tracking-normal">
                  {label}
                </span>
              </VmButton>
              <VmDropdown.Popover className="z-[320] min-w-44" placement="top">
                <VmDropdown.Menu
                  aria-label={`Acciones de ${shortcut.title}`}
                  onAction={(key) => {
                    if (key === 'unpin') handleUnpinShortcut(shortcut);
                  }}
                >
                  <VmDropdown.Item
                    id="unpin"
                    textValue="Quitar del dock"
                    variant="danger"
                  >
                    <span
                      className="inline-flex items-center gap-2"
                      data-slot="label"
                    >
                      <FontAwesomeIcon icon={faThumbtack} fixedWidth />
                      Quitar del dock
                    </span>
                  </VmDropdown.Item>
                </VmDropdown.Menu>
              </VmDropdown.Popover>
            </VmDropdown>
          );
        })}

        <div className="mx-0.5 h-10 w-px self-center bg-neutral-200 min-[1300px]:mx-0 min-[1300px]:my-0.5 min-[1300px]:h-px min-[1300px]:w-12" />

        <span
          className="relative inline-flex h-[58px] min-w-[60px] min-[1300px]:w-[66px] min-[1300px]:min-w-[66px]"
          title="Módulos"
        >
          <VmButton
            aria-label="Ver módulos"
            className="flex h-[58px] w-[60px] min-w-[60px] flex-col justify-center gap-1 rounded-[14px] bg-blue-600 px-1.5 text-white shadow-md shadow-blue-900/20 hover:bg-blue-700 min-[1300px]:w-[66px] min-[1300px]:min-w-[66px]"
            onPress={onOpenModules}
            size="sm"
            variant="primary"
          >
            <FontAwesomeIcon icon={faGrip} />
            <span className="max-w-full truncate text-[10px] font-semibold leading-none tracking-normal">
              Módulos
            </span>
          </VmButton>
          {alertCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white min-[1300px]:right-0 min-[1300px]:top-0">
              {alertCount}
            </span>
          ) : null}
        </span>
      </nav>
    </div>
  );
};
