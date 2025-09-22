import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  selectIsTemporaryRoleMode,
  selectOriginalRole,
  selectUser,
  returnToOriginalRole,
  selectIsTemporaryMode,
  selectOriginalBusinessId,
  returnToOriginalBusiness,
} from '../../features/auth/userSlice';
import { getRoleLabelById } from '../../abilities/roles';
import { toggleDeveloperModal } from '../../features/modals/modalSlice';
import { developerShortcuts } from '../../constants/devtools/developerShortcuts.jsx';
import { hasDeveloperAccess } from '../../utils/menuAccess';

const BUTTON_SIZE = 48;
const PANEL_MIN_WIDTH = 420;
const PANEL_MAX_WIDTH = 720;

const DeveloperSessionHelper = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isTemporaryRoleMode = useSelector(selectIsTemporaryRoleMode);
  const originalRole = useSelector(selectOriginalRole);
  const isTemporaryBusinessMode = useSelector(selectIsTemporaryMode);
  const originalBusinessId = useSelector(selectOriginalBusinessId);
  const developerAccess = hasDeveloperAccess();

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(() => ({ x: 0, y: 0 }));
  const [hasInitialPosition, setHasInitialPosition] = useState(false);

  const dragState = useRef({ isDragging: false, offsetX: 0, offsetY: 0, moved: false });

  const roleSectionEnabled = Boolean(isTemporaryRoleMode && originalRole === 'dev');
  const businessSectionEnabled = Boolean(
    isTemporaryBusinessMode && originalBusinessId && (originalRole === 'dev' || user?.role === 'dev')
  );
  const developerOptions = useMemo(() => {
    if (!developerAccess) return [];
    return developerShortcuts.map(item => ({ ...item }));
  }, [developerAccess]);

  const groupedShortcuts = useMemo(() => {
    if (!developerOptions.length) return [];

    return developerOptions.reduce((groups, shortcut) => {
      const existingGroup = groups.find(group => group.category === shortcut.category);

      if (existingGroup) {
        existingGroup.items.push(shortcut);
        return groups;
      }

      return [...groups, { category: shortcut.category, items: [shortcut] }];
    }, []);
  }, [developerOptions]);

  const hasDeveloperShortcuts = groupedShortcuts.length > 0;

  const shouldRender = roleSectionEnabled || businessSectionEnabled || hasDeveloperShortcuts;

  const clampPosition = useCallback((x, y) => {
    if (typeof window === 'undefined') {
      return { x, y };
    }

    const padding = 12;
    const maxX = Math.max(padding, window.innerWidth - BUTTON_SIZE - padding);
    const maxY = Math.max(padding, window.innerHeight - BUTTON_SIZE - padding);

    return {
      x: Math.min(Math.max(x, padding), maxX),
      y: Math.min(Math.max(y, padding), maxY),
    };
  }, []);

  useEffect(() => {
    if (!shouldRender) {
      setIsOpen(false);
    }
  }, [shouldRender]);

  useEffect(() => {
    if (hasInitialPosition || typeof window === 'undefined') {
      return;
    }

    const padding = 24;
    const initialX = window.innerWidth - BUTTON_SIZE - padding;
    const initialY = window.innerHeight - BUTTON_SIZE - padding;

    setPosition({ x: initialX, y: initialY });
    setHasInitialPosition(true);
  }, [hasInitialPosition]);

  const handlePointerMove = useCallback((event) => {
    const { isDragging, offsetX, offsetY } = dragState.current;
    if (!isDragging) return;

    const nextX = event.clientX - offsetX;
    const nextY = event.clientY - offsetY;

    dragState.current.moved = true;
    setPosition(clampPosition(nextX, nextY));
  }, [clampPosition]);

  const handlePointerUp = useCallback(() => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);

    const { moved } = dragState.current;
    dragState.current = { isDragging: false, offsetX: 0, offsetY: 0, moved: false };

    if (!moved) {
      setIsOpen(prev => !prev);
    }
  }, [handlePointerMove]);

  const handlePointerDown = useCallback((event) => {
    if (!shouldRender) return;

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    dragState.current = {
      isDragging: true,
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y,
      moved: false,
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove, handlePointerUp, position.x, position.y, shouldRender]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setPosition(prevPosition => clampPosition(prevPosition.x, prevPosition.y));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  useEffect(() => () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove, handlePointerUp]);

  const handleKeyDown = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(prev => !prev);
    }
  };

  const handleRestoreRole = () => {
    dispatch(returnToOriginalRole());
  };

  const handleRestoreBusiness = () => {
    dispatch(returnToOriginalBusiness());
  };

  const handleShortcutSelect = shortcut => {
    if (shortcut.action === 'openDeveloperModal') {
      dispatch(toggleDeveloperModal());
      setIsOpen(false);
      return;
    }

    if (shortcut.route) {
      navigate(shortcut.route);
      setIsOpen(false);
      return;
    }

    console.warn('Acción de acceso rápido no implementada:', shortcut);
  };

  const currentRoleLabel = useMemo(() => getRoleLabelById(user?.role) || user?.role || 'N/A', [user?.role]);
  const originalRoleLabel = useMemo(() => getRoleLabelById(originalRole) || originalRole || 'N/A', [originalRole]);

  const panelPlacement = useMemo(() => {
    if (typeof window === 'undefined') {
      return { vertical: 'top', horizontal: 'right' };
    }

    const vertical = position.y > window.innerHeight / 2 ? 'top' : 'bottom';
    const horizontal = position.x > window.innerWidth / 2 ? 'right' : 'left';
    return { vertical, horizontal };
  }, [position.x, position.y]);

  if (!shouldRender) {
    return null;
  }

  return (
    <Wrapper
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      data-open={isOpen}
    >
      <FloatingButton
        type="button"
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls="developer-session-helper-panel"
        title="Herramientas de sesión temporal"
        aria-label="Herramientas de sesión temporal"
      >
        ⚙️
      </FloatingButton>

      {isOpen && (
        <Panel
          id="developer-session-helper-panel"
          data-placement={`${panelPlacement.vertical}-${panelPlacement.horizontal}`}
        >
          <PanelHeader>
            <strong>Sesión temporal</strong>
            <CloseButton type="button" onClick={() => setIsOpen(false)}>
              ✕
            </CloseButton>
          </PanelHeader>

          <PanelBody>
            {roleSectionEnabled && (
              <Section>
                <SectionTitle>Rol temporal</SectionTitle>
                <SectionDescription>
                  Actualmente eres <strong>{currentRoleLabel}</strong>. El rol original es{' '}
                  <strong>{originalRoleLabel}</strong>.
                </SectionDescription>
                <ActionButton type="button" onClick={handleRestoreRole}>
                  Volver a rol original
                </ActionButton>
              </Section>
            )}

            {businessSectionEnabled && (
              <Section>
                <SectionTitle>Negocio temporal</SectionTitle>
                <SectionDescription>
                  ID actual: <strong>{user?.businessID || 'N/A'}</strong>
                  <br />
                  Negocio original: <strong>{originalBusinessId}</strong>
                </SectionDescription>
                <ActionButton type="button" onClick={handleRestoreBusiness}>
                  Volver a negocio original
                </ActionButton>
              </Section>
            )}

            {hasDeveloperShortcuts && (
              <ScrollableSection>
                <GroupedShortcuts>
                  {groupedShortcuts.map(group => (
                    <ShortcutGroup key={group.category}>
                      <ShortcutGroupTitle>{group.category}</ShortcutGroupTitle>
                      <ShortcutList>
                        {group.items.map(shortcut => (
                          <ShortcutButton key={shortcut.id} type="button" onClick={() => handleShortcutSelect(shortcut)}>
                            <ShortcutIcon>{shortcut.icon}</ShortcutIcon>
                            <ShortcutInfo>
                              <ShortcutName>{shortcut.title}</ShortcutName>
                            </ShortcutInfo>
                          </ShortcutButton>
                        ))}
                      </ShortcutList>
                    </ShortcutGroup>
                  ))}
                </GroupedShortcuts>
              </ScrollableSection>
            )}
          </PanelBody>
        </Panel>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: fixed;
  z-index: 2500;
  width: ${BUTTON_SIZE}px;
  height: ${BUTTON_SIZE}px;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FloatingButton = styled.button`
  width: ${BUTTON_SIZE}px;
  height: ${BUTTON_SIZE}px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #1f2933, #111827);
  color: #f7fafc;
  cursor: grab;
  font-size: 20px;
  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.45);
  }

  &:active {
    cursor: grabbing;
    transform: scale(0.97);
  }
`;

const Panel = styled.div`
  position: absolute;
  width: clamp(${PANEL_MIN_WIDTH}px, 50vw, ${PANEL_MAX_WIDTH}px);
  background: #0f172a;
  color: #f8fafc;
  border-radius: 16px;
  padding: 18px 0px;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.6);
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100vh - 120px);
  overflow: hidden;
  min-height: 0;

  &[data-placement='top-right'] {
    bottom: calc(100% + 16px);
    right: 0;
  }

  &[data-placement='top-left'] {
    bottom: calc(100% + 16px);
    left: 0;
  }

  &[data-placement='bottom-right'] {
    top: calc(100% + 16px);
    right: 0;
  }

  &[data-placement='bottom-left'] {
    top: calc(100% + 16px);
    left: 0;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  padding: 0 18px;
`;

const CloseButton = styled.button`
  border: none;
  background: transparent;
  color: #cbd5f5;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: #ffffff;
  }
`;

const PanelBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  flex: 1;
  overflow: hidden;
  min-height: 0;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(30, 41, 59, 0.85);
  border-radius: 12px;
  padding: 14px 14px;
  border: 1px solid rgba(99, 179, 237, 0.15);
`;

const ScrollableSection = styled(Section)`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-right: 8px;
  scrollbar-gutter: stable both-edges;
`;

const SectionTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: #63b3ed;
`;

const SectionDescription = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: #e2e8f0;
`;

const ActionButton = styled.button`
  align-self: flex-start;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  background-color: #63b3ed;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover,
  &:focus {
    background-color: #4299e1;
  }

  &:active {
    background-color: #3182ce;
  }
`;

const GroupedShortcuts = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const ShortcutGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ShortcutGroupTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #60a5fa;
  letter-spacing: 0.6px;
  text-transform: uppercase;
`;

const ShortcutList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ShortcutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.65);
  color: #e2e8f0;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.15s ease;

  &:hover,
  &:focus {
    background: rgba(30, 64, 175, 0.55);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ShortcutIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #63b3ed;
  font-size: 18px;
`;

const ShortcutInfo = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  text-align: left;
`;

const ShortcutName = styled.span`
  font-size: 13px;
  font-weight: 600;
`;

export default DeveloperSessionHelper;
