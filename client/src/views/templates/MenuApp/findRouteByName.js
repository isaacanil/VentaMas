import { routes } from "../../../routes/routes";

function findRouteByName(name) {
  function findRoute(routes) {
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].name === name) {
        return routes[i];
      } else if (routes[i].children) {
        const foundRoute = findRoute(routes[i].children);
        if (foundRoute) return foundRoute;
      }
    }
    return null;
  }
  return findRoute(routes);
}

export default findRouteByName;