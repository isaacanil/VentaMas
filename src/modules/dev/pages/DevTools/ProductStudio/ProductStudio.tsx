import { MenuApp } from '@/modules/navigation/public';
import { productStudioProductEditorAdapters } from '@/modules/products/public';
import { useMemo } from 'react';

import { ActionBar } from './components/ActionBar';
import { ProductForm } from './components/form/ProductForm';
import { ModeBanner } from './components/ModeBanner';
import { ProductSummary } from './components/ProductSummary';
import { SectionNavigator } from './components/SectionNavigator';
import { StudioErrors } from './components/StudioErrors';
import {
  DesktopSidebar,
  MainContent,
  MobileBottomNav,
  PageContainer,
  ScrollArea,
  StickyActionBar,
  StickySummary,
  StudioGrid,
  StudioWrapper,
  Workspace,
} from './components/StudioLayout';
import { useProductStudioController } from './hooks/useProductStudioController';
import { useSectionNavigation } from './hooks/useSectionNavigation';
import { getProductStudioSections } from './utils/sections';

const ProductStudioImageManager =
  productStudioProductEditorAdapters.ImageManager;

const getStudioItemLabel = (product?: {
  itemType?: string | null;
  inventoryRole?: string | null;
}) => {
  if (product?.itemType === 'service') return 'servicio';
  if (product?.itemType === 'combo') return 'combo';
  if (
    product?.itemType === 'product' &&
    product?.inventoryRole === 'raw_material'
  ) {
    return 'materia prima';
  }
  return 'producto';
};

export default function ProductStudio() {
  const {
    form,
    product,
    businessId,
    categories,
    activeIngredients,
    previewSnapshot,
    previewMetrics,
    brandMeta,
    brandOptions,
    sectionDomIds,
    configureAddProductCategoryModal,
    handleValuesChange,
    handleOpenBrandModal,
    handleAddActiveIngredient,
    handleOpenImageManager,
    handleCloseImageManager,
    handleResetImage,
    handleToggleNavigation,
    handleToggleSummary,
    handleReset,
    handleSubmit,
    handleCancel,
    imageDrawerVisible,
    isUpdateMode,
    navigationVisible,
    submitting,
    summaryVisible,
  } = useProductStudioController();
  const visibleSections = useMemo(
    () => getProductStudioSections(product?.itemType, product?.inventoryRole),
    [product?.inventoryRole, product?.itemType],
  );
  const itemLabel = getStudioItemLabel(product);
  const isRawMaterial =
    product?.itemType === 'product' && product?.inventoryRole === 'raw_material';
  const sectionName = isRawMaterial
    ? 'Materia prima'
    : isUpdateMode
      ? `Editando ${itemLabel}`
      : `Creando ${itemLabel}`;
  const { scrollContainerRef, activeSection, handleSectionNavigation } =
    useSectionNavigation(visibleSections);

  return (
    <PageContainer>
      <MenuApp
        sectionName={sectionName}
        toolbarProps={{
          isUpdateMode,
          navigationVisible,
          summaryVisible,
          onToggleNavigation: handleToggleNavigation,
          onToggleSummary: handleToggleSummary,
        }}
      />
      <Workspace $showNavigator={navigationVisible}>
        {navigationVisible && (
          <DesktopSidebar>
            <SectionNavigator
              activeSection={activeSection}
              onNavigate={handleSectionNavigation}
              sections={visibleSections}
            />
          </DesktopSidebar>
        )}
        <MainContent>
          <ScrollArea ref={scrollContainerRef}>
            <StudioWrapper>
              <ModeBanner isUpdateMode={isUpdateMode} />

              <StudioGrid $showSummary={summaryVisible}>
                <ProductForm
                  form={form}
                  onValuesChange={handleValuesChange}
                  brandMeta={brandMeta}
                  brandOptions={brandOptions}
                  categories={categories}
                  activeIngredients={activeIngredients}
                  businessId={businessId}
                  sectionDomIds={sectionDomIds}
                  product={product}
                  isUpdateMode={isUpdateMode}
                  onOpenBrandModal={handleOpenBrandModal}
                  onAddCategory={configureAddProductCategoryModal}
                  onAddActiveIngredient={handleAddActiveIngredient}
                  onOpenImageManager={handleOpenImageManager}
                  onResetImage={handleResetImage}
                />

                {summaryVisible && (
                  <StickySummary>
                    <ProductSummary
                      product={previewSnapshot ?? undefined}
                      previewMetrics={previewMetrics}
                    />
                  </StickySummary>
                )}
              </StudioGrid>

              <ProductStudioImageManager
                open={imageDrawerVisible}
                onCancel={handleCloseImageManager}
              />
            </StudioWrapper>
          </ScrollArea>
          <StickyActionBar>
            {navigationVisible && (
              <MobileBottomNav>
                <SectionNavigator
                  activeSection={activeSection}
                  onNavigate={handleSectionNavigation}
                  sections={visibleSections}
                />
              </MobileBottomNav>
            )}
            <StudioErrors product={product} />
            <ActionBar
              isUpdateMode={isUpdateMode}
              itemLabel={itemLabel}
              submitting={submitting}
              onReset={handleReset}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </StickyActionBar>
        </MainContent>
      </Workspace>
    </PageContainer>
  );
}
