export const filterFavoriteProductCategories = (
  categories = [],
  favoriteCategoryIds = [],
) =>
  categories.filter((category) =>
    favoriteCategoryIds.includes(category.category.id),
  );
