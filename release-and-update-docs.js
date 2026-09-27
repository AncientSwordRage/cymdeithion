// scripts/release.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import which from 'which';

const gitCliff = which.sync('git-cliff', { nothrow: true });

const tokenPath = join(homedir(), 'dev', '.secrets', 'git-cliff-github-token');
process.env.GITHUB_TOKEN = readFileSync(tokenPath, 'utf8').trim();

// 1) get the bumped version
// const version = execFileSync(gitCliff, ['--bumped-version'], { encoding: 'utf8' }).trim();

// 2) generate CHANGELOG.md
execFileSync(gitCliff, ['--output', 'CHANGELOG.md'], { stdio: 'inherit', shell: true });

// 3) generate README.md
execFileSync(gitCliff, ['--body-file', 'readme-template.tera', '--output', 'README.md'], { stdio: 'inherit', shell: true });
// 4) generate CONTRIBUTING.md
execFileSync(gitCliff, ['--body-file', 'contributing-template.tera', '--output', 'CONTRIBUTING.md'], { stdio: 'inherit', shell: true });

// 4) prepare the release commit and tag
// execFileSync('git', ['add', 'CHANGELOG.md', 'README.md']);
// execFileSync('git', ['commit', '-m', `chore(release): v${version}`]);
// execFileSync('git', ['tag', '-a', `v${version}`, '-m', `v${version}`]);
