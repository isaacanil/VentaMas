import React from 'react';
import { Grid } from '../../../..';
import { Product } from '../../../../templates/system/Product/Product/Product';
import { CustomProduct } from '../../../../templates/system/Product/CustomProduct';
import styled from 'styled-components';
import { motion } from 'framer-motion';

export const CategoriesGrouped = ({ products, viewRowModeRef }) => {
    const productsByCategory = products.reduce((result, { product }) => {
        const category = product.category
        if (!result[category]) { result[category] = [] }
        result[category].push(product)
        return result
      }, {})
    const containerVariants = {
        hidden: { opacity: 1, scale: 0 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                delayChildren: 0.3,
                staggerChildren: 0.2
            }
        }
    }
    const categoryGroupVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
          
        }
    }
    return (
        Object.keys(productsByCategory)
            .sort((a, b) => a < b ? 1 : -1)
            .map((category, index) => (
                <CategoryGroup key={index}
                    variants={categoryGroupVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 1, delay: index * 0.5 }}
                >
                    <Title>{category}</Title>
                    <Grid
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        padding='bottom'
                        columns='4'
                        isRow={viewRowModeRef ? true : false}
                    >
                        {productsByCategory[category].map((product, index) => (
                            product.custom ?
                                (
                                    <CustomProduct key={index} product={product}></CustomProduct>
                                ) : (
                                    <Product
                                        key={index}
                                        view='row'
                                        product={product}
                                    />
                                )
                        ))}
                    </Grid>
                </CategoryGroup>
            ))
    );
}

const CategoryGroup = styled(motion.div)`
:first-child{
    margin-top: 0;
}
    margin-bottom: 2em;
    span{
        margin: 1em;
        margin-bottom: 2em;
        font-size: 1em;
        font-weight: 550;
        color: var(--Gray8);
    }
`
const Title = styled.div`
        margin: 1em;
        margin-bottom: 1em;
        font-size: 1em;
        font-weight: 550;
        color: var(--Gray8);
`