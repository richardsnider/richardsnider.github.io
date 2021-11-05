#!/usr/bin/env bash
set -ex

export RELEASE_URL="https://api.github.com/repos/mozilla/sops/releases/latest"
export DOWNLOAD_URL=$(curl --silent $RELEASE_URL | jq -r '.assets[] | select(.browser_download_url | contains(".linux")).browser_download_url')
sudo curl -L $DOWNLOAD_URL --output /usr/bin/sops
chmod +x /usr/bin/sops
