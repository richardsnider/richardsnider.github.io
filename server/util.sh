b64url(){ openssl base64 -A | tr '+/' '-_' | tr -d '='; }
b64url_d(){ local s=$1; case $(( ${#s} % 4 )) in 2) s+='==';; 3) s+='=';; esac; printf '%s' "$s" | tr '_-' '/+' | openssl base64 -d -A; }
 
encode_id(){ printf '%016x' "$(( $1 ))" | xxd -r -p | b64url; }
decode_id(){ local ns=$(( 0x$(b64url_d "$1" | od -An -tx1 | tr -d ' \n') )); case "${2:-iso}" in
   http) date -u -r "$(( ns/1000000000 ))" '+%a, %d %b %Y %H:%M:%S GMT';;
   *) printf '%s.%09dZ\n' "$(date -u -r "$(( ns/1000000000 ))" '+%Y-%m-%dT%H:%M:%S')" "$(( ns%1000000000 ))";; esac; }
 
sign_jwt(){
   local header=$(printf '{"alg":"RS256","typ":"JWT"}' | b64url) payload=$(printf '%s' "$1" | b64url) signingInput signature
   signingInput="$header.$payload"
   signature=$(printf '%s' "$signingInput" | openssl dgst -sha256 -sign <(printf '%s' "$PRIVATE_KEY") | b64url)
   printf '%s.%s' "$signingInput" "$signature"
 }

verify_jwt(){
   local token=$1 payload signature signingInput
   payload=${token#*.}; payload=${payload%.*}
   signature=${token##*.}
   signingInput=${token%.*}
   openssl dgst -sha256 -verify <(printf '%s' "$PUBLIC_KEY") -signature <(b64url_d "$signature") <(printf '%s' "$signingInput") >/dev/null 2>&1 && b64url_d "$payload"
 }
 
hash_password(){ local salt=${2:-$(openssl rand -hex 16)}; printf '%s.%s' "$salt" "$(printf '%s' "$salt$1" | openssl dgst -sha256 | awk '{print $NF}')"; }

verify_password(){ [ -n "$2" ] && [ "$(hash_password "$1" "${2%%.*}")" = "$2" ]; }

log_memory() {
     local current_mem_bytes
     if [ -f "/sys/fs/cgroup/system.slice/fcgiwrap.service/memory.current" ]; then
         current_mem_bytes=$(<"/sys/fs/cgroup/system.slice/fcgiwrap.service/memory.current")
         local current_mem_mb=$(( current_mem_bytes / 1024 / 1024 ))
         printf '[WARN] [%s] High Memory Warning! API cluster using %dMB / 1000MB\n' \
                 "$(date)" "$current_mem_mb" >> /opt/api/events.log
     fi
}
