import React, { useState, useEffect } from 'react'
import { getCat } from '../../../../firebase/firebaseconfig'

export const SelectCategory = () => {
    const [categories, setCategories] = useState([])
    useEffect(() => {
        getCat(setCategories)

    }, [])
    console.log(categories)
    return (
        <select name="" id="">
            <option value="">categoría</option>
            {
                categories.length > 0 ?
                    categories.map((item, index) => (
                        <option key={index}>{item.category.name}</option>
                    ))
                    : null
            }
        </select>
    )
}
