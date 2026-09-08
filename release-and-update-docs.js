// scripts/release.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import semver from 'semver';
import { resolveFutureDependency } from './scripts/futureDeps.ts';

const { path: gitCliff, futureVersion } = resolveFutureDependency('git-cliff', { install: true });

const tokenPath = join(homedir(), 'dev', '.secrets', 'git-cliff-github-token');
process.env.GITHUB_TOKEN = readFileSync(tokenPath, 'utf8').trim();

// 1) get the bumped version
// const version = execFileSync(gitCliff, ['--bumped-version'], { encoding: 'utf8' }).trim();

// 2) generate CHANGELOG.md
execFileSync(gitCliff, ['--output', 'CHANGELOG.md'], { stdio: 'inherit' });

// 3) generate README.md (--body-file needs git-cliff 2.14+)
if (semver.gte(futureVersion, '2.14.0')) {
  execFileSync(gitCliff, ['--body-file', 'readme-template.tera', '--output', 'README2.md'], { stdio: 'inherit' });
} else {
  console.warn(`Future version ${futureVersion} not found`);
}
// 4) prepare the release commit and tag
// execFileSync('git', ['add', 'CHANGELOG.md', 'README.md']);
// execFileSync('git', ['commit', '-m', `chore(release): v${version}`]);
// execFileSync('git', ['tag', '-a', `v${version}`, '-m', `v${version}`]);
