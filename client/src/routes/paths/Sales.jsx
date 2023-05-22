import { useGetProducts } from '../../firebase/products/fbGetProducts';
import {Registro, Sales} from '../../views'
import validateRouteAccess from '../requiereAuthProvider';
import ROUTES_NAME from '../routesName';

const {SALES_TERM} = ROUTES_NAME;
const {SALES, BILLS} = SALES_TERM;

const Routes = [
    {path: "/sales", element: validateRouteAccess(<Sales />), name: SALES},
    {path: "/bills", element: validateRouteAccess(<Registro />), name: BILLS }
]

export default Routes;