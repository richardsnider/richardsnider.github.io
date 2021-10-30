#!/usr/bin/env bash
set -ex

# https://github.com/golang/go/wiki/Ubuntu
sudo add-apt-repository ppa:longsleep/golang-backports
sudo apt update
sudo apt install --yes golang-go
