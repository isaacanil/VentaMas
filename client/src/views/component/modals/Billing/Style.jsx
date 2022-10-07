import styled from "styled-components"

export const Container = styled.div`
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.300);
    backdrop-filter: blur(10px);

    
`
export const BillingWrapper = styled.div`
    height: 580px;
    width: 94%;
    max-width: 1000px;
    display: grid;
    grid-template-rows: 3em 1fr;
    position: relative;
    border: 1px solid rgba(0, 0, 0, 0.400);
    border-radius: 10px;
    overflow: hidden;
    background-color: rgba(255, 255, 255, 0.800);
    backdrop-filter: blur(70px);
    
`
export const Head = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(0, 0, 0, 0.500);
    padding: 0.5em 1em;
    background-color: #424242;
    color: white;
`
export const Body = styled.div`
  
    padding: 1em;
    display: grid;
    grid-template-rows: min-content min-content 1fr 3em;
    align-items: flex-start;
    gap: 0.6em;
    height: 100%;
    position: relative;

`

export const Main = styled.div`
    display: grid;
    gap: 0.5em;
    grid-template-columns: 1.2fr 1fr;
    align-items: stretch;
    background-color: rgb(200, 200, 200);
    border-radius: 10px;
    padding: 0.4em 0.5em;
    max-height: 400px;
    position: relative;

    


  
`
export const ProductView = styled.div`
    background-color: #ffffffab;
    border-radius: 10px;
    padding: 0;
    overflow: hidden;
    position: relative;
    
    `
export const ProductList = styled.ul`
    list-style: none;
    padding: 0;
    height: 300px;
    display: flex;
    flex-direction: column; 
    

    background-color: #fdfdfd;
  
    gap: 0.4em;
    overflow-y: scroll;
    padding: 0.4em 1em 1em;
    
`
export const Product = styled.li`
    border: 1px solid rgba(0, 0, 0, 0.240);
    border-radius: 10px;
    background-color: rgb(258, 258, 258);
    padding: 0.2em 0;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.100);


`
export const Product_Col = styled.div`
    font-weight: 600;
`
export const ITBIS_Col = styled.div`
    font-weight: 600;
`
export const Precio_Col = styled.div`
    font-weight: 600;
`
export const ProductName = styled.div`
   text-transform: uppercase;
   font-weight: 600;
    width: 180px;
    font-size: 0.8em;
    line-height: 1pc;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;  
    //white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    
`
export const ProductItbis = styled.div`

`
export const ProductPrecio = styled.div`
    
`

export const ProductAmount = styled.div`
margin: 0;
    
`
const Input = styled.input`
    background-color: #ffffff;
    border: 1px solid rgba(3, 3, 3, 0.300);
    padding: 0.3em 0.8em;
    &:focus{
        outline: none;
    }
`
export const InputText = styled(Input).attrs({
    type: 'text',
})`
   ${(props) => {
        switch (props.border) {
            case 'circle':
                return `
                border-radius: 10px;
                `
            default:
                break;
        }
    }}
`
export const InputNumber = styled(Input).attrs({
    type: 'number',
})`
    &::-webkit-inner-spin-button, &::-webkit-outer-spin-button{
        -webkit-appearance: none;
        margin: 0;
    }
     ${(props) => {
        switch (props.size) {
            case 'small':
                return `
                width: 6em;
                `
            default:
                break;
        }

    }}
    ${(props) => {
        switch (props.border) {
            case 'circle':
                return `
                border-radius: 10px;
                `
            default:
                break;
        }
    }}
`
export const InputGroup = styled.div`
    display: flex;
`
export const Row = styled.div`
    display: grid;
    padding: 0 0.2em;
    label{
        font-weight: 600;
    }
    ${(props) => {
        switch (props.padding) {
            case 'normal':
                return `
                padding: 0.4em;
             
                `
            default:
                break;
        }
    }}
    ${(props) => {
        switch (props.fontWeight) {
            case 'title':
                return `
                font-weight: 600;
                font-size: 16px;
                `
            default:
                break;
        }
    }}
    ${(props) => {
        switch (props.borderRadius) {
            case 'normal':
                return `
                border-radius: 10px;
                `
            default:
                break;
        }
    }}
    ${(props) => {
        switch (props.bgColor) {
            case 'black':
                return `
                background-color: #666666;
                color: white;
                `
            case 'primary':
                return `
                background-color: rgb(69,137,216);
                color: white;
                `
            case 'gray2':
                return `
                background-color: #9b9b9b;
                color: #383838;
                `
            default:
                break;
        }
    }}

    ${(props) => {
        switch (props.columns) {
            case 'payment':
                return `
            grid-template-columns:  auto minmax(80px, 1fr) minmax(60px, 1fr) minmax(60px, 1fr);
            `
            case 'product-list':
                return `
            grid-template-columns:  2fr 1fr 1fr;
            padding: 0 1em;
            `
            case '2':
                return `
                grid-template-columns: 1fr 2fr ;
                `
        }
    }}
  
   
    justify-content: center;
    align-items: center;
    align-content: center;
    gap: 1em;
    
`
export const Col = styled.div`

`
export const Grid = styled.div`
    display: grid;
    gap: 0.5em;
`
export const GridTitle = styled.div`
    display: Grid;
    grid-template-columns: 1fr;
`
export const Footer = styled.div`
    display: grid;
    justify-content: right;
`