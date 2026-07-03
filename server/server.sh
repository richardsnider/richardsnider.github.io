#!/bin/bash
# Path: /opt/api/server.sh   (nginx + fcgiwrap deployment; see api.nginx.conf)
# REQUEST_METHOD, DOCUMENT_URI, CONTENT_LENGTH, HTTP_AUTHORIZATION and REMOTE_ADDR are provided by nginx via fastcgi_params.

source "$(dirname "$0")/util.sh"
cd "$(dirname "$0")" || exit 1
set -x

REQ_BODY=""
[ "${CONTENT_LENGTH:-0}" -gt 0 ] && read -N "$CONTENT_LENGTH" -r REQ_BODY

# log_memory()

printf -v DATE '%(%a, %d %b %Y %H:%M:%S GMT)T' -1
export DATE
export ID=$(encode_id "${EPOCHREALTIME/./}000")

export ROUTE="$REQUEST_METHOD $DOCUMENT_URI"
export BODY="$REQ_BODY"
JWT="${HTTP_AUTHORIZATION#Bearer }"

# Log the request as one JSON line, redacting the body of token requests.
export PEER="$REMOTE_ADDR"
export LOGBODY="$BODY"; [ "$ROUTE" = "POST /token" ] && LOGBODY="<redacted>"
yq -I=0 -n '{"id":strenv(ID),"route":strenv(ROUTE),"peer":strenv(PEER),"body":strenv(LOGBODY)} | @json' >> events.log

export USER=$(verify_jwt "$JWT" | yq '.sub // ""' 2>/dev/null)
export RES=$(yq -n '{"s":"401","r":"Unauthorized"} | select(strenv(USER)=="") // {"s":"404","r":(strenv(ROUTE)+" Not Found")}')

export DATA_FILE=users/${USER:0:2}/${USER:2:2}/$USER.yaml
if [ "$ROUTE" = "POST /data" ] && [ -n "$USER" ]; then
  (
    flock -x 9
    ORIGINAL=$(<"$DATA_FILE")
    yq -I=0 -i 'env(BODY)' "$DATA_FILE"
    diff <(ORIGINAL="$ORIGINAL" yq -n -P 'env(ORIGINAL) | sort_keys(..)' -o=props) \
         <(yq -P 'sort_keys(..)' -o=props "$DATA_FILE") | yq -p=t '@json' >> events.log
  ) 9>"$DATA_FILE.lock"
  export RES='{"s":"200","r":"OK","b":{"status":"ok"}}'
fi

if [ "$ROUTE" = "POST /token" ]; then { set +x
  loginEmail=$(printf '%s' "$BODY" | yq -p=json '.email // ""' 2>/dev/null)
  loginId=$(printf '%s' "$loginEmail" | openssl dgst -sha256 | awk '{print $NF}')
  cred="users/${loginId:0:2}/${loginId:2:2}/$loginId.cred"
  storedHash=""; [ -f "$cred" ] && storedHash=$(<"$cred")
  verify_password "$(printf '%s' "$BODY" | yq -p=json '.password // ""' 2>/dev/null)" "$storedHash" &&
    export RES=$(TOK="$(sign_jwt "{\"sub\":\"$loginId\"}")" yq -n '{"s":"200","r":"OK","b":{"token":strenv(TOK)}}') ||
    export RES='{"s":"401","r":"Unauthorized","b":{}}'
  set -x; } 2>/dev/null
fi

# log_memory()

# Emit the FastCGI/CGI response. Under nginx we send a `Status:` header
yq -n 'env(RES) | (.b // ""|@json) as $body |
"Status: " + .s + " " + .r + "\r\n" +
"Date: " + strenv(DATE) + "\r\n" +
"Content-Type: application/json\r\n" +
"Content-Length: " + ($body | length | @json) + "\r\n" +
"\r\n" +
$body'
