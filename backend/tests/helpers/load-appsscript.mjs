import fs from 'node:fs';
import vm from 'node:vm';

const PPG_SOURCE_FILES = ['Config.gs', 'Schema.gs', 'ApiCore.gs', 'Auth.gs', 'Parsers.gs', 'Canonical.gs', 'QueryService.gs', 'Repository.gs', 'SetupService.gs', 'ImportService.gs', 'ActionService.gs', 'HealthService.gs', 'Phase1ReadModel.gs', 'Rpc.gs'];

export const PHASE1_SOURCE_FILES = ['Config.gs', 'ApiCore.gs', 'Auth.gs', 'Phase1Repository.gs', 'Phase1ReadModel.gs', 'Rpc.gs'];

export function loadAppsScript(options = {}) {
  const sandbox = {
    Date,
    JSON,
    Math,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
  };
  const context = vm.createContext(sandbox);
  const sourceDirectory = options.sourceDirectory || `${process.cwd()}/backend/src`;
  const sourceFiles = options.sourceFiles || PPG_SOURCE_FILES;

  for (const fileName of sourceFiles) {
    const filePath = `${sourceDirectory}/${fileName}`;
    if (!fs.existsSync(filePath)) throw new Error(`Missing Apps Script source file: ${fileName}`);
    vm.runInContext(fs.readFileSync(filePath, 'utf8'), context, { filename: filePath });
  }

  return context;
}
