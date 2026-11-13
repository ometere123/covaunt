#!/usr/bin/env bash
set -euo pipefail
: "${COVAUNT_ACCOUNT:?Export COVAUNT_ACCOUNT to a funded testnet account}"
: "${DAO_ACCOUNT:?Export DAO_ACCOUNT to a real Sputnik DAO on testnet}"
: "${COVAUNT_DEPLOY_CONFIRM:?Set COVAUNT_DEPLOY_CONFIRM=YES to acknowledge a live testnet deployment}"
if [[ "$COVAUNT_DEPLOY_CONFIRM" != YES ]];then echo 'Deployment confirmation not YES';exit 2;fi
command -v cargo >/dev/null || { echo 'Rust toolchain missing';exit 2; }
command -v near >/dev/null || { echo 'near-cli-rs missing';exit 2; }
cd "$(dirname "$0")/../contract"
echo 'Building Rust contract and running unit tests...'
cargo test
cargo near build non-reproducible-wasm --no-abi
WASM="target/near/covaunt.wasm"
[[ -s "$WASM" ]] || { echo "Expected WASM missing: $WASM";exit 3; }
echo "Building and deploying to ${COVAUNT_ACCOUNT} with DAO ${DAO_ACCOUNT}"
echo 'WARNING: reserve 5 NEAR to contract storage; verify account ownership and balances first.'
near contract deploy "$COVAUNT_ACCOUNT" use-file "$WASM" \
 with-init-call new json-args "{\"dao_id\":\"${DAO_ACCOUNT}\",\"name\":\"COVAUNT\"}" \
 prepaid-gas '100 Tgas' attached-deposit '5 NEAR' \
 network-config testnet sign-with-keychain send
printf '\nDeployment command executed. Verify state, transfer callback tests and key security before claiming release readiness.\n'
printf 'Run: COVAUNT_ACCOUNT=%s DAO_ACCOUNT=%s node scripts/audit-testnet.mjs\n' "$COVAUNT_ACCOUNT" "$DAO_ACCOUNT"
