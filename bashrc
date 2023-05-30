#!/usr/bin/env bash
export PATH=$PATH:/usr/local/go/bin

function search-files {
  grep --recursive --ignore-case --line-number $1 ${2:-.}
}

function wiki {
  results=$(curl 'https://en.wikipedia.org/w/rest.php/v1/search/title?limit=10&q='$1 | yq '.pages | map(.key) | join(" ")')
  select opt in $results; do
    case $opt in
      *) curl 'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext&titles='$opt | yq .query.pages[].extract | less;
      break;;
    esac
  done
}

function hn {
  ALGOLIA_URL='https://uj5wyc0l7x-dsn.algolia.net/1/indexes/Item_production_ordered/query'
  ALGOLIA_PARAMS='?x-algolia-api-key=8ece23f8eb07cd25d40262a1764599b1&x-algolia-application-id=UJ5WYC0L7X'
  ONE_WEEK_AGO_EPOCH=$(date -d "1 week ago" +%s)
  curl --silent $ALGOLIA_URL$ALGOLIA_PARAMS --data-raw '{"page":0,"hitsPerPage":30,"numericFilters":["created_at_i>'$ONE_WEEK_AGO_EPOCH'"]}' > /tmp/hn-algolia.json
  HN_URL_PREFIX='https://news.ycombinator.com/item?id='
  yq '.hits[] | pick(["title", "url", "objectID", "points"])' /tmp/hn-algolia.json -P
}

alias notes="curl --silent richardsnider.github.io/notes.yaml | yq"
alias root-shell="sudo -s"
alias read-perms="chmod 755" # rwx for owner, rx for group and all users
alias symlink="ln -s"
alias list="ls -thal"
alias install-debian-file="dpkg --install" # ~/Downloads/some-package.deb
alias apt-purge="apt-get purge" # delete package and related configuration files
alias show-apt-repositories="ls /etc/apt/sources.list.d"
alias apt-list="sudo apt list --installed"
alias apt-dependencies="apt-cache --installed depends" # list dependencies
alias apt-reverse-dependencies="apt-cache --installed rdepends" # list dependents
alias tty-ui="chvt 7" # Alternative to Ctrl+Alt+F7
alias archive="tar --create --gzip --file" # (-czf) compressed archive file then target directory
alias extract="tar --extract --gzip --file" # (-xzf) compressed archive file
alias aws-metadata="curl http://169.254.169.254/latest/meta-data/"

function decrypt-folder {
  sudo mount -t ecryptfs  $1 $1 -o ecryptfs_cipher=aes,ecryptfs_key_bytes=32,ecryptfs_passthrough=n,ecryptfs_enable_filename_crypto=y 
  # enter passphrase and accept default FNEK signature, now add/edit files
  # unmount target folder to encrypt (should be done automatically on shutdown/reboot)
}

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
