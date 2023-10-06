const fontPrimary = sans-serif;
const fontSecondary = serif;

/* set base values */
const textBaseSize = "1em";
const textScaleRatio = 1.2;

const fontSize = {
    h1: {
        base: '1.8rem',
        large: '2.125rem',
    }, 
    h2: {
        base: '1.3rem',
        large: '1.4rem',
    },
    h3: {
        base: '1.1rem',
        large: '1.25rem',
    },
    h4: {
        base: '0.9rem',
        large: '1rem',
    },
    h5: {
        base: '0.8rem',
        large: '0.875rem',
    },
    h6: {
        base: '0.7rem',
        large: '0.75rem',
    },
    subtitle1: {
        base: '0.9rem',
        large: '1rem',
    },
    subtitle2: {
        base: '0.8rem',
        large: '0.875rem',
    },
    body1: {
        base: '0.9rem',
        large: '1rem',
    },
    body2: {
        base: '0.8rem',
        large: '0.875rem',
    },
    caption: {
        base: '0.7rem',
        large: '0.75rem',
    },
    overline: {
        base: '0.7rem',
        large: '0.75rem',
    },
    span: {
        base: '0.7rem',
        large: '0.75rem',
    },
}
const typography = {
    // Estilos para elementos de formulario
    fontSize: {
        xsm: '0.75rem', //12px
        sm: '0.875rem', //14px
        base: '1rem',   //16px
        lg: '1.125rem', //18px
        '2xl': '1.563rem', //25px
        ...fontSize
    },
    fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        bold: 700,
    },
    // Estilos para elementos de formulario
    form: {
        fontSize: {
            small: '0.8rem',
            medium: '0.875rem',
            large: '1rem',
        },
        fontWeight: 400,
        lineHeight: '1.25rem',
    },
    // Estilos para elementos de formulario
    variants: {
        h1: {
            base:`
                font-size: 1.8rem;
                font-weight: 700;
                line-height: 3.125rem;
                margin: 1.5rem 0;
            `,
        },
        h2: {
            base:`
                font-size: 1.3rem;
                font-weight: 600;
                line-height: 2.25rem;
                margin: 1.5rem 0;
            `,
        },
        h3: {
            base: `
                font-size: 1.1rem;
                font-weight: 600;
                line-height: 1.875rem;
                margin: 1.5rem 0;
            `
        },
        h4: {
            base: `
                font-size: 0.9rem;
                font-weight: 500;
                line-height: 1.5rem;
                margin: 1.5rem 0;
            `
        },
        h5: {
           base: `
                font-size: 0.8rem;
                font-weight: 500;
                line-height: 1.25rem;
                margin: 1.5rem 0;
            `
        },
        h6: {
            base: `
                font-size: 0.7rem;
                font-weight: 500;
                line-height: 1rem;
                margin: 1.5rem 0;
            `
        },
        subtitle1: {
           base: `
                font-size: 0.9rem;
                font-weight: 500;
                line-height: 1.5rem;
                margin: 1.5rem 0;
            `
        },
        subtitle2: {
            base: `
                font-size: 0.8rem;
                font-weight: 500;
                line-height: 1.25rem;
                margin: 1.5rem 0;
            `
        },
        body1: {
            base: `
                font-size: 0.9rem;
                font-weight: 400;
                line-height: 1.5rem;
                margin: 1.5rem 0;
            `
        },
        body2: {
            base: `
                font-size: 0.8rem;
                font-weight: 400;
                line-height: 1.25rem;
                margin: 1.5rem 0;
            `
        },    
        caption: {
            base:`
                font-size: 0.7rem;
                font-weight: 400;
                line-height: 1rem;
                margin: 1.5rem 0;
            `
        },
        overline: {
            base: `
                font-size: 0.7rem;
                font-weight: 400;
                line-height: 1rem;
                margin: 1.5rem 0;
            `
        },
        span: {
            base: `
                font-size: 0.7rem;
                font-weight: 400;
                line-height: 1rem;
                margin: 1.5rem 0;
            `
        },
    }

}
