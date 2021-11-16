#!/usr/bin/env bash
set -ex

ssh-keygen -t ed25519 -C "" -N "" -f $HOME/.ssh/id_ed25519

echo "Host github.com
User git
Hostname github.com
PreferredAuthentications publickey
IdentityFile $HOME/.ssh/id_ed25519" >> $HOME/.ssh/config

cat $HOME/.ssh/id_ed25519.pub >> $HOME/.ssh/authorized_keys
chmod --recursive 700 $HOME/.ssh

eval "$(ssh-agent -s)"
ssh-add -qv $HOME/.ssh/id_ed25519

# test ssh connection to github
ssh -o StrictHostKeyChecking=no -vT git@github.com
