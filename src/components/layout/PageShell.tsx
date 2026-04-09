import styled from 'styled-components';

/**
 * Base flex-column container that fills its parent.
 * Use as-is or extend with styled(PageShell)`...`.
 *
 * Every level between DashboardLayout's <Content> and the
 * scrollable element needs `flex: 1 1 auto; min-height: 0`.
 * PageShell provides exactly that.
 */
export const PageShell = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
`;

/**
 * PageShell + overflow hidden.
 * Use when the page contains a scrollable child (table, list)
 * and you need to prevent double scrollbars.
 */
export const PageBody = styled(PageShell)`
  overflow: hidden;
`;

/**
 * The most common page layout: flex column that fills the
 * available space, contains overflow, and has the standard
 * page background color.
 *
 * Use for pages with MenuApp + FilterBar + Table/List.
 *
 * @example
 * ```tsx
 * export const MyPage = () => (
 *   <PageLayout>
 *     <MenuApp sectionName="Mi Sección" />
 *     <FilterBar />
 *     <MyTable />
 *   </PageLayout>
 * );
 * ```
 */
export const PageLayout = styled(PageBody)`
  background-color: var(--color2);
`;
