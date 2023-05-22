import { useMatch } from "react-router-dom";
import findRouteByName from "../findRouteByName";

export const useMatchRouteByName = (routeName) => {
    const route = findRouteByName(routeName);
    const match = useMatch(route?.path);
    return match;
}