import { useCallback, useEffect, useRef, useState } from 'react';

import {
  FORM_SECTIONS,
  getSectionDomId,
  type SectionConfig,
  type SectionId,
} from '../utils/sections';

const SCROLL_OFFSET = 12;
const SECTION_ACTIVATION_THRESHOLD = 140;

const isSectionId = (
  value: string,
  sections: SectionConfig[],
): value is SectionId => sections.some((section) => section.id === value);

export const useSectionNavigation = (
  sections: SectionConfig[] = FORM_SECTIONS,
) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const firstSection = sections[0]?.id ?? 'identity';
  const [activeSection, setActiveSection] = useState<SectionId>(firstSection);
  const effectiveActiveSection = sections.some(
    (section) => section.id === activeSection,
  )
    ? activeSection
    : firstSection;

  const handleSectionNavigation = useCallback(
    (sectionId: string) => {
      if (typeof document === 'undefined') {
        return;
      }
      if (!isSectionId(sectionId, sections)) {
        return;
      }
      const container = scrollContainerRef.current;
      const target = document.getElementById(getSectionDomId(sectionId));
      if (!container || !target) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const offsetTop =
        targetRect.top -
        containerRect.top +
        container.scrollTop -
        SCROLL_OFFSET;

      container.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    },
    [sections],
  );

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const updateActiveSection = () => {
      scrollFrameRef.current = null;
      let currentSection: SectionId = firstSection;
      const containerRect = container.getBoundingClientRect();

      sections.forEach((section) => {
        const element = document.getElementById(getSectionDomId(section.id));
        if (!element) {
          return;
        }
        const relativeTop =
          element.getBoundingClientRect().top - containerRect.top;
        if (relativeTop <= SECTION_ACTIVATION_THRESHOLD) {
          currentSection = section.id;
        }
      });

      setActiveSection((prev) =>
        prev === currentSection ? prev : currentSection,
      );
    };

    const handleScroll = () => {
      if (scrollFrameRef.current !== null) {
        return;
      }

      scrollFrameRef.current = window.requestAnimationFrame(
        updateActiveSection,
      );
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    scrollFrameRef.current = window.requestAnimationFrame(updateActiveSection);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [firstSection, sections]);

  return {
    scrollContainerRef,
    activeSection: effectiveActiveSection,
    handleSectionNavigation,
  };
};
