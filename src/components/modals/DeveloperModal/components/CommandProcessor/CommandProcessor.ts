import executeCommand from './handlers/executeCommand';
import {
  getAllCommandSuggestions,
  getCommandSuggestions,
} from './utils/commandSuggestions';
import { createDataLoaders } from './utils/dataLoaders';
import { getAllRoutes, filterRoutes } from './utils/routeHelpers';
import type { CommandProcessorDeps, CommandProcessorInterface } from './types';

/**
 * Procesa todos los comandos ingresados en la consola de desarrollador
 */
class CommandProcessor implements CommandProcessorInterface {
  dispatch: CommandProcessorInterface['dispatch'];
  navigate: CommandProcessorInterface['navigate'];
  user: CommandProcessorInterface['user'];
  isTestMode: CommandProcessorInterface['isTestMode'];
  isTemporaryMode: CommandProcessorInterface['isTemporaryMode'];
  originalBusinessId: CommandProcessorInterface['originalBusinessId'];
  isTemporaryRoleMode: CommandProcessorInterface['isTemporaryRoleMode'];
  originalRole: CommandProcessorInterface['originalRole'];
  addOutput: CommandProcessorInterface['addOutput'];
  addCommandEcho: CommandProcessorInterface['addCommandEcho'];
  setReactScanLoaded: CommandProcessorInterface['setReactScanLoaded'];
  reactScanLoaded: CommandProcessorInterface['reactScanLoaded'];
  setBusinesses: CommandProcessorInterface['setBusinesses'];
  businesses: CommandProcessorInterface['businesses'];
  enterSelectionMode: CommandProcessorInterface['enterSelectionMode'];
  loadBusinessesList: CommandProcessorInterface['loadBusinessesList'];
  loadUsersList: CommandProcessorInterface['loadUsersList'];
  loadProductsForLookup: CommandProcessorInterface['loadProductsForLookup'];
  findProductsByName: CommandProcessorInterface['findProductsByName'];
  changeUserPassword: CommandProcessorInterface['changeUserPassword'];
  switchCurrentUserRole: CommandProcessorInterface['switchCurrentUserRole'];
  startBusinessImpersonation: CommandProcessorInterface['startBusinessImpersonation'];
  stopBusinessImpersonation: CommandProcessorInterface['stopBusinessImpersonation'];
  getBusinessImpersonationStatus: CommandProcessorInterface['getBusinessImpersonationStatus'];

  constructor(deps: CommandProcessorDeps) {
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
    this.switchCurrentUserRole = dataLoaders.switchCurrentUserRole;
    this.startBusinessImpersonation = dataLoaders.startBusinessImpersonation;
    this.stopBusinessImpersonation = dataLoaders.stopBusinessImpersonation;
    this.getBusinessImpersonationStatus = dataLoaders.getBusinessImpersonationStatus;
  }

  getAllCommandSuggestions() {
    return getAllCommandSuggestions();
  }

  getCommandSuggestions(input: string) {
    return getCommandSuggestions(input);
  }

  getAllRoutes() {
    return getAllRoutes();
  }

  filterRoutes(searchText: string) {
    return filterRoutes(searchText);
  }

  async executeCommand(command: string) {
    return executeCommand.call(this, command);
  }
}

export default CommandProcessor;
