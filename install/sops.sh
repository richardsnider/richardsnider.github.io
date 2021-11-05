#!/usr/bin/env bash
set -ex

export RELEASE_URL="https://api.github.com/repos/mozilla/sops/releases/latest"
sudo curl -L $(curl --silent $RELEASE_URL | jq -r '.assets[] | select(.browser_download_url | contains(".linux")).browser_download_url') > ~/usr/bin/sops
