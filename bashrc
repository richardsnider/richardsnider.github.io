#!/usr/bin/env bash
export PATH=$PATH:/usr/local/go/bin

function search {
  grep $1 ~/.bashrc
}

alias symlink="ln -s"
alias list-apt-packages="sudo apt list --installed"
alias tty-ui="chvt 7"

function git_ps1 {
  local git_status="$(git status 2> /dev/null)"
  local on_branch=$(git branch --show-current 2> /dev/null)
  local on_commit=$(git rev-parse --short HEAD 2> /dev/null)

  if [[ $git_status =~ $on_branch ]]; then
    local branch=${BASH_REMATCH[1]}
    echo ":$on_branch($on_commit)"
  fi
}

PS1="[\D{%m-%d %T}]"
PS1+="\w"
PS1+="\$(git_ps1)"

PS1+="$ "
