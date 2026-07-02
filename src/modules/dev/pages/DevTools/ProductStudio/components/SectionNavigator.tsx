import styled from 'styled-components';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, FC, MouseEvent as ReactMouseEvent } from 'react';

import {
  FORM_SECTIONS,
  type SectionConfig,
  type SectionId,
} from '../utils/sections';

const SectionNavigatorWrapper = styled.aside`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
  padding: 32px 16px;
  background: #fff;
  border-right: 1px solid #e2e8f0;

  @media (width <= 992px) {
    position: static;
    flex-direction: row;
    inline-size: 100%;
    max-inline-size: 100%;
    min-inline-size: 0;
    height: auto;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-inline: contain;
    border-right: none;
    padding: 0;
    scroll-padding-inline: 4px;
    touch-action: pan-x;

    /* Hide scrollbar for cleaner look on mobile */
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const NavList = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (width <= 992px) {
    flex-direction: row;
    flex-wrap: nowrap;
    width: max-content;
    min-width: 100%;
  }
`;

const ActiveIndicator = styled.div`
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  z-index: 0;
  pointer-events: none;
  background: var(--color);
  border-radius: 12px;
  box-shadow: 0 10px 24px rgb(37 99 235 / 0.22);
  opacity: 1;
  transition:
    transform 180ms ease,
    width 180ms ease,
    height 180ms ease,
    opacity 140ms ease;
  will-change: transform;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

interface NavButtonProps {
  $active?: boolean;
}

const NavButton = styled.button<NavButtonProps>`
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
  font-family: inherit;
  font-weight: 600;
  color: ${({ $active }) => ($active ? '#ffffff' : '#0f172a')};
  text-align: left;
  cursor: pointer;
  background: ${({ $active }) => ($active ? 'transparent' : '#f8fafc')};
  border: none;
  border-radius: 12px;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    background: ${({ $active }) => ($active ? 'transparent' : '#e2e8f0')};
  }

  &:focus-visible {
    outline: 3px solid rgb(37 99 235 / 0.25);
    outline-offset: 2px;
  }

  svg {
    font-size: 18px;
  }

  @media (width <= 992px) {
    flex-shrink: 0;
    min-height: 44px;
    white-space: nowrap;
  }
`;

interface IndicatorGeometry {
  height: number;
  width: number;
  x: number;
  y: number;
}

interface SectionNavigatorProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  sections?: SectionConfig[];
}

export const SectionNavigator: FC<SectionNavigatorProps> = ({
  activeSection,
  onNavigate,
  sections = FORM_SECTIONS,
}) => {
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Partial<Record<SectionId, HTMLButtonElement>>>({});
  const activeSectionRef = useRef(activeSection);
  const measureFrameRef = useRef<number | null>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragDistance = useRef(0);
  const [indicatorGeometry, setIndicatorGeometry] =
    useState<IndicatorGeometry | null>(null);

  const scheduleIndicatorMeasure = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (measureFrameRef.current !== null) {
      window.cancelAnimationFrame(measureFrameRef.current);
    }

    measureFrameRef.current = window.requestAnimationFrame(() => {
      measureFrameRef.current = null;

      const sectionId = activeSectionRef.current as SectionId;
      const activeButton = buttonRefs.current[sectionId];
      const navElement = navRef.current;
      if (!activeButton) {
        setIndicatorGeometry(null);
        return;
      }

      setIndicatorGeometry((previous) => {
        const next = {
          height: activeButton.offsetHeight,
          width: activeButton.offsetWidth,
          x: activeButton.offsetLeft,
          y: activeButton.offsetTop,
        };

        if (
          previous?.height === next.height &&
          previous.width === next.width &&
          previous.x === next.x &&
          previous.y === next.y
        ) {
          return previous;
        }

        return next;
      });

      if (navElement && navElement.scrollWidth > navElement.clientWidth) {
        const prefersReducedMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)',
        ).matches;

        activeButton.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    });
  }, []);

  const setButtonRef = useCallback(
    (sectionId: SectionId) => (element: HTMLButtonElement | null) => {
      if (element) {
        buttonRefs.current[sectionId] = element;
        return;
      }
      delete buttonRefs.current[sectionId];
    },
    [],
  );

  useEffect(() => {
    activeSectionRef.current = activeSection;
    scheduleIndicatorMeasure();
  }, [activeSection, scheduleIndicatorMeasure]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', scheduleIndicatorMeasure);
      return () => {
        window.removeEventListener('resize', scheduleIndicatorMeasure);
        if (measureFrameRef.current !== null) {
          window.cancelAnimationFrame(measureFrameRef.current);
        }
      };
    }

    const observer = new ResizeObserver(() => {
      scheduleIndicatorMeasure();
    });
    if (listRef.current) {
      observer.observe(listRef.current);
    }

    return () => {
      observer.disconnect();
      if (measureFrameRef.current !== null) {
        window.cancelAnimationFrame(measureFrameRef.current);
      }
    };
  }, [scheduleIndicatorMeasure]);

  const handleMouseDown = (e: ReactMouseEvent) => {
    isDown.current = true;
    dragDistance.current = 0;
    if (navRef.current) {
      startX.current = e.pageX - navRef.current.offsetLeft;
      scrollLeft.current = navRef.current.scrollLeft;
    }
  };

  const handleMouseLeave = () => {
    isDown.current = false;
  };

  const handleMouseUp = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDown.current) return;

    dragDistance.current += Math.abs(e.movementX) || 1;

    // Prevent default selection text highlighting
    e.preventDefault();

    if (navRef.current) {
      const x = e.pageX - navRef.current.offsetLeft;
      // Scroll distance is multiplied by 2 for smoother/faster drag feeling
      const walk = (x - startX.current) * 2;
      navRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };

  const handleItemClick = (e: ReactMouseEvent, sectionId: string) => {
    // If the user was dragging the menu horizontally, do not trigger the navigation click
    if (dragDistance.current > 5) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onNavigate(sectionId);
  };

  const indicatorStyle: CSSProperties | undefined = indicatorGeometry
    ? {
        width: indicatorGeometry.width,
        height: indicatorGeometry.height,
        transform: `translate3d(${indicatorGeometry.x}px, ${indicatorGeometry.y}px, 0)`,
      }
    : undefined;

  return (
    <SectionNavigatorWrapper
      ref={navRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      style={{ userSelect: 'none' }}
    >
      <NavList ref={listRef}>
        {indicatorGeometry ? (
          <ActiveIndicator
            aria-hidden="true"
            data-section-nav-indicator="true"
            style={indicatorStyle}
          />
        ) : null}
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <NavButton
              key={section.id}
              ref={setButtonRef(section.id)}
              type="button"
              aria-current={activeSection === section.id ? 'step' : undefined}
              data-section-nav-button={section.id}
              onClick={(e) => handleItemClick(e, section.id)}
              $active={activeSection === section.id}
            >
              <Icon />
              <span>{section.label}</span>
            </NavButton>
          );
        })}
      </NavList>
    </SectionNavigatorWrapper>
  );
};
