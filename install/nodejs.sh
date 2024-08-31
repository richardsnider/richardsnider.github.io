#!/usr/bin/env bash
set -ex

# https://nodejs.org/en/download/package-manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install stable
nvm use stable
