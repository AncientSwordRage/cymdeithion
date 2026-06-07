#!/usr/bin/env bash
set -euo pipefail

export GITHUB_TOKEN="$(cat ~/dev/.secrets/git-cliff-github-token)"

version="$(pnpm exec git-cliff --bumped-version)"

# 1) generate CHANGELOG.md
pnpm exec git-cliff --output CHANGELOG.md

# 2) generate README.md
pnpm exec git-cliff --body "$(cat readme-template.tera)" --output README2.md

# 4) prepare the release commit and tag
# git add CHANGELOG.md README.md
# git commit -m "chore(release): v${version}"
# git tag -a "v${version}" -m "v${version}"