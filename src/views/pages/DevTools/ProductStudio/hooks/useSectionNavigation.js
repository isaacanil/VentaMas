import { useCallback, useEffect, useRef, useState } from 'react';

import { FORM_SECTIONS, getSectionDomId } from '../utils/sections';

const SCROLL_OFFSET = 12;
const SECTION_ACTIVATION_THRESHOLD = 140;

export const useSectionNavigation = () => {
  const scrollContainerRef = useRef(null);
  const [activeSection, setActiveSection] = useState(FORM_SECTIONS[0].id);

  const handleSectionNavigation = useCallback((sectionId) => {
    if (typeof document === 'undefined') {
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
      let currentSection = FORM_SECTIONS[0].id;
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
