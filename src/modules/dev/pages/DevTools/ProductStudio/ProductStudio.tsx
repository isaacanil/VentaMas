import ImageManager from '@/components/modals/ProductForm/ImageManager/ImageManager';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

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

export default function ProductStudio() {
  const { scrollContainerRef, activeSection, handleSectionNavigation } =
    useSectionNavigation();
  const {
    form,
    product,
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

  return (
    <PageContainer>
      <MenuApp
        sectionName={isUpdateMode ? 'Editando producto' : 'Creando producto'}
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
                  sectionDomIds={sectionDomIds}
                  product={product}
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

              <ImageManager
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
                />
              </MobileBottomNav>
            )}
            <StudioErrors product={product} />
            <ActionBar
              isUpdateMode={isUpdateMode}
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
