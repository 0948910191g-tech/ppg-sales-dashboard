import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(SCRIPT_DIRECTORY, '..', '..');
export const PHASE1_PACKAGE_SOURCE_FILES = [
  'Config.gs',
  'ApiCore.gs',
  'Auth.gs',
  'Phase1Repository.gs',
  'Phase1ReadModel.gs',
  'Rpc.gs',
];
export const PHASE1_PACKAGE_FILES = [
  'appsscript.json',
  'dashboard.html',
  ...PHASE1_PACKAGE_SOURCE_FILES,
];

function isWithin(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function nearestExistingPath(candidate) {
  let current = candidate;
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) return current;
    current = parent;
  }
  return current;
}

function realCandidatePath(candidate) {
  const existing = nearestExistingPath(candidate);
  const stat = fs.lstatSync(existing);
  if (existing === candidate && stat.isSymbolicLink()) {
    throw new Error('Refusing a symbolic-link output directory.');
  }
  const realExisting = fs.realpathSync(existing);
  return path.resolve(realExisting, path.relative(existing, candidate));
}

function canonicalPath(directory) {
  return fs.existsSync(directory) ? fs.realpathSync(directory) : path.resolve(directory);
}

export function validateOutputDirectory(outputDirectory) {
  if (typeof outputDirectory !== 'string' || !outputDirectory.trim()) {
    throw new Error('An explicit output directory is required.');
  }

  const candidate = path.resolve(outputDirectory);
  const realCandidate = realCandidatePath(candidate);
  const filesystemRoot = path.parse(realCandidate).root;
  const homeDirectory = canonicalPath(os.homedir());
  const temporaryRoot = canonicalPath(os.tmpdir());
  const protectedProjectDirectories = [
    path.join(PROJECT_ROOT, 'backend'),
    path.join(PROJECT_ROOT, 'docs'),
    path.join(PROJECT_ROOT, 'handoff'),
  ].map((directory) => path.resolve(directory));

  if ([filesystemRoot, homeDirectory, temporaryRoot].includes(realCandidate)) {
    throw new Error('Refusing a broad output target; choose a dedicated directory.');
  }
  if (isWithin(PROJECT_ROOT, realCandidate)) {
    throw new Error('Refusing an output target that contains the project workspace.');
  }
  if (protectedProjectDirectories.some((directory) => isWithin(realCandidate, directory))) {
    throw new Error('Refusing an output target inside a protected project directory.');
  }

  if (fs.existsSync(candidate)) {
    const stat = fs.lstatSync(candidate);
    if (stat.isSymbolicLink()) throw new Error('Refusing a symbolic-link output directory.');
    if (!stat.isDirectory()) throw new Error('Output target must be a directory.');
    if (fs.readdirSync(candidate).length > 0) {
      throw new Error('Output directory must be empty; existing files will not be removed.');
    }
  }

  return candidate;
}

function readPackageInputs() {
  const sourceDirectory = path.join(PROJECT_ROOT, 'backend', 'src');
  const inputs = new Map();
  for (const fileName of PHASE1_PACKAGE_SOURCE_FILES) {
    const filePath = path.join(sourceDirectory, fileName);
    if (!fs.existsSync(filePath)) throw new Error(`Missing Phase 1 source file: ${fileName}`);
    inputs.set(fileName, fs.readFileSync(filePath));
  }

  const manifestPath = path.join(PROJECT_ROOT, 'backend', 'appsscript.json');
  const dashboardPath = path.join(PROJECT_ROOT, 'dashboard-reference-prototype.html');
  if (!fs.existsSync(manifestPath)) throw new Error('Missing Apps Script manifest: appsscript.json');
  if (!fs.existsSync(dashboardPath)) throw new Error('Missing latest dashboard UI: dashboard-reference-prototype.html.');
  inputs.set('appsscript.json', fs.readFileSync(manifestPath));
  inputs.set('dashboard.html', fs.readFileSync(dashboardPath));
  return inputs;
}

export function buildPhase1Package(outputDirectory) {
  const destination = validateOutputDirectory(outputDirectory);
  const inputs = readPackageInputs();
  fs.mkdirSync(destination, { recursive: true });
  for (const fileName of PHASE1_PACKAGE_FILES) {
    fs.writeFileSync(path.join(destination, fileName), inputs.get(fileName));
  }
  return { outputDirectory: destination, files: PHASE1_PACKAGE_FILES.slice() };
}

function parseOutputArgument(argumentsList) {
  if (argumentsList.length === 1) return argumentsList[0];
  if (argumentsList.length === 2 && ['--output', '--output-dir'].includes(argumentsList[0])) return argumentsList[1];
  throw new Error('Usage: node backend/scripts/build-phase1-appsscript.mjs <output-directory>');
}

const invokedScript = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedScript) {
  try {
    const result = buildPhase1Package(parseOutputArgument(process.argv.slice(2)));
    console.log(`Phase 1 Apps Script package created at ${result.outputDirectory}`);
    console.log(result.files.join('\n'));
  } catch (error) {
    console.error(`Phase 1 package build failed: ${error.message}`);
    process.exitCode = 1;
  }
}
