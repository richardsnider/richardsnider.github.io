#!/usr/bin/env bash
set -ex

sudo apt-get install -y software-properties-common python-software-properties
sudo add-apt-repository -y ppa:hluk/copyq
sudo apt-get update -y
sudo apt-get install -y copyq