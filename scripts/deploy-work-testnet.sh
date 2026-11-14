#!/usr/bin/env bash
set -euo pipefail

: "${COVAUNT_WORK_ACCOUNT:?Export COVAUNT_WORK_ACCOUNT to the separately funded Work & Trust account}"
: "${COVAUNT_WORK_DAO:?Export COVAUNT_WORK_DAO to the existing Sputnik DAO account}"
: "${COVAUNT_WORK_DEPLOY_CONFIRM:?Set COVAUNT_WORK_DEPLOY_CONFIRM=YES immediately before a human-approved deployment}"

if [[ "$COVAUNT_WORK_DEPLOY_CONFIRM" != YES ]]; then
  echo 'Deployment confirmation not YES' >&2
  exit 2
fi
if [[ "$COVAUNT_WORK_ACCOUNT" == 'vault.covauntops26.testnet' ]]; then
  echo 'Refusing to use the deployed donor vault as the Work & Trust account' >&2
  exit 2
fi
if [[ "$COVAUNT_WORK_ACCOUNT" == "$COVAUNT_WORK_DAO" ]]; then
  echo 'Work account and DAO account must be different accounts' >&2
  exit 2
fi
if [[ ! "$COVAUNT_WORK_ACCOUNT" =~ ^[a-z0-9][a-z0-9._-]{1,63}$ || ! "$COVAUNT_WORK_DAO" =~ ^[a-z0-9][a-z0-9._-]{1,63}$ ]]; then
  echo 'Work and DAO account IDs must be canonical NEAR account IDs' >&2
  exit 2
fi

command -v near >/dev/null || { echo 'near-cli-rs missing' >&2; exit 2; }
WASM="${COVAUNT_WORK_WASM_FILE:-$(cd "$(dirname "$0")/.." && pwd)/work-contract/artifacts/covaunt_work.wasm}"
EXPECTED_SHA256="${COVAUNT_WORK_ARTIFACT_SHA256:-50e3ea76d1d0da8d2cdfaf977149e59c76277dd85a3c92e44baee54188204500}"
[[ -s "$WASM" ]] || { echo "Work WASM missing: $WASM" >&2; exit 3; }
ACTUAL_SHA256="$(sha256sum "$WASM" | awk '{print tolower($1)}')"
if [[ "$ACTUAL_SHA256" != "${EXPECTED_SHA256,,}" ]]; then
  echo "Work WASM hash mismatch: expected ${EXPECTED_SHA256,,}, got $ACTUAL_SHA256" >&2
  exit 3
fi

echo "Deploying the isolated Work & Trust contract to $COVAUNT_WORK_ACCOUNT on NEAR testnet"
echo "Binding large rewards and dispute resolution to $COVAUNT_WORK_DAO"
echo "WASM SHA-256: $ACTUAL_SHA256"
echo 'The signer must be the Work account owner; this script never reads a private key.'

near contract deploy "$COVAUNT_WORK_ACCOUNT" use-file "$WASM" \
  with-init-call new \
  json-args "{\"dao_id\":\"${COVAUNT_WORK_DAO}\",\"name\":\"COVAUNT Work\"}" \
  prepaid-gas '100 Tgas' attached-deposit '1 NEAR' \
  network-config testnet sign-with-keychain send

printf '\nDeployment submitted. Verify before enabling the frontend:\n'
printf 'COVAUNT_WORK_ACCOUNT=%s COVAUNT_WORK_DAO=%s node scripts/audit-work-testnet.mjs\n' "$COVAUNT_WORK_ACCOUNT" "$COVAUNT_WORK_DAO"
