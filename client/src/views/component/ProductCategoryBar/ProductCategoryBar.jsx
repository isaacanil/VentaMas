import React from 'react'
import { CategorySelector } from '../CategorySelector/CategorySelector'
import { useFbGetCategories } from '../../../firebase/categories/useFbGetCategories'
import { useDispatch, useSelector } from 'react-redux'
import { SelectCategoryList, addCategory } from '../../../features/category/categorySlicer'
import { fbAddFavoriteProductCategory } from '../../../firebase/categories/fbAddFavoriteProductCategory'
import { selectUser } from '../../../features/auth/userSlice'
import { fbGetFavoriteProductCategories, useGetFavoriteProductCategories } from '../../../firebase/categories/fbGetFavoriteProductCategories'
import { filterFavoriteProductCategories } from '../../../utils/data/products/category'
import { fbRemoveFavoriteProductCategory } from '../../../firebase/categories/fbRemoveFavoriteProductCategory'
export const ProductCategoryBar = () => {
  const user = useSelector(selectUser)
  const { categories } = useFbGetCategories()
  const categorySelected = useSelector(SelectCategoryList)
  const favoriteProductCategoryArray = useGetFavoriteProductCategories(user)
  const favoriteCategory = filterFavoriteProductCategories(categories, favoriteProductCategoryArray.favoriteCategories)
  console.log('favoriteCategory', favoriteCategory)
  const handleAddFavorite = async (category) => {
    await fbAddFavoriteProductCategory(user, category)
  }
  const handleDeleteFavorite = async (category) => {
   
    try {
      await fbRemoveFavoriteProductCategory(user, category.id)
    }catch (error) {
      console.error('Error al eliminar categoría de favoritos: ', error)
    }
  }
  const dispatch = useDispatch()
  const handleProductCategory = (category) => {
    dispatch(addCategory(category))
  }
  return (
    <CategorySelector
      categories={categories}
      favoriteCategories={favoriteCategory}
      handleCategoryClick={handleProductCategory}
      addFavoriteCategory={handleAddFavorite}
      deleteFavoriteCategory={handleDeleteFavorite}
      categoriesSelected={categorySelected}
    />
  )
}
