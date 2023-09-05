import React from 'react';
import { Grid } from '../../../..';
import { Product } from '../../../../templates/system/Product/Product/Product';
import { CustomProduct } from '../../../../templates/system/Product/CustomProduct';
import styled from 'styled-components';
import { motion } from 'framer-motion';

export const CategoriesGrouped = ({ productsByCategory, viewRowModeRef }) => {
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
    return (
        Object.keys(productsByCategory)
            .sort((a, b) => a < b ? 1 : -1)
            .map((category, index) => (
                <CategoryGroup key={index}>
                    <h2>{category}</h2>
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
    h2{
        font-size: 1em;
        font-weight: 550;
        color: var(--Gray8);
        
    }
`