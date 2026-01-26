import { useCallback, useEffect, useRef, useState } from 'react';

import { FORM_SECTIONS, getSectionDomId, type SectionId } from '../utils/sections';

const SCROLL_OFFSET = 12;
const SECTION_ACTIVATION_THRESHOLD = 140;

const isSectionId = (value: string): value is SectionId =>
  FORM_SECTIONS.some((section) => section.id === value);

export const useSectionNavigation = () => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const initialSection = FORM_SECTIONS[0]?.id ?? 'identity';
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection);

  const handleSectionNavigation = useCallback((sectionId: string) => {
    if (typeof document === 'undefined') {
      return;
    }
    if (!isSectionId(sectionId)) {
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
      targetRect.top - containerRect.top + container.scrollTop - SCROLL_OFFSET;

    container.scrollTo({
      top: offsetTop,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      let currentSection: SectionId = FORM_SECTIONS[0]?.id ?? 'identity';
      const containerRect = container.getBoundingClientRect();

      FORM_SECTIONS.forEach((section) => {
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

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return {
    scrollContainerRef,
    activeSection,
    handleSectionNavigation,
  };
};
