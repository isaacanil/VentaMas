import executeCommand from './handlers/executeCommand';
import {
  getAllCommandSuggestions,
  getCommandSuggestions,
} from './utils/commandSuggestions';
import { createDataLoaders } from './utils/dataLoaders';
import { getAllRoutes, filterRoutes } from './utils/routeHelpers';

/**
 * Procesa todos los comandos ingresados en la consola de desarrollador
 */
class CommandProcessor {
  constructor(deps) {
    this.dispatch = deps.dispatch;
    this.navigate = deps.navigate;
    this.user = deps.user;
    this.isTestMode = deps.isTestMode;
    this.isTemporaryMode = deps.isTemporaryMode;
    this.originalBusinessId = deps.originalBusinessId;
    this.isTemporaryRoleMode = deps.isTemporaryRoleMode;
    this.originalRole = deps.originalRole;
    this.addOutput = deps.addOutput;
    this.addCommandEcho = deps.addCommandEcho;
    this.setReactScanLoaded = deps.setReactScanLoaded;
    this.reactScanLoaded = deps.reactScanLoaded;
    this.setBusinesses = deps.setBusinesses;
    this.businesses = deps.businesses;
    this.enterSelectionMode = deps.enterSelectionMode;

    const dataLoaders = createDataLoaders(this);
    this.loadBusinessesList = dataLoaders.loadBusinessesList;
    this.loadUsersList = dataLoaders.loadUsersList;
    this.loadProductsForLookup = dataLoaders.loadProductsForLookup;
    this.findProductsByName = dataLoaders.findProductsByName;
    this.changeUserPassword = dataLoaders.changeUserPassword;
  }

  getAllCommandSuggestions() {
    return getAllCommandSuggestions();
  }

  getCommandSuggestions(input) {
    return getCommandSuggestions(input);
  }

  getAllRoutes() {
    return getAllRoutes();
  }

  filterRoutes(searchText) {
    return filterRoutes(searchText);
  }

  async executeCommand(command) {
    return executeCommand.call(this, command);
  }
}

export default CommandProcessor;
