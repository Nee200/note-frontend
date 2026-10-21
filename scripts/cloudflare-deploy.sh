#!/usr/bin/env bash
set -euo pipefail

# Cloudflare's tool installer may lag a new Node security release. Bootstrap
# with shell tools, then run every dependency/build/deploy step on this pin.
case "${1:-}" in deploy|preview|verify) mode="$1" ;; *) echo 'Usage: cloudflare-deploy.sh deploy|preview|verify' >&2; exit 2 ;; esac
task_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd -- "$task_root"
version='24.22.1'
checksum='6c172a9ab6718f7b801fb5a7bd486af2ee5e32758086a04b84fcce2aa77095e6'
[[ "$(tr -d '\r\n' < .node-version)" == "$version" ]] || { echo 'Update the verified Node archive pin alongside .node-version.' >&2; exit 1; }
[[ "$(uname -s)" == 'Linux' && "$(uname -m)" == 'x86_64' ]] || { echo 'This bootstrap is for Linux x64 build runners only.' >&2; exit 1; }
node_dir="$task_root/.cloudflare-node"
mkdir -p -- "$node_dir"
archive="$(mktemp "$node_dir/node-archive.XXXXXX")"
trap 'rm -f -- "$archive"' EXIT
curl --fail --silent --show-error --location --retry 3 --proto '=https' --tlsv1.2 \
  "https://nodejs.org/dist/v$version/node-v$version-linux-x64.tar.xz" --output "$archive"
printf '%s  %s\n' "$checksum" "$archive" | sha256sum --check --status
tar -xJf "$archive" --strip-components=1 -C "$node_dir"
export PATH="$node_dir/bin:$PATH"
export NODE_VERSION="$version"
[[ "$(node --version)" == "v$version" ]] || { echo 'Unexpected Node runtime.' >&2; exit 1; }
printf 'Verified build runtime: %s; npm %s\n' "$(node --version)" "$(npm --version)"
if [[ "$mode" == 'verify' ]]; then exit 0; fi
export PUPPETEER_SKIP_DOWNLOAD=true
npm ci
if [[ "$mode" == 'preview' ]]; then
  ./node_modules/.bin/wrangler versions upload
else
  ./node_modules/.bin/wrangler deploy
fi
