#!/usr/bin/env bash
set -ex

# https://docs.brew.sh/Homebrew-on-Linux#alternative-installation
git clone https://github.com/Homebrew/brew $HOME/.linuxbrew/Homebrew
mkdir $HOME/.linuxbrew/bin
ln -s $HOME/.linuxbrew/Homebrew/bin/brew $HOME/.linuxbrew/bin
eval $($HOME/.linuxbrew/bin/brew shellenv)

brew update
brew upgrade
brew --version
