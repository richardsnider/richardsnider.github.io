#!/usr/bin/env bash
set -ex

# https://github.com/nodesource/distributions/blob/master/README.md#debinstall
curl --silent https://deb.nodesource.com/setup_16.x | sudo -E bash
sudo apt-get install --yes nodejs
