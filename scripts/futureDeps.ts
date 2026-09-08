import { execSync } from 'node:child_process';
import process from 'node:process';
import semver from 'semver';
import invariant from 'tiny-invariant';
import packageJson from '../package.json' with { type: 'json' };

// note to future developers, this file is overkill, but was fun to write

const installers = {
  cargo: (name: string) => execSync(`cargo install ${name} --locked`, { stdio: 'inherit' }),
};

const nonAlphanumeric = /^[^\p{L}\p{Nd}]+$/u;

export function isCmdAvailable(cmd: string) {
  try {
    console.log(`checking for ${cmd}`);
    if (nonAlphanumeric.test(cmd)) {
      throw new Error(`unsafe characters detected in '${cmd}'`);
    }
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const newLine = /\r?\n/;
const winRunnables = /\.(?:exe|cmd|bat)$/i;
export function resolveExecutable(name: string) {
  if (process.platform === 'win32') {
    const matches = execSync(`where ${name}`, { encoding: 'utf8' }).trim().split(newLine);
    const real = matches.find(p => winRunnables.test(p));
    if (real === null || real === undefined) {
      throw new Error(`No executable match for ${name} (found: ${matches.join(', ')})`);
    }
    return real;
  }
  return execSync(`which ${name}`, { encoding: 'utf8' }).trim().split(newLine)[0];
}

export function candidatePaths(name: string) {
  const cmd = process.platform === 'win32' ? `where ${name}` : `which -a ${name}`;
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim().split(newLine);
  } catch {
    return [];
  }
}

export function versionOf(path: string) {
  try {
    const out = execSync(`"${path}" --version`, { encoding: 'utf8' });

    const version = semver.coerce(out)?.version ?? null;
    return version as string;
  } catch {
    return null;
  }
}

interface FutureDependencySpec {
  version: string;
  installVia: 'cargo';
}

/**
 * Resolve (find+install) dependencies that are not yet available on NPM
 * @param name Name of the dependency
 * @param options
 * @param options.install whether to install or not
 * @returns path and version
 */
export function resolveFutureDependency(name: string, { install = false } = {}) {
  const futureDependencies = packageJson.futureDependencies as Record<string, FutureDependencySpec>;

  const spec = futureDependencies[name];
  invariant(spec !== undefined, `No futureDependencies entry for ${name}`);

  const found = candidatePaths(name)
    .map(path => ({ path, version: versionOf(path) }))
    .filter(c => c.version !== null)
    .sort((a, b) => semver.rcompare(a.version as string, b.version as string) ?? 0);

  const [best] = found;
  if (best && semver.gte(best.version as string, spec.version))
    // return early if best path found
    return { path: best.path, futureVersion: best.version };

  if (!install) {
  // best path not found and trying to install - failed to find
    throw new Error(`No ${name} >= ${spec.version} available.`);
  }
  const installer = installers[spec.installVia];
  if (installer === undefined) {
    throw new Error(`No installer registered for installVia: "${spec.installVia}"`);
  }
  console.warn(`Installing ${name} via ${spec.installVia}...`);
  installer(name);
  // confirm installation?
  return resolveFutureDependency(name, { install: false });
}
